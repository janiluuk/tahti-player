import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeftIcon, ExternalLinkIcon, ListMusicIcon } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Button,
  ButtonLink,
  ConfirmDialog,
  Input,
  Select,
  Textarea,
  Toggle,
  ViewShell,
} from '@tahti-player/ui';

import {
  approveGroupSubmission,
  deleteArtistGroup,
  fetchGroupJoinRequests,
  fetchGroupSubmissions,
  fetchMyGroups,
  fetchPublicGroup,
  patchArtistGroup,
  rejectGroupSubmission,
  resolveGroupJoinRequest,
  type GroupJoinPolicy,
  type GroupJoinRequest,
  type GroupSoundSubmission,
  type GroupSubmitPolicy,
  type MyArtistGroup,
} from '../../api/groups';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import {
  groupMembersLabel,
  groupPersonName,
  groupSoundsLabel,
  joinPolicyOptions,
  submitPolicyOptions,
} from '../../lib/groupPeople';
import { apiResult, useSnapshotFetch } from '../../lib/useSnapshotFetch';
import { GroupMembersPanel } from './groups/GroupMembersPanel';

type Props = { slug: string };

type GroupSnapshot = {
  group: MyArtistGroup | null;
  founder: string | null;
  requests: GroupJoinRequest[];
  submissions: GroupSoundSubmission[];
};

const EMPTY_GROUP: GroupSnapshot = {
  group: null,
  founder: null,
  requests: [],
  submissions: [],
};

function GroupDetail({ slug }: Props) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const snapshot = useSnapshotFetch<GroupSnapshot>(
    `studio-group:${slug}`,
    async () => {
      const found =
        apiResult(await fetchMyGroups()).find((row) => row.slug === slug) ??
        null;
      if (!found) {
        return { group: null, founder: null, requests: [], submissions: [] };
      }
      const reviewer = found.role !== 'MEMBER';
      const [reqs, subs, pub] = await Promise.all([
        reviewer ? fetchGroupJoinRequests(slug) : null,
        reviewer ? fetchGroupSubmissions(slug) : null,
        fetchPublicGroup(slug),
      ]);
      return {
        group: found,
        founder: pub.data?.createdBy.username ?? null,
        requests: reqs?.data ?? [],
        submissions: subs?.data ?? [],
      };
    },
  );
  const { group, founder, requests, submissions } =
    snapshot.data ?? EMPTY_GROUP;
  const { loading, error, retry: reload } = snapshot;
  const update = (patch: (current: GroupSnapshot) => Partial<GroupSnapshot>) =>
    snapshot.mutate((current) => {
      const base = current ?? EMPTY_GROUP;
      return { ...base, ...patch(base) };
    });
  const setGroup = (next: (current: MyArtistGroup) => MyArtistGroup) =>
    update((current) => ({
      group: current.group ? next(current.group) : null,
    }));
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [joinPolicy, setJoinPolicy] = useState<GroupJoinPolicy>('OPEN');
  const [submitPolicy, setSubmitPolicy] = useState<GroupSubmitPolicy>('OPEN');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [seeded, setSeeded] = useState<MyArtistGroup | null>(null);
  const formDirty =
    seeded !== null &&
    (name !== seeded.name ||
      description !== (seeded.description ?? '') ||
      coverUrl !== (seeded.coverUrl ?? '') ||
      isPublic !== seeded.isPublic ||
      joinPolicy !== seeded.joinPolicy ||
      submitPolicy !== seeded.submitPolicy);

  const seedForm = (next: MyArtistGroup) => {
    setSeeded(next);
    setName(next.name);
    setDescription(next.description ?? '');
    setCoverUrl(next.coverUrl ?? '');
    setIsPublic(next.isPublic);
    setJoinPolicy(next.joinPolicy);
    setSubmitPolicy(next.submitPolicy);
  };

  if (group && group !== seeded && !formDirty) {
    seedForm(group);
  }

  const canManage = group?.role === 'OWNER' || group?.role === 'ADMIN';

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!group || !trimmed || saving) {
      return;
    }
    setSaving(true);
    try {
      const result = await patchArtistGroup(slug, {
        name: trimmed,
        description: description.trim() || null,
        coverUrl: coverUrl.trim() || null,
        isPublic,
        joinPolicy,
        submitPolicy,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const saved = { ...group, ...result.data };
      setGroup(() => saved);
      seedForm(saved);
      toast.success(t('studioGroups.saved'));
    } finally {
      setSaving(false);
    }
  };

  const resolveRequest = async (
    request: GroupJoinRequest,
    action: 'APPROVE' | 'REJECT',
  ) => {
    setBusyId(request.id);
    try {
      const result = await resolveGroupJoinRequest(slug, request.id, action);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      update((current) => ({
        requests: current.requests.filter((row) => row.id !== request.id),
      }));
      toast.success(
        action === 'APPROVE'
          ? t('studioGroups.memberJoined', {
              name: groupPersonName(request.user),
            })
          : t('studioGroups.requestDeclined'),
      );
    } finally {
      setBusyId(null);
    }
  };

  const resolveSubmission = async (
    submission: GroupSoundSubmission,
    action: 'approve' | 'reject',
  ) => {
    setBusyId(submission.id);
    try {
      const result =
        action === 'approve'
          ? await approveGroupSubmission(slug, submission.id)
          : await rejectGroupSubmission(slug, submission.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      update((current) => ({
        submissions: current.submissions.filter(
          (row) => row.id !== submission.id,
        ),
      }));
      toast.success(
        action === 'approve'
          ? t('studioGroups.submissionAdded')
          : t('studioGroups.submissionDeclined'),
      );
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    setConfirmDelete(false);
    const result = await deleteArtistGroup(slug);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(t('studioGroups.deleted'));
    void navigate({ to: '/studio/groups' });
  };

  if (loading) {
    return <PageLoading label={t('studioGroups.loadingGroup')} />;
  }

  if (!group) {
    return (
      <PageError
        title={t('studioGroups.notFound')}
        description={error ?? t('studioGroups.notMember')}
        onRetry={reload}
      />
    );
  }

  return (
    <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-6">
      <ViewShell
        title={group.name}
        subtitle={`${groupMembersLabel(group.memberCount, t)} · ${groupSoundsLabel(group.itemCount, t)}`}
        classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink
              to="/studio/groups"
              size="sm"
              variant="text"
              aria-label={t('studioGroups.backToGroups')}
            >
              <ArrowLeftIcon size={14} aria-hidden className="mr-1.5" />
              {t('studioGroups.groups')}
            </ButtonLink>
            <ButtonLink
              to="/groups/$slug"
              params={{ slug }}
              size="sm"
              variant="secondary"
            >
              <ExternalLinkIcon size={14} aria-hidden className="mr-1.5" />
              {t('studioGroups.publicPage')}
            </ButtonLink>
            {founder ? (
              <ButtonLink
                to="/u/$username/c/$slug"
                params={{ username: founder, slug: group.collectionSlug }}
                size="sm"
                variant="secondary"
              >
                <ListMusicIcon size={14} aria-hidden className="mr-1.5" />
                {t('studioGroups.collectivePlaylist')}
              </ButtonLink>
            ) : null}
          </div>
        }
      >
        {error ? (
          <PageErrorBanner
            title={t('studioGroups.refreshError')}
            description={error}
            onRetry={reload}
          />
        ) : null}
        {canManage ? (
          <StudioPanel
            title={t('studioGroups.settingsTitle')}
            description={t('studioGroups.settingsDescription')}
          >
            <form
              className="flex flex-col gap-3"
              onSubmit={(event) => void save(event)}
            >
              <Input
                label={t('studioGroups.name')}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
              <Textarea
                label={t('studioGroups.description')}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
              />
              <Input
                label={t('studioGroups.coverUrl')}
                value={coverUrl}
                onChange={(event) => setCoverUrl(event.target.value)}
                placeholder="https://"
              />
              <Select
                label={t('studioGroups.whoCanJoin')}
                value={joinPolicy}
                onValueChange={(value) =>
                  setJoinPolicy(value as GroupJoinPolicy)
                }
                options={joinPolicyOptions(t)}
              />
              <Select
                label={t('studioGroups.newSounds')}
                value={submitPolicy}
                onValueChange={(value) =>
                  setSubmitPolicy(value as GroupSubmitPolicy)
                }
                options={submitPolicyOptions(t)}
              />
              <Toggle
                label={t('studioGroups.public')}
                showLabel
                description={t('studioGroups.publicDescription')}
                checked={isPublic}
                onChange={setIsPublic}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={saving || !name.trim()}>
                  {t('studioGroups.saveSettings')}
                </Button>
                {group.role === 'OWNER' ? (
                  <Button
                    type="button"
                    variant="text"
                    onClick={() => setConfirmDelete(true)}
                  >
                    {t('studioGroups.deleteGroup')}
                  </Button>
                ) : null}
              </div>
            </form>
          </StudioPanel>
        ) : (
          <StudioPanel title={t('studioGroups.membershipTitle')}>
            <p className="text-foreground-secondary text-sm">
              {t('studioGroups.membershipDescription')}
            </p>
          </StudioPanel>
        )}

        <GroupMembersPanel
          slug={group.slug}
          viewerRole={group.role}
          onTransferred={() =>
            setGroup((current) => ({ ...current, role: 'ADMIN' }))
          }
          onMembersChanged={() =>
            setGroup((current) => ({
              ...current,
              memberCount: Math.max(0, current.memberCount - 1),
            }))
          }
        />

        {canManage ? (
          <StudioPanel
            title={t('studioGroups.joinRequestsTitle')}
            description={t('studioGroups.joinRequestsDescription')}
            action={
              requests.length > 0 ? (
                <Badge variant="pill" color="orange">
                  {requests.length}
                </Badge>
              ) : null
            }
          >
            {requests.length === 0 ? (
              <PageEmpty title={t('studioGroups.joinRequestsEmpty')} />
            ) : (
              <ul className="flex flex-col gap-2">
                {requests.map((request) => (
                  <li
                    key={request.id}
                    className="border-border bg-background flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                  >
                    <Link
                      to="/u/$username"
                      params={{ username: request.user.username }}
                      className="font-medium hover:underline"
                    >
                      {groupPersonName(request.user)}
                    </Link>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        disabled={busyId === request.id}
                        onClick={() => void resolveRequest(request, 'APPROVE')}
                      >
                        {t('studioGroups.approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="text"
                        disabled={busyId === request.id}
                        onClick={() => void resolveRequest(request, 'REJECT')}
                      >
                        {t('studioGroups.decline')}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </StudioPanel>
        ) : null}

        {canManage ? (
          <StudioPanel
            title={t('studioGroups.submissionsTitle')}
            description={t('studioGroups.submissionsDescription')}
            action={
              submissions.length > 0 ? (
                <Badge variant="pill" color="orange">
                  {submissions.length}
                </Badge>
              ) : null
            }
          >
            {submissions.length === 0 ? (
              <PageEmpty title={t('studioGroups.submissionsEmpty')} />
            ) : (
              <ul className="flex flex-col gap-2">
                {submissions.map((submission) => (
                  <li
                    key={submission.id}
                    className="border-border bg-background flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <Link
                        to="/t/$id"
                        params={{ id: submission.sound.id }}
                        className="font-medium hover:underline"
                      >
                        {submission.sound.title}
                      </Link>
                      <p className="text-foreground-secondary text-xs">
                        {t('studioGroups.submittedBy', {
                          name: groupPersonName(submission.submittedBy),
                        })}
                      </p>
                      {submission.note ? (
                        <p className="text-foreground-secondary text-xs">
                          {submission.note}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        disabled={busyId === submission.id}
                        onClick={() =>
                          void resolveSubmission(submission, 'approve')
                        }
                      >
                        {t('studioGroups.approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="text"
                        disabled={busyId === submission.id}
                        onClick={() =>
                          void resolveSubmission(submission, 'reject')
                        }
                      >
                        {t('studioGroups.reject')}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </StudioPanel>
        ) : null}
      </ViewShell>
      <ConfirmDialog
        isOpen={confirmDelete}
        title={t('studioGroups.deleteTitle', { name: group.name })}
        description={t('studioGroups.deleteDescription')}
        confirmLabel={t('studioGroups.deleteGroup')}
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}

export function StudioGroupDetailView({ slug }: Props) {
  return (
    <StudioGate>
      <GroupDetail slug={slug} />
    </StudioGate>
  );
}
