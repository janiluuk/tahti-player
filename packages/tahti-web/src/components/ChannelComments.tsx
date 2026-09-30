import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button, Textarea } from '@tahti-player/ui';

import {
  fetchChannelComments,
  postChannelComment,
} from '../api/channel-comments';
import { deleteComment } from '../api/comments';
import type { TrackComment } from '../api/types';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { CommentItem } from './CommentItem';

const MAX_COMMENT_LENGTH = 2000;

/** Comments on the channel itself (not on one of its tracks). Hidden when
 * the artist turned them off and nobody commented before that. */
export function ChannelComments({
  slug,
  isOwner,
}: {
  slug: string;
  isOwner: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const openAuth = useAuthModalStore((s) => s.open);
  const [comments, setComments] = useState<TrackComment[] | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchChannelComments(slug).then((result) => {
      if (!cancelled && result.data) {
        setComments(result.data.comments);
        setEnabled(result.data.commentsEnabled);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!comments || (!enabled && comments.length === 0)) {
    return null;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) {
      return;
    }
    setPosting(true);
    const result = await postChannelComment(slug, trimmed);
    setPosting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setComments((current) => [...(current ?? []), result.data]);
    setBody('');
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    const result = await deleteComment(id);
    setDeletingId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setComments((current) =>
      (current ?? []).filter((comment) => comment.id !== id),
    );
  };

  return (
    <section className="mt-8 flex flex-col gap-4" aria-label="Channel comments">
      <h2 className="text-sm font-semibold tracking-wide uppercase">
        Comments
      </h2>
      {comments.length === 0 ? (
        <p className="text-foreground-secondary text-sm">No comments yet.</p>
      ) : (
        <ul className="flex flex-col gap-4" data-testid="channel-comments">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={
                user && (isOwner || comment.authorUsername === user.username)
                  ? () => void remove(comment.id)
                  : undefined
              }
              deleting={deletingId === comment.id}
            />
          ))}
        </ul>
      )}
      {!enabled ? (
        <p className="text-foreground-secondary text-sm">
          Comments are off for this channel.
        </p>
      ) : user ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => void submit(event)}
        >
          <Textarea
            aria-label="Write a comment"
            placeholder="Say something about this channel…"
            value={body}
            maxLength={MAX_COMMENT_LENGTH}
            onChange={(event) => setBody(event.target.value)}
          />
          <Button
            type="submit"
            size="sm"
            className="self-end"
            disabled={posting || !body.trim()}
          >
            {posting ? 'Posting…' : 'Post comment'}
          </Button>
        </form>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() => openAuth('login')}
        >
          Log in to comment
        </Button>
      )}
    </section>
  );
}
