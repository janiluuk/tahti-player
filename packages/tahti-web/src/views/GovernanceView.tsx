import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Badge, Button, SectionShell } from '@tahti-player/ui';

import {
  createGovernanceMotion,
  fetchFeatureRequests,
  fetchGovernanceDocuments,
  fetchGovernanceMeetings,
  fetchGovernanceMembers,
  fetchGovernanceMotions,
  fetchGovernanceQuarterlyReports,
  fetchMotionComments,
  postMotionComment,
  voteOnMotion,
  type MotionComment,
} from '../api/client';
import type {
  FeatureRequest,
  GovernanceDocument,
  GovernanceMeeting,
  GovernanceMember,
  GovernanceMotion,
  GovernanceQuarterlyReport,
} from '../api/types';
import { parseMeetingAgenda } from '../api/governanceMocks';
import { PageFrame, PageHeader } from '../components/PageHeader';
import { PageLoading } from '../components/PageStates';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { useSettingsModalStore } from '../stores/settingsModalStore';

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

export function GovernanceView({ embedded = false }: { embedded?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const closeSettings = useSettingsModalStore((s) => s.close);
  const [motions, setMotions] = useState<GovernanceMotion[]>([]);
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [meetings, setMeetings] = useState<GovernanceMeeting[]>([]);
  const [documents, setDocuments] = useState<GovernanceDocument[]>([]);
  const [members, setMembers] = useState<GovernanceMember[]>([]);
  const [reports, setReports] = useState<GovernanceQuarterlyReport[]>([]);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [comments, setComments] = useState<MotionComment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [submittingDraft, setSubmittingDraft] = useState(false);

  const reload = () => {
    if (!user) {
      return;
    }
    void Promise.all([
      fetchGovernanceMotions(),
      fetchFeatureRequests(),
      fetchGovernanceMeetings(),
      fetchGovernanceDocuments(),
      fetchGovernanceMembers(),
      fetchGovernanceQuarterlyReports(),
    ]).then(
      ([
        motionsResult,
        requestsResult,
        meetingsResult,
        documentsResult,
        membersResult,
        reportsResult,
      ]) => {
        setMotions(motionsResult.data);
        setRequests(requestsResult.data);
        setMeetings(meetingsResult.data);
        setDocuments(documentsResult.data);
        setMembers(membersResult.data);
        setReports(reportsResult.data);
        setForbidden(
          Boolean(motionsResult.forbidden || requestsResult.forbidden) &&
            motionsResult.data.length === 0 &&
            requestsResult.data.length === 0,
        );
        setLoading(false);
      },
    );
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setMotions([]);
      setForbidden(true);
      return;
    }
    setLoading(true);
    reload();
  }, [user]);

  const openThread = (id: string) => {
    setExpandedId(id);
    setCommentBody('');
    void fetchMotionComments(id).then((res) => setComments(res.data));
  };

  return (
    <PageFrame maxWidth="3xl">
      {!embedded && (
        <PageHeader
          title="Governance"
          subtitle="Cooperative motions — vote YES / NO / ABSTAIN and join the discussion."
          meta={
            <div className="flex flex-col gap-1">
              <Link
                to="/governance/feature-requests"
                onClick={closeSettings}
                className="text-foreground-secondary inline-block w-fit text-xs underline-offset-2 hover:underline"
              >
                Feature requests →
              </Link>
              <Link
                to="/governance/history"
                onClick={closeSettings}
                className="text-foreground-secondary inline-block w-fit text-xs underline-offset-2 hover:underline"
              >
                Closed decision history →
              </Link>
              <Link
                to="/transparency"
                onClick={closeSettings}
                className="text-foreground-secondary inline-block w-fit text-xs underline-offset-2 hover:underline"
              >
                Transparency ledger →
              </Link>
              <Link
                to="/help/$slug"
                params={{ slug: 'governance' }}
                onClick={closeSettings}
                className="text-foreground-secondary inline-block w-fit text-xs underline-offset-2 hover:underline"
              >
                Governance help →
              </Link>
            </div>
          }
        />
      )}

      {user && !loading && !forbidden && (
        <div className="grid gap-4 md:grid-cols-2">
          <SectionShell title="Published meetings">
            {meetings.length === 0 ? (
              <p className="text-foreground-secondary text-sm">
                No published meeting records yet.
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {meetings.map((meeting) => {
                  const agenda = parseMeetingAgenda(meeting.agenda);
                  return (
                    <li
                      key={meeting.id}
                      className="py-2 text-sm first:pt-0 last:pb-0"
                    >
                      <div className="font-medium">{meeting.title}</div>
                      <div className="text-foreground-secondary mt-0.5 text-xs">
                        {meeting.scheduledAt
                          ? new Date(meeting.scheduledAt).toLocaleDateString()
                          : 'Date not listed'}{' '}
                        · {meeting.state}
                      </div>
                      {agenda.length > 0 ? (
                        <ul className="mt-2 flex flex-col gap-1">
                          {agenda.map((item) => (
                            <li key={item.title}>
                              <p className="text-xs font-semibold">
                                {item.title}
                              </p>
                              {item.description ? (
                                <p className="text-foreground-secondary text-xs">
                                  {item.description}
                                </p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionShell>
          <SectionShell title="Published documents">
            {documents.length === 0 ? (
              <p className="text-foreground-secondary text-sm">
                No governance documents have been published yet.
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {documents.map((document) => (
                  <li
                    key={document.id}
                    className="py-2 text-sm first:pt-0 last:pb-0"
                  >
                    {document.downloadUrl || document.externalUrl ? (
                      <a
                        href={
                          document.downloadUrl ??
                          document.externalUrl ??
                          undefined
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium underline-offset-2 hover:underline"
                      >
                        {document.title}
                      </a>
                    ) : (
                      <span className="font-medium">{document.title}</span>
                    )}
                    <div className="text-foreground-secondary mt-0.5 text-xs">
                      {document.type} · version {document.version}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionShell>
          <SectionShell title="Quarterly review reports">
            {reports.length === 0 ? (
              <p className="text-foreground-secondary text-sm">
                No quarterly feature-request reviews have been published yet.
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {reports.map((report) => (
                  <li
                    key={report.id}
                    className="py-2 text-sm first:pt-0 last:pb-0"
                  >
                    {report.downloadUrl ? (
                      <a
                        href={report.downloadUrl}
                        className="font-medium underline-offset-2 hover:underline"
                      >
                        Q{report.quarter} {report.year} feature-request review
                      </a>
                    ) : (
                      <span className="font-medium">
                        Q{report.quarter} {report.year} feature-request review
                      </span>
                    )}
                    <div className="text-foreground-secondary mt-0.5 text-xs">
                      Prepared by {report.generatedByDisplayName}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionShell>
          <SectionShell title="Member directory">
            {members.length === 0 ? (
              <p className="text-foreground-secondary text-sm">
                No member directory is published yet.
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {members.map((member) => (
                  <li
                    key={member.username}
                    className="py-2 text-sm first:pt-0 last:pb-0"
                  >
                    <span className="font-medium">{member.displayName}</span>
                    <span className="text-foreground-secondary ml-2 text-xs">
                      @{member.username}
                      {member.isBoard ? ' · Board' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionShell>
        </div>
      )}

      {!user && (
        <div className="border-border flex flex-col gap-3 rounded-lg border p-4">
          <p className="text-sm">
            Sign in with a cooperative membership account to vote.
          </p>
          <Button
            size="sm"
            onClick={() => useAuthModalStore.getState().open('login')}
          >
            Log in
          </Button>
        </div>
      )}

      {user && loading && <PageLoading label="Loading motions…" />}

      {user && !loading && forbidden && (
        <div className="border-border flex flex-col gap-3 rounded-lg border p-4">
          <p className="text-sm">
            Motions are gated to active Tahti ry members. Signed in as @
            {user.username}.
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => useSettingsModalStore.getState().open('account')}
          >
            Manage membership
          </Button>
        </div>
      )}

      {user && !loading && !forbidden && motions.length === 0 && (
        <p className="text-foreground-secondary text-sm">
          No motions returned.
        </p>
      )}

      {user && !loading && !forbidden && (
        <div className="grid gap-4 md:grid-cols-2">
          <SectionShell title="Needs your attention">
            <p className="text-foreground-secondary text-sm">
              {
                motions.filter(
                  (motion) => motion.state === 'OPEN' && !motion.youVoted,
                ).length
              }{' '}
              open motion
              {motions.filter(
                (motion) => motion.state === 'OPEN' && !motion.youVoted,
              ).length === 1
                ? ''
                : 's'}{' '}
              still need your vote.
            </p>
            <p className="text-foreground-secondary mt-2 text-xs">
              {motions.filter((motion) => motion.state === 'OPEN').length} open
              motion
              {motions.filter((motion) => motion.state === 'OPEN').length === 1
                ? ''
                : 's'}{' '}
              ·{' '}
              {
                requests.filter(
                  (request) => request.status === 'OPEN' && !request.youVoted,
                ).length
              }{' '}
              topics you have not voted on
            </p>
            <Link
              to="/governance"
              onClick={closeSettings}
              className="text-foreground-secondary mt-3 text-xs hover:underline"
            >
              View all motions →
            </Link>
          </SectionShell>
          <SectionShell title="Top topics">
            {requests.length === 0 ? (
              <p className="text-foreground-secondary text-sm">
                No topics yet.
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {requests
                  .filter(
                    (request) =>
                      !['DONE', 'DECLINED', 'DUPLICATE'].includes(
                        request.status,
                      ),
                  )
                  .sort((left, right) => right.voteCount - left.voteCount)
                  .slice(0, 5)
                  .map((request) => (
                    <li
                      key={request.id}
                      className="flex items-center justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0"
                    >
                      <span className="min-w-0 truncate">{request.title}</span>
                      <span className="text-foreground-secondary shrink-0 text-xs">
                        {request.voteCount} votes
                      </span>
                    </li>
                  ))}
              </ul>
            )}
            <Link
              to="/governance/feature-requests"
              onClick={closeSettings}
              className="text-foreground-secondary mt-3 text-xs hover:underline"
            >
              View all topics →
            </Link>
          </SectionShell>
        </div>
      )}

      {user && !loading && !forbidden && (
        <SectionShell title="Submit a motion draft">
          <p className="text-foreground-secondary text-sm">
            Members can submit advisory proposals for board review. Drafts are
            not voting ballots until the board opens them.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder="Motion title"
              maxLength={200}
              className="border-border bg-background rounded-md border px-3 py-2 text-sm"
            />
            <textarea
              value={draftDescription}
              onChange={(event) => setDraftDescription(event.target.value)}
              placeholder="Explain the proposal"
              maxLength={10000}
              rows={4}
              className="border-border bg-background rounded-md border px-3 py-2 text-sm"
            />
            <Button
              size="sm"
              className="w-fit"
              disabled={
                submittingDraft ||
                !draftTitle.trim() ||
                !draftDescription.trim()
              }
              onClick={() => {
                setSubmittingDraft(true);
                const openAt = new Date().toISOString();
                const closeAt = new Date(
                  Date.now() + 14 * 24 * 60 * 60 * 1000,
                ).toISOString();
                void createGovernanceMotion({
                  title: draftTitle.trim(),
                  description: draftDescription.trim(),
                  openAt,
                  closeAt,
                  advisory: true,
                }).then((result) => {
                  setSubmittingDraft(false);
                  if (!result.ok) {
                    setActionMsg(result.error);
                    return;
                  }
                  setDraftTitle('');
                  setDraftDescription('');
                  setActionMsg('Motion draft submitted for board review.');
                  reload();
                });
              }}
            >
              {submittingDraft ? 'Submitting…' : 'Submit draft'}
            </Button>
          </div>
        </SectionShell>
      )}

      {actionMsg && (
        <p className="border-border bg-background-secondary rounded-lg border px-3 py-2 text-sm">
          {actionMsg}
        </p>
      )}

      {user && motions.length > 0 && (
        <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
          {motions.map((m) => {
            const expired = isExpiredMotion(m);
            const badge = expired
              ? { color: 'secondary' as const, label: 'Expired' }
              : stateBadge(m.state);
            return (
              <li key={m.id} className="p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-lg font-bold">{m.title}</h2>
                  <Badge variant="pill" color={badge.color}>
                    {badge.label}
                  </Badge>
                </div>
                <p className="text-foreground-secondary mt-1 text-xs">
                  {m.proposer ? `Proposed by ${m.proposer}` : 'Motion'}
                  {typeof m.totalVotes === 'number'
                    ? `, ${m.totalVotes} votes`
                    : ''}
                  {typeof m.commentCount === 'number'
                    ? `, ${m.commentCount} comments`
                    : ''}
                </p>
                {m.youVoted && (
                  <p className="mt-2 text-sm">
                    Your vote:{' '}
                    <Badge variant="pill" color="cyan">
                      {m.yourChoice ?? 'recorded'}
                    </Badge>
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

                {m.state === 'OPEN' && !expired && !m.youVoted && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(['YES', 'NO', 'ABSTAIN'] as const).map((choice) => (
                      <Button
                        key={choice}
                        size="sm"
                        variant={choice === 'YES' ? 'default' : 'secondary'}
                        disabled={votingId === m.id}
                        onClick={() => {
                          setVotingId(m.id);
                          void voteOnMotion(m.id, choice).then((r) => {
                            setVotingId(null);
                            setActionMsg(r.ok ? `Voted ${choice}.` : r.error);
                            if (r.ok) {
                              reload();
                            }
                          });
                        }}
                      >
                        {choice}
                      </Button>
                    ))}
                  </div>
                )}

                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="text"
                    onClick={() => {
                      if (expandedId === m.id) {
                        setExpandedId(null);
                      } else {
                        openThread(m.id);
                      }
                    }}
                  >
                    {expandedId === m.id ? 'Hide discussion' : 'Discussion'}
                  </Button>
                </div>

                {expandedId === m.id && (
                  <div className="border-border mt-3 flex flex-col gap-2 border-t pt-3">
                    {comments.length === 0 ? (
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
                        <input
                          value={commentBody}
                          onChange={(e) => setCommentBody(e.target.value)}
                          placeholder="Add a comment…"
                          className="border-border bg-background focus:border-primary min-w-[200px] flex-1 rounded-md border px-3 py-2 text-sm outline-none"
                        />
                        <Button
                          size="sm"
                          disabled={!commentBody.trim()}
                          onClick={() => {
                            void postMotionComment(
                              m.id,
                              commentBody.trim(),
                            ).then((r) => {
                              if (!r.ok) {
                                setActionMsg(r.error);
                                return;
                              }
                              setComments((prev) => [...prev, r.data]);
                              setCommentBody('');
                              setActionMsg('Comment posted.');
                              reload();
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
          })}
        </ul>
      )}
    </PageFrame>
  );
}
