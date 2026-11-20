import { LockIcon, MessageSquarePlus, MessagesSquareIcon } from 'lucide-react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Box,
  Button,
  EditIconButton,
  Textarea,
  ViewShell,
} from '@tahti-player/ui';

import {
  editDiscussionPost,
  fetchDiscussionTopic,
  fetchEarlierDiscussionPosts,
  removeDiscussionPost,
  replyToDiscussion,
  setDiscussionFollow,
  setDiscussionMute,
  type DiscussionPost,
  type DiscussionTopicDetail,
} from '../api/governance-discussions';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { governanceAccentChip } from '../components/governance/GovernancePanel';
import { ListingDate } from '../components/ListingDate';
import { PageBackLink } from '../components/PageBackLink';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { ReportButton } from '../components/ReportButton';
import { hasAccountRole } from '../lib/accountRoles';
import { cn } from '../lib/cn';
import { toastWithUndo } from '../lib/undoToast';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';

const REPLY_MAX = 5000;

function ReplyForm({
  topicId,
  onPosted,
  textareaRef,
}: {
  topicId: string;
  onPosted: () => void;
  textareaRef?: RefObject<HTMLTextAreaElement>;
}) {
  const { t } = useTranslation('web');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!body.trim()) {
      return;
    }
    setSending(true);
    setError(null);
    const result = await replyToDiscussion(topicId, body);
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setBody('');
    const created = result.data;
    toastWithUndo(i18n.t('web:batch56.replyPosted'), {
      undo: () => removeDiscussionPost(topicId, created.id),
      undoneMessage: i18n.t('web:batch56.replyRemoved'),
      onUndone: () => onPosted(),
    });
    onPosted();
  };

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <Textarea
        ref={textareaRef}
        label={t('discussionTopic.yourReply')}
        description={t('discussionTopic.useUsernameToMentionA')}
        submitOnModEnter
        value={body}
        maxLength={REPLY_MAX}
        rows={4}
        onChange={(event) => setBody(event.target.value)}
      />
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={sending || !body.trim()}>
          {sending
            ? t('discussionTopicViewStates.posting')
            : t('discussionTopicViewStates.postReply')}
        </Button>
      </div>
    </form>
  );
}

function EditReplyForm({
  topicId,
  post,
  onDone,
}: {
  topicId: string;
  post: DiscussionPost;
  onDone: (saved: DiscussionPost | null) => void;
}) {
  const { t } = useTranslation('web');
  const [body, setBody] = useState(post.body);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const changed = body.trim() !== post.body && body.trim().length > 0;

  const save = async () => {
    setSaving(true);
    setError(null);
    const result = await editDiscussionPost(topicId, post.id, body);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(i18n.t('web:toasts.replyUpdated'));
    onDone(result.data);
  };

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <Textarea
        label={t('discussionTopic.editYourReply')}
        submitOnModEnter
        value={body}
        maxLength={REPLY_MAX}
        rows={3}
        onChange={(event) => setBody(event.target.value)}
      />
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving || !changed}>
          {saving
            ? t('discussionTopicViewStates.saving')
            : t('discussionTopicViewStates.save')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="text"
          onClick={() => onDone(null)}
        >
          {t('discussionTopic.cancel')}
        </Button>
      </div>
    </form>
  );
}

function FollowControls({
  topic,
  onChange,
}: {
  topic: DiscussionTopicDetail;
  onChange: (following: boolean, muted: boolean) => void;
}) {
  const { t } = useTranslation('web');
  const [busy, setBusy] = useState(false);

  const run = async (
    action: () => ReturnType<typeof setDiscussionFollow>,
    done: string,
  ) => {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onChange(result.data.following, result.data.muted);
    toast.success(done);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="secondary"
        disabled={busy}
        onClick={() =>
          void run(
            () => setDiscussionFollow(topic.id, !topic.following),
            topic.following
              ? t('discussionTopicViewStates.youNoLongerFollowThis')
              : t('discussionTopicViewStates.youFollowThisTopicNew'),
          )
        }
      >
        {topic.following
          ? t('discussionTopicViewStates.unfollow')
          : t('discussionTopicViewStates.follow')}
      </Button>
      {topic.following ? (
        <Button
          size="sm"
          variant="text"
          disabled={busy}
          onClick={() =>
            void run(
              () => setDiscussionMute(topic.id, !topic.muted),
              topic.muted
                ? t('discussionTopicViewStates.repliesNotifyYouAgain')
                : t('discussionTopicViewStates.mutedYouStillFollowIt'),
            )
          }
        >
          {topic.muted
            ? t('discussionTopicViewStates.unmute')
            : t('discussionTopicViewStates.muteNotifications')}
        </Button>
      ) : null}
    </div>
  );
}

export function DiscussionTopicView({ id }: { id: string }) {
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const [topic, setTopic] = useState<DiscussionTopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [removing, setRemoving] = useState<DiscussionPost | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const [loadingEarlier, setLoadingEarlier] = useState(false);

  const showEarlier = async () => {
    const first = topic?.posts[0];
    if (!topic || !first) {
      return;
    }
    setLoadingEarlier(true);
    const result = await fetchEarlierDiscussionPosts(topic.id, first.id);
    setLoadingEarlier(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setTopic({
      ...topic,
      posts: [...result.data.posts, ...topic.posts],
      hasEarlierPosts: result.data.hasEarlierPosts,
    });
  };
  const isBoard = hasAccountRole(user, 'BOARD');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void fetchDiscussionTopic(id).then((result) => {
      if (cancelled) {
        return;
      }
      setTopic(result.data);
      setLoadError(
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
      );
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user, id, attempt]);

  const reload = () => setAttempt((n) => n + 1);

  const canRemove = (post: DiscussionPost) =>
    isBoard || (Boolean(post.mine) && topic?.status !== 'CLOSED');

  const confirmRemove = () => {
    const target = removing;
    setRemoving(null);
    if (!target || !topic) {
      return;
    }
    void removeDiscussionPost(topic.id, target.id).then((result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(i18n.t('web:toasts.replyRemoved'));
      setTopic({
        ...topic,
        posts: topic.posts.filter((p) => p.id !== target.id),
        postCount: Math.max(0, topic.postCount - 1),
      });
    });
  };

  return (
    <ViewShell
      title={topic?.title ?? i18n.t('web:motionDiscussionStates.discussion')}
      classes={{ root: 'px-0 pt-0 mx-auto max-w-2xl', content: 'gap-4' }}
    >
      <PageBackLink
        to="/governance/discussions"
        label={t('discussionTopic.discussions')}
      />

      {!user ? (
        <PageEmpty
          icon="inbox"
          title={t('empties.signInToReadThisDiscussion')}
          description={t('empties.discussionsAreOpenToTahtiRy')}
          action={
            <Button onClick={() => useAuthModalStore.getState().open('login')}>
              {t('discussionTopic.signIn')}
            </Button>
          }
        />
      ) : loading ? (
        <PageLoading label={t('loading.loadingTheDiscussion')} />
      ) : !topic ? (
        <PageError
          title={t('loadErrors.couldNotLoadThisDiscussion')}
          description={loadError ?? i18n.t('web:batch57.topicNotFound')}
          onRetry={reload}
        />
      ) : (
        <>
          <Box
            variant="tertiary"
            className="border-t-accent-cyan flex flex-col gap-3 border-t-4"
          >
            <p className="text-foreground-secondary flex flex-wrap items-center gap-2 text-xs">
              <span
                className={cn(
                  'inline-flex size-8 shrink-0 items-center justify-center rounded-md',
                  governanceAccentChip('cyan'),
                )}
              >
                <MessagesSquareIcon size={16} aria-hidden />
              </span>
              <span>
                {t('discussionTopicViewBatch30.openedBy')}{' '}
                <span className="text-foreground font-semibold">
                  {topic.createdBy}
                </span>
              </span>
              <ListingDate value={topic.createdAt} />
              {topic.status === 'CLOSED' ? (
                <Badge variant="pill" color="secondary">
                  {t('discussionTopic.closed')}
                </Badge>
              ) : null}
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {topic.body}
            </p>
            <div className="border-border border-t pt-3">
              <FollowControls
                topic={topic}
                onChange={(following, muted) =>
                  setTopic({ ...topic, following, muted })
                }
              />
            </div>
          </Box>

          <section
            className="flex flex-col gap-3"
            aria-label={t('discussionTopic.replies')}
          >
            <h2 className="font-display text-lg font-bold">
              {t('discussionTopicViewBatch30.replyCount', {
                count: Math.max(topic.postCount, topic.posts.length),
              })}
            </h2>
            {topic.posts.length === 0 ? (
              <PageEmpty
                title={t('empties.noReplies')}
                action={
                  topic.status === 'OPEN' ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => replyRef.current?.focus()}
                    >
                      <MessageSquarePlus size={16} aria-hidden />
                      {t('emptyActions.beFirstToReply')}
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <>
                {topic.hasEarlierPosts ? (
                  <div>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={loadingEarlier}
                      onClick={() => void showEarlier()}
                    >
                      {loadingEarlier
                        ? t('discussionTopicViewStates.loading')
                        : t('discussionTopicViewStates.showEarlierReplies')}
                    </Button>
                  </div>
                ) : null}
                <ul className="flex flex-col gap-3 text-sm">
                  {topic.posts.map((post) => (
                    <li key={post.id}>
                      <Box
                        variant="secondary"
                        shadow="none"
                        className={cn(
                          'flex flex-col gap-2 px-4 py-3',
                          post.mine && 'border-l-accent-cyan border-l-4',
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-foreground-secondary flex flex-wrap items-center gap-x-1.5 text-xs">
                            <span className="text-foreground text-sm font-semibold">
                              {post.author}
                            </span>
                            <ListingDate value={post.createdAt} />
                            {post.editedAt ? (
                              <span>
                                {t('discussionTopicViewBatch30.edited')}
                              </span>
                            ) : null}
                          </p>
                          <span className="flex items-center gap-1">
                            {post.mine ? null : (
                              <ReportButton
                                targetType="DISCUSSION_POST"
                                targetId={post.id}
                                label={t(
                                  'discussionTopicViewBatch30.theReplyBy',
                                  {
                                    author: post.author,
                                  },
                                )}
                                defaultReason="HARASSMENT"
                                variant="text"
                              />
                            )}
                            {post.mine &&
                            topic.status === 'OPEN' &&
                            editingId !== post.id ? (
                              <EditIconButton
                                label={t('discussionTopic.editYourReply')}
                                variant="text"
                                onClick={() => setEditingId(post.id)}
                              />
                            ) : null}
                            {canRemove(post) ? (
                              <Button
                                size="sm"
                                variant="text"
                                aria-label={t(
                                  'discussionTopicViewLabels.removeTheReplyByAuthor',
                                  { author: post.author },
                                )}
                                onClick={() => setRemoving(post)}
                              >
                                {t('discussionTopic.remove')}
                              </Button>
                            ) : null}
                          </span>
                        </div>
                        {editingId === post.id ? (
                          <EditReplyForm
                            topicId={topic.id}
                            post={post}
                            onDone={(saved) => {
                              setEditingId(null);
                              if (saved) {
                                setTopic({
                                  ...topic,
                                  posts: topic.posts.map((p) =>
                                    p.id === saved.id ? saved : p,
                                  ),
                                });
                              }
                            }}
                          />
                        ) : (
                          <p className="leading-relaxed whitespace-pre-wrap">
                            {post.body}
                          </p>
                        )}
                      </Box>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {topic.status === 'CLOSED' ? (
            <Box
              variant="tertiary"
              shadow="none"
              className="text-foreground-secondary flex items-center gap-2 text-sm"
            >
              <LockIcon size={16} aria-hidden className="shrink-0" />
              {t('discussionTopic.theBoardClosedThisTopic')}
            </Box>
          ) : (
            <Box variant="tertiary" className="flex-col">
              <ReplyForm
                topicId={topic.id}
                onPosted={reload}
                textareaRef={replyRef}
              />
            </Box>
          )}
        </>
      )}
      <ConfirmDialog
        destructive
        isOpen={removing !== null}
        title={t('discussionTopic.removeThisReply')}
        description={
          removing && !removing.mine
            ? t('discussionTopicViewStates.itIsDeletedForEvery')
            : t('discussionTopicViewStates.itIsDeletedForEvery2')
        }
        confirmLabel={t('discussionTopic.remove')}
        onCancel={() => setRemoving(null)}
        onConfirm={confirmRemove}
      />
    </ViewShell>
  );
}
