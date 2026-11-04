import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeftIcon, ExternalLinkIcon, ListMusicIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';

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
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import {
  groupCountLabel,
  groupPersonName,
  JOIN_POLICY_OPTIONS,
  SUBMIT_POLICY_OPTIONS,
} from '../../lib/groupPeople';

type Props = { slug: string };

function GroupDetail({ slug }: Props) {
  const navigate = useNavigate();
  const [group, setGroup] = useState<MyArtistGroup | null>(null);
  const [founder, setFounder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<GroupJoinRequest[]>([]);
  const [submissions, setSubmissions] = useState<GroupSoundSubmission[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [joinPolicy, setJoinPolicy] = useState<GroupJoinPolicy>('OPEN');
  const [submitPolicy, setSubmitPolicy] = useState<GroupSubmitPolicy>('OPEN');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const applyGroup = useCallback((next: MyArtistGroup) => {
    setGroup(next);
    setName(next.name);
    setDescription(next.description ?? '');
    setCoverUrl(next.coverUrl ?? '');
    setIsPublic(next.isPublic);
    setJoinPolicy(next.joinPolicy);
    setSubmitPolicy(next.submitPolicy);
  }, []);

  const loadReview = useCallback(
    async (role: MyArtistGroup['role']) => {
      if (role === 'MEMBER') {
        setRequests([]);
        setSubmissions([]);
        return;
      }
      const [reqs, subs] = await Promise.all([
        fetchGroupJoinRequests(slug),
        fetchGroupSubmissions(slug),
      ]);
      setRequests(reqs.data);
      setSubmissions(subs.data);
    },
    [slug],
  );

  const reload = useCallback(() => {
    setLoading(true);
    void fetchMyGroups().then(async ({ data, meta }) => {
      const found = data.find((row) => row.slug === slug) ?? null;
      if (found) {
        applyGroup(found);
        setError(null);
        await loadReview(found.role);
        const pub = await fetchPublicGroup(slug);
        setFounder(pub.data?.createdBy.username ?? null);
      } else {
        setGroup(null);
        setError(
          meta.source === 'api' && meta.reason
            ? meta.reason
            : 'This group does not exist or you are not a member.',
        );
      }
      setLoading(false);
    });
  }, [slug, loadReview, applyGroup]);

  useEffect(reload, [reload]);

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
      applyGroup({ ...group, ...result.data });
      toast.success('Group saved');
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
      setRequests((prev) => prev.filter((row) => row.id !== request.id));
      toast.success(
        action === 'APPROVE'
          ? `${groupPersonName(request.user)} joined`
          : 'Request declined',
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
      setSubmissions((prev) => prev.filter((row) => row.id !== submission.id));
      toast.success(
        action === 'approve' ? 'Added to the playlist' : 'Submission declined',
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
    toast.success('Group deleted');
    void navigate({ to: '/studio/groups' });
  };

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

  return (
    <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-6">
      <ViewShell
        title={group.name}
        subtitle={`${groupCountLabel(group.memberCount, 'member', 'members')} · ${groupCountLabel(group.itemCount, 'sound', 'sounds')}`}
        classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink
              to="/studio/groups"
              size="sm"
              variant="text"
              aria-label="Back to groups"
            >
              <ArrowLeftIcon size={14} aria-hidden className="mr-1.5" />
              Groups
            </ButtonLink>
            <ButtonLink
              to="/groups/$slug"
              params={{ slug }}
              size="sm"
              variant="secondary"
            >
              <ExternalLinkIcon size={14} aria-hidden className="mr-1.5" />
              Public page
            </ButtonLink>
            {founder ? (
              <ButtonLink
                to="/u/$username/c/$slug"
                params={{ username: founder, slug: group.collectionSlug }}
                size="sm"
                variant="secondary"
              >
                <ListMusicIcon size={14} aria-hidden className="mr-1.5" />
                Collective playlist
              </ButtonLink>
            ) : null}
          </div>
        }
      >
        {canManage ? (
          <StudioPanel
            title="Settings"
            description="Who can join and how new sounds reach the collective playlist."
          >
            <form
              className="flex flex-col gap-3"
              onSubmit={(event) => void save(event)}
            >
              <Input
                label="Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
              <Textarea
                label="Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
              />
              <Input
                label="Cover image URL"
                value={coverUrl}
                onChange={(event) => setCoverUrl(event.target.value)}
                placeholder="https://"
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
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={saving || !name.trim()}>
                  Save settings
                </Button>
                {group.role === 'OWNER' ? (
                  <Button
                    type="button"
                    variant="text"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete group
                  </Button>
                ) : null}
              </div>
            </form>
          </StudioPanel>
        ) : (
          <StudioPanel title="Your membership">
            <p className="text-foreground-secondary text-sm">
              You are a member. Add sounds to this group from a sound&apos;s
              Groups card in your library. Owners and admins manage settings.
            </p>
          </StudioPanel>
        )}

        {canManage ? (
          <StudioPanel
            title="Join requests"
            description="People asking to join this group."
            action={
              requests.length > 0 ? (
                <Badge variant="pill" color="orange">
                  {requests.length}
                </Badge>
              ) : null
            }
          >
            {requests.length === 0 ? (
              <PageEmpty title="No pending requests" />
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
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="text"
                        disabled={busyId === request.id}
                        onClick={() => void resolveRequest(request, 'REJECT')}
                      >
                        Decline
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
            title="Sound submissions"
            description="Sounds waiting to join the collective playlist."
            action={
              submissions.length > 0 ? (
                <Badge variant="pill" color="orange">
                  {submissions.length}
                </Badge>
              ) : null
            }
          >
            {submissions.length === 0 ? (
              <PageEmpty title="No pending submissions" />
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
                        by {groupPersonName(submission.submittedBy)}
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
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="text"
                        disabled={busyId === submission.id}
                        onClick={() =>
                          void resolveSubmission(submission, 'reject')
                        }
                      >
                        Reject
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
        title={`Delete ${group.name}?`}
        description="The group and its collective playlist are removed for everyone. This cannot be undone."
        confirmLabel="Delete group"
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
