import { useEffect, useState } from 'react';

import { Button, Input } from '@tahti-player/ui';

import {
  fetchMotionComments,
  postMotionComment,
  type MotionComment,
} from '../../api/client';
import type { GovernanceMotion } from '../../api/types';

export function MotionDiscussion({
  motion,
  canPost,
  defaultExpanded,
  preloadedComments,
  onMessage,
  onChanged,
}: {
  motion: GovernanceMotion;
  canPost: boolean;
  defaultExpanded: boolean;
  preloadedComments?: MotionComment[];
  onMessage: (message: string) => void;
  onChanged: () => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [comments, setComments] = useState<MotionComment[]>(
    preloadedComments ?? [],
  );
  const [commentsLoaded, setCommentsLoaded] = useState(
    preloadedComments !== undefined,
  );
  const [commentBody, setCommentBody] = useState('');

  useEffect(() => {
    if (!expanded || commentsLoaded) {
      return;
    }
    let cancelled = false;
    void fetchMotionComments(motion.id).then((res) => {
      if (cancelled) {
        return;
      }
      setComments(res.data);
      setCommentsLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [expanded, commentsLoaded, motion.id]);

  return (
    <>
      <div className="mt-3">
        <Button
          size="sm"
          variant="text"
          onClick={() => {
            setCommentBody('');
            setExpanded((open) => !open);
          }}
        >
          {expanded ? 'Hide discussion' : 'Discussion'}
        </Button>
      </div>

      {expanded && (
        <div className="border-border mt-3 flex flex-col gap-2 border-t pt-3">
          {!commentsLoaded ? (
            <p className="text-foreground-secondary text-xs">Loading…</p>
          ) : comments.length === 0 ? (
            <p className="text-foreground-secondary text-xs">
              No comments yet.
            </p>
          ) : (
            <ul className="border-border divide-border divide-y overflow-hidden rounded-md border text-sm">
              {comments.map((c) => (
                <li key={c.id} className="px-3 py-2">
                  <div className="text-foreground-secondary text-xs">
                    {c.authorDisplayName ?? 'Member'}
                    {c.createdAt
                      ? `, ${new Date(c.createdAt).toLocaleString()}`
                      : ''}
                  </div>
                  <p className="mt-1">{c.body}</p>
                </li>
              ))}
            </ul>
          )}
          {canPost && (
            <div className="flex flex-wrap gap-2">
              <Input
                className="min-w-[200px] flex-1"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                aria-label="Add a comment"
                placeholder="Add a comment…"
              />
              <Button
                size="sm"
                disabled={!commentBody.trim()}
                onClick={() => {
                  void postMotionComment(motion.id, commentBody.trim()).then(
                    (r) => {
                      if (!r.ok) {
                        onMessage(r.error);
                        return;
                      }
                      setComments((prev) => [...prev, r.data]);
                      setCommentBody('');
                      onMessage('Comment posted.');
                      onChanged();
                    },
                  );
                }}
              >
                Post
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
