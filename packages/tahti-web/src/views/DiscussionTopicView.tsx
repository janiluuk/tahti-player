import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge, Button, Textarea, ViewShell } from '@tahti-player/ui';

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
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { ReportButton } from '../components/ReportButton';
import { hasAccountRole } from '../lib/accountRoles';
import { toastWithUndo } from '../lib/undoToast';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';

const REPLY_MAX = 5000;

function postedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ReplyForm({
  topicId,
  onPosted,
}: {
  topicId: string;
  onPosted: () => void;
}) {
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
    toastWithUndo('Reply posted. You follow this topic now.', {
      undo: () => removeDiscussionPost(topicId, created.id),
      undoneMessage: 'Reply removed.',
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
        label="Your reply"
        description="Use @username to mention a member; they get a notification."
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
          {sending ? 'Posting…' : 'Post reply'}
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
    toast.success('Reply updated.');
    onDone(result.data);
  };

  return (
    <form
      className="mt-2 flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <Textarea
        label="Edit your reply"
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
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="text"
          onClick={() => onDone(null)}
        >
          Cancel
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
              ? 'You no longer follow this topic.'
              : 'You follow this topic; new replies notify you.',
          )
        }
      >
        {topic.following ? 'Unfollow' : 'Follow'}
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
                ? 'Replies notify you again.'
                : 'Muted: you still follow it, without notifications.',
            )
          }
        >
          {topic.muted ? 'Unmute' : 'Mute notifications'}
        </Button>
      ) : null}
    </div>
  );
}

export function DiscussionTopicView({ id }: { id: string }) {
  const user = useAuthStore((s) => s.user);
  const [topic, setTopic] = useState<DiscussionTopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [removing, setRemoving] = useState<DiscussionPost | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
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
      toast.success('Reply removed.');
      setTopic({
        ...topic,
        posts: topic.posts.filter((p) => p.id !== target.id),
        postCount: Math.max(0, topic.postCount - 1),
      });
    });
  };

  return (
    <ViewShell
      title={topic?.title ?? 'Discussion'}
      classes={{ root: 'px-0 pt-0 mx-auto max-w-2xl', content: 'gap-4' }}
    >
      <Link
        to="/governance/discussions"
        className="text-foreground-secondary w-fit text-xs underline-offset-2 hover:underline"
      >
        ← All discussions
      </Link>

      {!user ? (
        <PageEmpty
          icon="inbox"
          title="Sign in to read this discussion"
          description="Discussions are open to Tahti ry members."
          action={
            <Button onClick={() => useAuthModalStore.getState().open('login')}>
              Sign in
            </Button>
          }
        />
      ) : loading ? (
        <PageLoading label="Loading the discussion…" />
      ) : !topic ? (
        <PageError
          title="Could not load this discussion"
          description={loadError ?? 'Topic not found'}
          onRetry={reload}
        />
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <p className="text-foreground-secondary flex flex-wrap items-center gap-2 text-xs">
              <span>
                Opened by {topic.createdBy} on {postedAt(topic.createdAt)}
              </span>
              {topic.status === 'CLOSED' ? (
                <Badge variant="pill" color="secondary">
                  Closed
                </Badge>
              ) : null}
            </p>
            <p className="text-sm whitespace-pre-wrap">{topic.body}</p>
            <FollowControls
              topic={topic}
              onChange={(following, muted) =>
                setTopic({ ...topic, following, muted })
              }
            />
          </section>

          <section className="flex flex-col gap-3" aria-label="Replies">
            <h2 className="text-lg font-semibold">
              {Math.max(topic.postCount, topic.posts.length) === 1
                ? '1 reply'
                : `${Math.max(topic.postCount, topic.posts.length)} replies`}
            </h2>
            {topic.posts.length === 0 ? (
              <PageEmpty title="No replies yet." />
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
                      {loadingEarlier ? 'Loading…' : 'Show earlier replies'}
                    </Button>
                  </div>
                ) : null}
                <ul className="border-border divide-border divide-y rounded-md border text-sm">
                  {topic.posts.map((post) => (
                    <li key={post.id} className="px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-foreground-secondary text-xs">
                          {post.author}, {postedAt(post.createdAt)}
                          {post.editedAt ? ' (edited)' : null}
                        </p>
                        <span className="flex items-center gap-1">
                          {post.mine ? null : (
                            <ReportButton
                              targetType="DISCUSSION_POST"
                              targetId={post.id}
                              label={`the reply by ${post.author}`}
                              defaultReason="HARASSMENT"
                              variant="text"
                            />
                          )}
                          {post.mine &&
                          topic.status === 'OPEN' &&
                          editingId !== post.id ? (
                            <Button
                              size="sm"
                              variant="text"
                              aria-label="Edit your reply"
                              onClick={() => setEditingId(post.id)}
                            >
                              Edit
                            </Button>
                          ) : null}
                          {canRemove(post) ? (
                            <Button
                              size="sm"
                              variant="text"
                              aria-label={`Remove the reply by ${post.author}`}
                              onClick={() => setRemoving(post)}
                            >
                              Remove
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
                        <p className="mt-1 whitespace-pre-wrap">{post.body}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {topic.status === 'CLOSED' ? (
            <p className="text-foreground-secondary text-sm">
              The board closed this topic; it takes no more replies.
            </p>
          ) : (
            <ReplyForm topicId={topic.id} onPosted={reload} />
          )}
        </>
      )}
      <ConfirmDialog
        isOpen={removing !== null}
        title="Remove this reply?"
        description={
          removing && !removing.mine
            ? 'It is deleted for every member, and the removal is logged.'
            : 'It is deleted for every member.'
        }
        confirmLabel="Remove"
        onCancel={() => setRemoving(null)}
        onConfirm={confirmRemove}
      />
    </ViewShell>
  );
}
