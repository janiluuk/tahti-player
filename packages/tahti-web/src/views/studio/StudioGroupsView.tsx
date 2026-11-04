import { useNavigate } from '@tanstack/react-router';
import { PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Button,
  ButtonLink,
  Input,
  MediaArtwork,
  Select,
  Textarea,
  Toggle,
  ViewShell,
} from '@tahti-player/ui';

import {
  createArtistGroup,
  fetchMyGroups,
  type GroupJoinPolicy,
  type GroupSubmitPolicy,
  type MyArtistGroup,
} from '../../api/groups';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import {
  groupCountLabel,
  JOIN_POLICY_OPTIONS,
  SUBMIT_POLICY_OPTIONS,
} from '../../lib/groupPeople';

const ROLE_LABEL = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
} as const;

export function StudioGroupsView() {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const [groups, setGroups] = useState<MyArtistGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [joinPolicy, setJoinPolicy] = useState<GroupJoinPolicy>('OPEN');
  const [submitPolicy, setSubmitPolicy] = useState<GroupSubmitPolicy>('OPEN');
  const [busy, setBusy] = useState(false);

  const reload = () => {
    void fetchMyGroups().then(({ data, meta }) => {
      setGroups(data);
      setError(meta.source === 'api' ? (meta.reason ?? null) : null);
      setLoading(false);
    });
  };

  useEffect(reload, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) {
      return;
    }
    setBusy(true);
    try {
      const result = await createArtistGroup({
        name: trimmed,
        description: description.trim() || undefined,
        isPublic,
        joinPolicy,
        submitPolicy,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t('toasts.groupCreated', { name: result.data.name }));
      void navigate({
        to: '/studio/groups/$slug',
        params: { slug: result.data.slug },
      });
    } finally {
      setBusy(false);
    }
  };

  const renderList = () => {
    if (loading) {
      return <PageLoading label={t('studioGroups.loading')} />;
    }
    if (error && groups.length === 0) {
      return (
        <PageError
          title={t('studioGroups.loadError')}
          description={error}
          onRetry={reload}
        />
      );
    }
    if (groups.length === 0) {
      return (
        <PageEmpty
          title={t('studioGroups.emptyTitle')}
          description={t('studioGroups.emptyDescription')}
        />
      );
    }
    return (
      <ul className="flex flex-col gap-2">
        {groups.map((group) => {
          const pending =
            group.pendingJoinRequestCount + group.pendingSubmissionCount;
          return (
            <li
              key={group.id}
              className="border-border bg-background flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-3 text-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <MediaArtwork
                  src={group.coverUrl ?? undefined}
                  alt=""
                  size="md"
                  className="rounded-md"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{group.name}</span>
                    <Badge variant="pill" color="secondary">
                      {ROLE_LABEL[group.role]}
                    </Badge>
                    {group.isPublic ? null : (
                      <Badge variant="pill" color="secondary">
                        Private
                      </Badge>
                    )}
                    {pending > 0 ? (
                      <Badge variant="pill" color="orange">
                        {pending} to review
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-foreground-secondary text-xs">
                    {groupCountLabel(group.memberCount, 'member', 'members')} ·{' '}
                    {groupCountLabel(group.itemCount, 'sound', 'sounds')}
                  </p>
                </div>
              </div>
              <ButtonLink
                to="/studio/groups/$slug"
                params={{ slug: group.slug }}
                size="sm"
                variant="secondary"
                aria-label={`${t('studioGroups.open')} ${group.name}`}
              >
                {t('studioGroups.open')}
              </ButtonLink>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-6">
        <ViewShell
          title={t('studioGroups.title')}
          subtitle={t('studioGroups.subtitle')}
          classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
          actions={
            creating ? null : (
              <Button size="sm" onClick={() => setCreating(true)}>
                <PlusIcon size={14} aria-hidden className="mr-1.5" />
                {t('studioGroups.newGroup')}
              </Button>
            )
          }
        >
          {creating ? (
            <StudioPanel
              title="New group"
              description="You become the owner. The collective playlist is created for you."
            >
              <form
                className="flex flex-col gap-3"
                onSubmit={(event) => void submit(event)}
              >
                <Input
                  label="Name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Trance Mixes and DJ Sets"
                  required
                />
                <Textarea
                  label="Description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                />
                <Select
                  label="Who can join"
                  value={joinPolicy}
                  onValueChange={(value) =>
                    setJoinPolicy(value as GroupJoinPolicy)
                  }
                  options={JOIN_POLICY_OPTIONS}
                />
                <Select
                  label="New sounds"
                  value={submitPolicy}
                  onValueChange={(value) =>
                    setSubmitPolicy(value as GroupSubmitPolicy)
                  }
                  options={SUBMIT_POLICY_OPTIONS}
                />
                <Toggle
                  label="Public"
                  showLabel
                  description="Public groups appear in the groups directory."
                  checked={isPublic}
                  onChange={setIsPublic}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={busy || !name.trim()}>
                    Create group
                  </Button>
                  <Button
                    type="button"
                    variant="text"
                    onClick={() => setCreating(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </StudioPanel>
          ) : null}
          <StudioPanel title={t('studioGroups.yourGroups')}>
            {renderList()}
          </StudioPanel>
        </ViewShell>
      </div>
    </StudioGate>
  );
}
