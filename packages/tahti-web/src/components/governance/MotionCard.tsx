import { Link } from '@tanstack/react-router';
import { useState } from 'react';

import { Badge, Button, Input } from '@tahti-player/ui';

import {
  fetchMotionComments,
  patchGovernanceMotion,
  postMotionComment,
  voteOnMotion,
  type MotionComment,
} from '../../api/client';
import type { GovernanceMotion } from '../../api/types';

function stateBadge(state: string): {
  color: 'green' | 'orange' | 'secondary';
  label: string;
} {
  if (state === 'OPEN') {
    return { color: 'green', label: 'Open' };
  }
  if (state === 'CLOSED') {
    return { color: 'secondary', label: 'Closed' };
  }
  if (state === 'DRAFT') {
    return { color: 'orange', label: 'Discussion · 7-day circulation' };
  }
  return { color: 'orange', label: state };
}

function advisoryResultLabel(motion: GovernanceMotion): string | null {
  if (motion.state !== 'CLOSED' || !motion.tally) {
    return null;
  }
  const favoredYes = motion.tally.YES > motion.tally.NO;
  const favoredNo = motion.tally.NO > motion.tally.YES;
  const majority = favoredYes ? 'YES' : favoredNo ? 'NO' : null;
  const result = majority
    ? `Advisory result: members favored ${majority}`
    : 'Advisory result: no majority';
  if (!motion.youVoted || !motion.yourChoice || !majority) {
    return result;
  }
  const won = motion.yourChoice === majority;
  return won
    ? `${result}. You voted with the majority.`
    : `${result}. You voted with the minority.`;
}

function isExpiredMotion(motion: GovernanceMotion): boolean {
  return (
    motion.state === 'OPEN' &&
    Boolean(motion.closeAt) &&
    new Date(motion.closeAt!).getTime() <= Date.now()
  );
}

export function MotionCard({
  motion,
  isBoard,
  memberCount,
  description,
  linkTitle = false,
  defaultExpanded = false,
  preloadedComments,
  onChanged,
}: {
  motion: GovernanceMotion;
  isBoard: boolean;
  memberCount?: number;
  /** Only the detail page passes this — the list view omits descriptions. */
  description?: string;
  /** List view links each title to its detail route; the detail page itself does not. */
  linkTitle?: boolean;
  defaultExpanded?: boolean;
  /** List pages bulk-fetch every visible motion's comments up front
   * (fetchMotionCommentsBulk) and pass the result here so expanding a
   * card doesn't fire its own request. Undefined (not just empty) means
   * "not preloaded" — the card falls back to fetching on expand itself,
   * which is what the standalone detail page still does. */
  preloadedComments?: MotionComment[];
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
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(motion.title);
  const [editDescription, setEditDescription] = useState(description ?? '');
  const [savingEdit, setSavingEdit] = useState(false);

  const openThread = () => {
    setExpanded(true);
    setCommentBody('');
    if (!commentsLoaded) {
      void fetchMotionComments(motion.id).then((res) => {
        setComments(res.data);
        setCommentsLoaded(true);
      });
    }
  };

  const expired = isExpiredMotion(motion);
  const badge = expired
    ? { color: 'secondary' as const, label: 'Expired' }
    : stateBadge(motion.state);
  const resultLabel = advisoryResultLabel(motion);
  const m = motion;

  return (
    <li className="p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-bold">
          {linkTitle ? (
            <Link
              to="/governance/motions/$id"
              params={{ id: m.id }}
              className="hover:underline"
            >
              {m.title}
            </Link>
          ) : (
            m.title
          )}
        </h2>
        <Badge variant="pill" color={badge.color}>
          {badge.label}
        </Badge>
      </div>
      <p className="text-foreground-secondary mt-1 text-xs">
        {m.proposer ? `Proposed by ${m.proposer}` : 'Motion'}
        {typeof m.totalVotes === 'number' ? `, ${m.totalVotes} votes` : ''}
        {typeof m.commentCount === 'number'
          ? `, ${m.commentCount} comments`
          : ''}
      </p>
      {description !== undefined && editing ? (
        <div className="mt-2 flex flex-col gap-2">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Motion title"
            maxLength={200}
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={4}
            maxLength={10000}
            className="border-border bg-background rounded-md border px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={
                savingEdit || !editTitle.trim() || !editDescription.trim()
              }
              onClick={() => {
                setSavingEdit(true);
                void patchGovernanceMotion(m.id, {
                  title: editTitle.trim(),
                  description: editDescription.trim(),
                }).then((r) => {
                  setSavingEdit(false);
                  setActionMsg(r.ok ? 'Motion updated.' : r.error);
                  if (r.ok) {
                    setEditing(false);
                    onChanged();
                  }
                });
              }}
            >
              Save changes
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={savingEdit}
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : description ? (
        <p className="mt-2 text-sm leading-relaxed">{description}</p>
      ) : null}
      {description !== undefined &&
        !editing &&
        isBoard &&
        m.state === 'DRAFT' && (
          <div className="mt-2">
            <Button
              size="sm"
              variant="text"
              onClick={() => {
                setEditTitle(m.title);
                setEditDescription(description ?? '');
                setEditing(true);
              }}
            >
              Edit motion
            </Button>
          </div>
        )}
      {m.state === 'DRAFT' && (
        <p className="text-foreground-secondary mt-1 text-xs">
          {m.openAt
            ? `Voting opens ${new Date(m.openAt).toLocaleDateString()} after circulation period (bylaws §9).`
            : 'Voting opens after circulation period (bylaws §9).'}
        </p>
      )}
      {m.youVoted && (
        <p className="mt-2 text-sm">
          Your vote:{' '}
          <Badge variant="pill" color="cyan">
            {m.yourChoice ?? 'recorded'}
          </Badge>{' '}
          <span className="text-foreground-secondary text-xs">
            · votes can&apos;t be changed
          </span>
        </p>
      )}
      {m.tally && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="border-border rounded border px-2 py-1">
            YES {m.tally.YES}
          </span>
          <span className="border-border rounded border px-2 py-1">
            NO {m.tally.NO}
          </span>
          <span className="border-border rounded border px-2 py-1">
            ABSTAIN {m.tally.ABSTAIN}
          </span>
        </div>
      )}
      {typeof memberCount === 'number' &&
        memberCount > 0 &&
        typeof m.totalVotes === 'number' &&
        (m.state === 'OPEN' || m.state === 'CLOSED') && (
          <p className="text-foreground-secondary mt-2 text-xs">
            {m.totalVotes} of {memberCount} members voted
            {m.state === 'OPEN'
              ? ' · tally revealed at close'
              : m.tally
                ? ` · ${Math.round(((m.tally.YES ?? 0) / Math.max(1, m.tally.YES + m.tally.NO + m.tally.ABSTAIN)) * 100)}% for`
                : ''}
          </p>
        )}
      {resultLabel ? (
        <p className="text-foreground-secondary mt-2 text-xs">{resultLabel}</p>
      ) : null}

      {m.state === 'OPEN' && !expired && !m.youVoted && (
        <div className="mt-3 flex flex-wrap gap-2">
          {(['YES', 'NO', 'ABSTAIN'] as const).map((choice) => (
            <Button
              key={choice}
              size="sm"
              variant={choice === 'YES' ? 'default' : 'secondary'}
              disabled={voting}
              onClick={() => {
                setVoting(true);
                void voteOnMotion(m.id, choice).then((r) => {
                  setVoting(false);
                  setActionMsg(r.ok ? `Voted ${choice}.` : r.error);
                  if (r.ok) {
                    onChanged();
                  }
                });
              }}
            >
              {choice}
            </Button>
          ))}
        </div>
      )}

      {isBoard && (m.state === 'DRAFT' || m.state === 'OPEN') && (
        <div className="mt-3">
          <Button
            size="sm"
            variant={m.state === 'DRAFT' ? 'default' : 'secondary'}
            disabled={transitioning}
            onClick={() => {
              setTransitioning(true);
              const nextState = m.state === 'DRAFT' ? 'OPEN' : 'CLOSED';
              void patchGovernanceMotion(m.id, { state: nextState }).then(
                (r) => {
                  setTransitioning(false);
                  setActionMsg(
                    r.ok
                      ? nextState === 'OPEN'
                        ? 'Voting opened.'
                        : 'Motion closed and result published.'
                      : r.error,
                  );
                  if (r.ok) {
                    onChanged();
                  }
                },
              );
            }}
          >
            {m.state === 'DRAFT' ? 'Open voting' : 'Close & publish result'}
          </Button>
        </div>
      )}

      {actionMsg && (
        <p className="border-border bg-background-secondary mt-3 rounded-lg border px-3 py-2 text-sm">
          {actionMsg}
        </p>
      )}

      <div className="mt-3">
        <Button
          size="sm"
          variant="text"
          onClick={() => {
            if (expanded) {
              setExpanded(false);
            } else {
              openThread();
            }
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
          {m.state !== 'CLOSED' && !expired && (
            <div className="flex flex-wrap gap-2">
              <Input
                className="min-w-[200px] flex-1"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Add a comment…"
              />
              <Button
                size="sm"
                disabled={!commentBody.trim()}
                onClick={() => {
                  void postMotionComment(m.id, commentBody.trim()).then((r) => {
                    if (!r.ok) {
                      setActionMsg(r.error);
                      return;
                    }
                    setComments((prev) => [...prev, r.data]);
                    setCommentBody('');
                    setActionMsg('Comment posted.');
                    onChanged();
                  });
                }}
              >
                Post
              </Button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
