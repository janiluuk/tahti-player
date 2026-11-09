import { Link } from '@tanstack/react-router';
import { LightbulbIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Button,
  ButtonLink,
  Input,
  Textarea,
  ViewShell,
} from '@tahti-player/ui';

import {
  createFeatureRequest,
  fetchFeatureRequestComments,
  fetchFeatureRequests,
  postFeatureRequestComment,
  voteFeatureRequest,
  type MotionComment,
} from '../api/client';
import type { FeatureRequest, FeatureRequestStatus } from '../api/types';
import { ListingDate } from '../components/ListingDate';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { useSettingsModalStore } from '../stores/settingsModalStore';

const STATUS_BADGE: Record<
  FeatureRequestStatus,
  { color: 'blue' | 'purple' | 'orange' | 'green' | 'secondary'; label: string }
> = {
  OPEN: { color: 'blue', label: 'Open' },
  PLANNED: { color: 'purple', label: 'Planned' },
  IN_PROGRESS: { color: 'orange', label: 'In progress' },
  DONE: { color: 'green', label: 'Done' },
  DECLINED: { color: 'secondary', label: 'Declined' },
  DUPLICATE: { color: 'secondary', label: 'Duplicate' },
};

export function FeatureRequestsView({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const closeSettings = useSettingsModalStore((s) => s.close);
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [comments, setComments] = useState<MotionComment[]>([]);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);

  const [composerOpen, setComposerOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reload = () => {
    if (!user) {
      return;
    }
    void fetchFeatureRequests().then((res) => {
      setRequests(res.data);
      setForbidden(Boolean(res.forbidden) && res.data.length === 0);
      setLoadError(
        !res.forbidden && res.meta.source === 'api'
          ? (res.meta.reason ?? null)
          : null,
      );
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setRequests([]);
      setForbidden(true);
      return;
    }
    setLoading(true);
    reload();
  }, [user]);

  const openThread = (id: string) => {
    setExpandedId(id);
    setCommentBody('');
    setCommentsError(null);
    void fetchFeatureRequestComments(id).then((res) => {
      setComments(res.data);
      setCommentsError(
        res.meta.source === 'api' ? (res.meta.reason ?? null) : null,
      );
    });
  };

  const body = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {!embedded ? (
          <Link
            to="/governance"
            onClick={closeSettings}
            className="text-foreground-secondary text-xs hover:underline"
          >
            ← Governance
          </Link>
        ) : (
          <ButtonLink
            to="/governance/feature-requests"
            size="sm"
            variant="secondary"
          >
            {t('featureRequestsView.openFullPage')}
          </ButtonLink>
        )}
        {user && !forbidden ? (
          <Button
            size="sm"
            variant={composerOpen ? 'secondary' : 'default'}
            onClick={() => setComposerOpen((v) => !v)}
          >
            {composerOpen
              ? t('featureRequestsViewStates.cancel')
              : t('featureRequestsViewStates.proposeAnIdea')}
          </Button>
        ) : null}
      </div>

      {!user && (
        <div className="border-border flex flex-col gap-3 rounded-lg border p-4">
          <p className="text-sm">
            {t('featureRequestsView.signInWithACooperative')}
          </p>
          <Button
            size="sm"
            onClick={() => useAuthModalStore.getState().open('login')}
          >
            {t('featureRequestsView.logIn')}
          </Button>
        </div>
      )}

      {user && loading && <PageLoading label={t('loading.loadingRequests')} />}

      {user && !loading && forbidden && (
        <div className="border-border flex flex-col gap-3 rounded-lg border p-4">
          <p className="text-sm">
            Feature requests are gated to active Tahti ry members. Signed in as
            @{user.username}.
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => useSettingsModalStore.getState().open('account')}
          >
            {t('featureRequestsView.manageMembership')}
          </Button>
        </div>
      )}

      {composerOpen && (
        <form
          className="border-border flex flex-col gap-3 rounded-lg border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitting(true);
            void createFeatureRequest({
              title: newTitle.trim(),
              description: newDescription.trim(),
            }).then((res) => {
              setSubmitting(false);
              if (!res.ok) {
                setActionMsg(res.error);
                return;
              }
              setRequests((prev) => [res.data, ...prev]);
              setNewTitle('');
              setNewDescription('');
              setComposerOpen(false);
              setActionMsg('Idea posted.');
            });
          }}
        >
          <Input
            label={t('featureRequestsView.title')}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
            maxLength={200}
          />
          <Textarea
            submitOnModEnter
            label={t('featureRequestsView.description')}
            tone="secondary"
            className="min-h-[6rem] text-sm"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            required
            maxLength={2000}
            rows={4}
          />
          <Button
            type="submit"
            disabled={submitting || !newTitle.trim() || !newDescription.trim()}
            className="self-start"
          >
            {submitting
              ? t('featureRequestsViewStates.posting')
              : t('featureRequestsViewStates.postIdea')}
          </Button>
        </form>
      )}

      {actionMsg && (
        <p className="border-border bg-background-secondary rounded-lg border px-3 py-2 text-sm">
          {actionMsg}
        </p>
      )}

      {user && !loading && !forbidden && loadError && requests.length === 0 && (
        <PageError
          title={t('loadErrors.couldNotLoadFeatureRequests')}
          description={loadError}
          onRetry={() => {
            setLoading(true);
            reload();
          }}
        />
      )}

      {user &&
        !loading &&
        !forbidden &&
        !loadError &&
        requests.length === 0 && (
          <PageEmpty
            title={t('empties.noFeatureRequestsYet')}
            description={t('empties.beTheFirstToProposeAn')}
            action={
              composerOpen ? undefined : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setComposerOpen(true)}
                >
                  <LightbulbIcon size={16} aria-hidden />
                  {t('emptyActions.proposeIdea')}
                </Button>
              )
            }
          />
        )}

      {user && requests.length > 0 && (
        <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
          {requests.map((r) => {
            const badge = STATUS_BADGE[r.status];
            return (
              <li key={r.id} className="p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-lg font-bold">{r.title}</h2>
                  <Badge variant="pill" color={badge.color}>
                    {badge.label}
                  </Badge>
                </div>
                <p className="text-foreground-secondary mt-1 text-sm">
                  {r.description}
                </p>
                <p className="text-foreground-secondary mt-2 text-xs">
                  Proposed by {r.proposer}
                  {`, ${r.commentCount} comment${r.commentCount === 1 ? '' : 's'}`}
                </p>
                {r.status === 'DUPLICATE' && r.mergedIntoTitle && (
                  <p className="text-foreground-secondary mt-1 text-xs">
                    Merged into &ldquo;{r.mergedIntoTitle}&rdquo;
                  </p>
                )}
                {r.reviewNote && (
                  <p className="border-border bg-background-secondary/40 mt-2 rounded-md border px-2.5 py-1.5 text-xs">
                    Board note: {r.reviewNote}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant={r.youVoted ? 'default' : 'secondary'}
                    disabled={votingId === r.id || r.status === 'DUPLICATE'}
                    onClick={() => {
                      setVotingId(r.id);
                      void voteFeatureRequest(r.id, !r.youVoted).then((res) => {
                        setVotingId(null);
                        if (!res.ok) {
                          setActionMsg(res.error);
                          return;
                        }
                        setRequests((prev) =>
                          prev.map((row) =>
                            row.id === r.id
                              ? {
                                  ...row,
                                  youVoted: !r.youVoted,
                                  voteCount: res.voteCount,
                                }
                              : row,
                          ),
                        );
                      });
                    }}
                  >
                    ▲ {r.voteCount}
                  </Button>
                  <Button
                    size="sm"
                    variant="text"
                    onClick={() => {
                      if (expandedId === r.id) {
                        setExpandedId(null);
                      } else {
                        openThread(r.id);
                      }
                    }}
                  >
                    {expandedId === r.id
                      ? t('featureRequestsViewStates.hideDiscussion')
                      : t('featureRequestsViewStates.discussion')}
                  </Button>
                </div>

                {expandedId === r.id && (
                  <div className="border-border mt-3 flex flex-col gap-2 border-t pt-3">
                    {commentsError && comments.length === 0 ? (
                      <PageError
                        title={t('loadErrors.couldNotLoadComments')}
                        description={commentsError}
                        onRetry={() => openThread(r.id)}
                      />
                    ) : comments.length === 0 ? (
                      <PageEmpty
                        title={t('empties.noComments')}
                        description={t('empties.beTheFirstToComment')}
                      />
                    ) : (
                      <ul className="border-border divide-border divide-y overflow-hidden rounded-md border text-sm">
                        {comments.map((c) => (
                          <li key={c.id} className="px-3 py-2">
                            <div className="text-foreground-secondary text-xs">
                              {c.authorDisplayName ?? 'Member'}
                              {c.createdAt ? (
                                <>
                                  {', '}
                                  <ListingDate value={c.createdAt} />
                                </>
                              ) : null}
                            </div>
                            <p className="mt-1">{c.body}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Input
                        aria-label={t('featureRequestsView.comment')}
                        className="min-w-[200px] flex-1"
                        value={commentBody}
                        onChange={(e) => setCommentBody(e.target.value)}
                        placeholder={t('featureRequestsView.addAComment')}
                      />
                      <Button
                        size="sm"
                        disabled={!commentBody.trim()}
                        onClick={() => {
                          void postFeatureRequestComment(
                            r.id,
                            commentBody.trim(),
                          ).then((res) => {
                            if (!res.ok) {
                              setActionMsg(res.error);
                              return;
                            }
                            setComments((prev) => [...prev, res.data]);
                            setCommentBody('');
                            setRequests((prev) =>
                              prev.map((row) =>
                                row.id === r.id
                                  ? {
                                      ...row,
                                      commentCount: row.commentCount + 1,
                                    }
                                  : row,
                              ),
                            );
                          });
                        }}
                      >
                        {t('featureRequestsView.post')}
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );

  if (embedded) {
    return <div className="flex flex-col gap-6">{body}</div>;
  }

  return (
    <ViewShell
      title={t('featureRequestsView.featureRequests')}
      classes={{
        root: 'px-0 pt-0 mx-auto max-w-3xl',
        content: 'gap-6',
      }}
    >
      {body}
    </ViewShell>
  );
}
