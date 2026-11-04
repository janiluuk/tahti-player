import { Link, useNavigate } from '@tanstack/react-router';
import {
  HeadphonesIcon,
  ListMusicIcon,
  LogOutIcon,
  SettingsIcon,
  UserPlusIcon,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Button,
  ButtonLink,
  MediaArtwork,
  ViewShell,
} from '@tahti-player/ui';

import {
  fetchPublicGroup,
  joinArtistGroup,
  leaveArtistGroup,
  type PublicGroupDetail,
} from '../api/groups';
import { createJam } from '../api/jam';
import { PageError, PageLoading } from '../components/PageStates';
import { StudioPanel } from '../components/StudioPanel';
import { groupCountLabel, groupPersonName } from '../lib/groupPeople';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';

export function GroupDetailView({ slug }: { slug: string }) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const openAuth = useAuthModalStore((s) => s.open);
  const [group, setGroup] = useState<PublicGroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const roleLabel = {
    OWNER: t('groupDetail.roleOwner'),
    ADMIN: t('groupDetail.roleAdmin'),
    MEMBER: t('groupDetail.roleMember'),
  } as const;

  const reload = useCallback(() => {
    void fetchPublicGroup(slug).then(({ data, meta }) => {
      setGroup(data);
      setError(
        data
          ? null
          : meta.source === 'api' && meta.reason
            ? meta.reason
            : t('groupDetail.privateOrMissing'),
      );
      setLoading(false);
    });
  }, [slug, t]);

  useEffect(() => {
    setLoading(true);
    reload();
  }, [reload, me?.id]);

  if (loading && !group) {
    return <PageLoading label={t('groupDetail.loading')} />;
  }

  if (!group) {
    return (
      <PageError
        title={t('groupDetail.notFound')}
        description={error ?? undefined}
        onRetry={reload}
      />
    );
  }

  const role = group.viewer.role;
  const isMember = role !== null;
  const canManage = role === 'OWNER' || role === 'ADMIN';

  const join = async () => {
    if (!me) {
      openAuth('login');
      return;
    }
    setBusy(true);
    try {
      const result = await joinArtistGroup(slug);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.pending ? t('groupDetail.requestSent') : t('groupDetail.joined'),
      );
      reload();
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    setBusy(true);
    try {
      const result = await leaveArtistGroup(slug);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t('toasts.leftGroup'));
      reload();
    } finally {
      setBusy(false);
    }
  };

  const listenTogether = async () => {
    if (!me) {
      openAuth('login');
      return;
    }
    setBusy(true);
    try {
      const session = await createJam(group.collectionSlug);
      void navigate({ to: '/jam/$code', params: { code: session.code } });
    } catch {
      toast.error(t('groupDetail.jamError'));
    } finally {
      setBusy(false);
    }
  };

  const renderMembership = () => {
    if (role === 'OWNER') {
      return null;
    }
    if (isMember) {
      return (
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => void leave()}
        >
          <LogOutIcon size={14} aria-hidden className="mr-1.5" />
          {t('groupDetail.leave')}
        </Button>
      );
    }
    if (group.viewer.joinRequestPending) {
      return (
        <Badge variant="pill" color="secondary">
          {t('groupDetail.requestPending')}
        </Badge>
      );
    }
    return (
      <Button size="sm" disabled={busy} onClick={() => void join()}>
        <UserPlusIcon size={14} aria-hidden className="mr-1.5" />
        {group.joinPolicy === 'REQUEST'
          ? t('groupDetail.requestToJoin')
          : t('groupDetail.join')}
      </Button>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-1 py-2">
      <ViewShell
        title={group.name}
        subtitle={`${groupCountLabel(group.memberCount, 'member', 'members')} · ${groupCountLabel(group.itemCount, 'sound', 'sounds')}`}
        classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
      >
        <div className="flex flex-wrap items-start gap-4">
          <MediaArtwork
            src={group.coverUrl ?? undefined}
            alt={t('groupDetail.coverAlt', { name: group.name })}
            size="lg"
            className="rounded-xl"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            {group.description ? (
              <p className="text-foreground-secondary text-sm whitespace-pre-wrap">
                {group.description}
              </p>
            ) : null}
            <p className="text-foreground-secondary text-xs">
              {t('groupDetail.startedBy')}{' '}
              <Link
                to="/u/$username"
                params={{ username: group.createdBy.username }}
                className="hover:text-foreground underline-offset-2 hover:underline"
              >
                {groupPersonName(group.createdBy)}
              </Link>
              {role
                ? ` · ${t('groupDetail.youAre', { role: roleLabel[role].toLowerCase() })}`
                : ''}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <ButtonLink
                to="/u/$username/c/$slug"
                params={{
                  username: group.createdBy.username,
                  slug: group.collectionSlug,
                }}
                size="sm"
              >
                <ListMusicIcon size={14} aria-hidden className="mr-1.5" />
                {t('groupDetail.collectivePlaylist')}
              </ButtonLink>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy || group.itemCount === 0}
                onClick={() => void listenTogether()}
              >
                <HeadphonesIcon size={14} aria-hidden className="mr-1.5" />
                {t('groupDetail.listenTogether')}
              </Button>
              {renderMembership()}
              {canManage ? (
                <ButtonLink
                  to="/studio/groups/$slug"
                  params={{ slug }}
                  size="sm"
                  variant="text"
                >
                  <SettingsIcon size={14} aria-hidden className="mr-1.5" />
                  {t('actions.manage')}
                </ButtonLink>
              ) : null}
            </div>
            <p className="text-foreground-secondary text-xs">
              {group.joinPolicy === 'REQUEST'
                ? t('groupDetail.joinPolicyRequest')
                : t('groupDetail.joinPolicyOpen')}{' '}
              {group.submitPolicy === 'APPROVE'
                ? t('groupDetail.submitApprove')
                : t('groupDetail.submitOpen')}
            </p>
          </div>
        </div>

        <StudioPanel
          title={t('groupDetail.members')}
          description={groupCountLabel(group.memberCount, 'member', 'members')}
        >
          <ul
            className="grid gap-2 sm:grid-cols-2"
            aria-label={t('groupDetail.members')}
          >
            {group.members.map((member) => (
              <li
                key={member.username}
                className="border-border bg-background flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <Link
                  to="/u/$username"
                  params={{ username: member.username }}
                  className="min-w-0 truncate font-medium hover:underline"
                >
                  {groupPersonName(member)}
                </Link>
                <Badge variant="pill" color="secondary">
                  {roleLabel[member.role]}
                </Badge>
              </li>
            ))}
          </ul>
        </StudioPanel>
      </ViewShell>
    </div>
  );
}
