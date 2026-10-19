import { useEffect, useState } from 'react';

import { Button, Input } from '@tahti-player/ui';

import {
  fetchMotionComments,
  postMotionComment,
  type MotionComment,
} from '../../api/client';
import { removeMotionComment } from '../../api/governance-comments';
import type { GovernanceMotion } from '../../api/types';
import { hasAccountRole } from '../../lib/accountRoles';
import { useAuthStore } from '../../stores/authStore';
import { ConfirmDialog } from '../ConfirmDialog';
import { PageError } from '../PageStates';

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
  const [removing, setRemoving] = useState<MotionComment | null>(null);
  const user = useAuthStore((s) => s.user);
  const isBoard = hasAccountRole(user, 'BOARD');

  const canRemove = (c: MotionComment) =>
    !c.removed &&
    (isBoard ||
      (Boolean(user?.id) &&
        c.authorId === user?.id &&
        motion.state !== 'CLOSED'));

  const confirmRemove = () => {
    const target = removing;
    setRemoving(null);
    if (!target) {
      return;
    }
    void removeMotionComment(motion.id, target.id).then((r) => {
      if (!r.ok) {
        onMessage(r.error);
        return;
      }
      setComments((prev) =>
        prev.map((c) =>
          c.id === target.id ? { ...c, body: '', removed: true } : c,
        ),
      );
      onMessage('Comment removed.');
    });
  };

  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!expanded || commentsLoaded) {
      return;
    }
    let cancelled = false;
    void fetchMotionComments(motion.id).then((res) => {
      if (cancelled) {
        return;
      }
      if (res.meta.source === 'api' && res.meta.reason) {
        setLoadError(res.meta.reason);
        return;
      }
      setLoadError(null);
      setComments(res.data);
      setCommentsLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [expanded, commentsLoaded, motion.id, attempt]);

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
          {!commentsLoaded && loadError ? (
            <PageError
              title="Could not load the discussion"
              description={loadError}
              onRetry={() => {
                setLoadError(null);
                setAttempt((n) => n + 1);
              }}
            />
          ) : !commentsLoaded ? (
            <p className="text-foreground-secondary text-xs">Loading…</p>
          ) : comments.length === 0 ? (
            <p className="text-foreground-secondary text-xs">
              No comments yet.
            </p>
          ) : (
            <ul className="border-border divide-border divide-y overflow-hidden rounded-md border text-sm">
              {comments.map((c) => (
                <li key={c.id} className="px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-foreground-secondary text-xs">
                      {c.authorDisplayName ?? 'Member'}
                      {c.createdAt
                        ? `, ${new Date(c.createdAt).toLocaleString()}`
                        : ''}
                    </div>
                    {canRemove(c) && (
                      <Button
                        size="sm"
                        variant="text"
                        aria-label={`Remove the comment by ${c.authorDisplayName ?? 'a member'}`}
                        onClick={() => setRemoving(c)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  {c.removed ? (
                    <p className="text-foreground-secondary mt-1 italic">
                      Comment removed.
                    </p>
                  ) : (
                    <p className="mt-1">{c.body}</p>
                  )}
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
      <ConfirmDialog
        isOpen={removing !== null}
        title="Remove this comment?"
        description={
          removing && removing.authorId !== user?.id
            ? 'It is replaced by "Comment removed." for every member, and the removal is logged.'
            : 'It is replaced by "Comment removed." for every member.'
        }
        confirmLabel="Remove"
        onCancel={() => setRemoving(null)}
        onConfirm={confirmRemove}
      />
    </>
  );
}
