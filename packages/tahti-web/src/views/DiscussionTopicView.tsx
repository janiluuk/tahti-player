import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge, Button, Textarea, ViewShell } from '@tahti-player/ui';

import {
  fetchDiscussionTopic,
  replyToDiscussion,
  type DiscussionTopicDetail,
} from '../api/governance-discussions';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
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
    toast.success('Reply posted. You follow this topic now.');
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

export function DiscussionTopicView({ id }: { id: string }) {
  const user = useAuthStore((s) => s.user);
  const [topic, setTopic] = useState<DiscussionTopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

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
          </section>

          <section className="flex flex-col gap-3" aria-label="Replies">
            <h2 className="text-lg font-semibold">
              {topic.posts.length === 1
                ? '1 reply'
                : `${topic.posts.length} replies`}
            </h2>
            {topic.posts.length === 0 ? (
              <p className="text-foreground-secondary text-sm">
                No replies yet.
              </p>
            ) : (
              <ul className="border-border divide-border divide-y rounded-md border text-sm">
                {topic.posts.map((post) => (
                  <li key={post.id} className="px-3 py-2">
                    <p className="text-foreground-secondary text-xs">
                      {post.author}, {postedAt(post.createdAt)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{post.body}</p>
                  </li>
                ))}
              </ul>
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
    </ViewShell>
  );
}
