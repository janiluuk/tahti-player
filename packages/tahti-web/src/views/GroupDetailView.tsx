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

const ROLE_LABEL = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
} as const;

export function GroupDetailView({ slug }: { slug: string }) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const openAuth = useAuthModalStore((s) => s.open);
  const [group, setGroup] = useState<PublicGroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    void fetchPublicGroup(slug).then(({ data, meta }) => {
      setGroup(data);
      setError(
        data
          ? null
          : meta.source === 'api' && meta.reason
            ? meta.reason
            : 'This group does not exist or is private.',
      );
      setLoading(false);
    });
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    reload();
  }, [reload, me?.id]);

  if (loading && !group) {
    return <PageLoading label="Loading group…" />;
  }

  if (!group) {
    return (
      <PageError
        title="Group not found"
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
        result.pending ? 'Request sent to the group admins' : 'You joined',
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
      toast.error("Couldn't start a Jam for this group's playlist.");
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
          Leave group
        </Button>
      );
    }
    if (group.viewer.joinRequestPending) {
      return (
        <Badge variant="pill" color="secondary">
          Request pending
        </Badge>
      );
    }
    return (
      <Button size="sm" disabled={busy} onClick={() => void join()}>
        <UserPlusIcon size={14} aria-hidden className="mr-1.5" />
        {group.joinPolicy === 'REQUEST' ? 'Request to join' : 'Join group'}
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
            alt={`${group.name} cover`}
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
              Started by{' '}
              <Link
                to="/u/$username"
                params={{ username: group.createdBy.username }}
                className="hover:text-foreground underline-offset-2 hover:underline"
              >
                {groupPersonName(group.createdBy)}
              </Link>
              {role ? ` · You are ${ROLE_LABEL[role].toLowerCase()}` : ''}
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
                Collective playlist
              </ButtonLink>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy || group.itemCount === 0}
                onClick={() => void listenTogether()}
              >
                <HeadphonesIcon size={14} aria-hidden className="mr-1.5" />
                Listen together
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
                  Manage
                </ButtonLink>
              ) : null}
            </div>
            <p className="text-foreground-secondary text-xs">
              {group.joinPolicy === 'REQUEST'
                ? 'Admins approve new members.'
                : 'Anyone can join.'}{' '}
              {group.submitPolicy === 'APPROVE'
                ? 'New sounds are approved by admins first.'
                : 'Members add sounds right away.'}
            </p>
          </div>
        </div>

        <StudioPanel
          title="Members"
          description={groupCountLabel(group.memberCount, 'member', 'members')}
        >
          <ul className="grid gap-2 sm:grid-cols-2" aria-label="Members">
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
                  {ROLE_LABEL[member.role]}
                </Badge>
              </li>
            ))}
          </ul>
        </StudioPanel>
      </ViewShell>
    </div>
  );
}
