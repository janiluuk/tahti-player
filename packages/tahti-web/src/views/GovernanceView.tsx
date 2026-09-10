import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import {
  Button,
  Input,
  SectionShell,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  createGovernanceMotion,
  fetchFeatureRequests,
  fetchGovernanceDocuments,
  fetchGovernanceMeetings,
  fetchGovernanceMembers,
  fetchGovernanceMotions,
  fetchGovernanceQuarterlyReports,
} from '../api/client';
import { parseMeetingAgenda } from '../api/governanceMocks';
import type {
  FeatureRequest,
  GovernanceDocument,
  GovernanceMeeting,
  GovernanceMember,
  GovernanceMotion,
  GovernanceQuarterlyReport,
} from '../api/types';
import { MotionCard } from '../components/governance/MotionCard';
import { PageLoading } from '../components/PageStates';
import { hasAccountRole } from '../lib/accountRoles';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { useSettingsModalStore } from '../stores/settingsModalStore';

export function GovernanceView({ embedded = false }: { embedded?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const isBoard = hasAccountRole(user, 'BOARD');
  const closeSettings = useSettingsModalStore((s) => s.close);
  const [motions, setMotions] = useState<GovernanceMotion[]>([]);
  const [motionsCursor, setMotionsCursor] = useState<string | null>(null);
  const [loadingMoreMotions, setLoadingMoreMotions] = useState(false);
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [meetings, setMeetings] = useState<GovernanceMeeting[]>([]);
  const [documents, setDocuments] = useState<GovernanceDocument[]>([]);
  const [members, setMembers] = useState<GovernanceMember[]>([]);
  const [reports, setReports] = useState<GovernanceQuarterlyReport[]>([]);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [submittingDraft, setSubmittingDraft] = useState(false);

  const MOTIONS_PAGE_SIZE = 20;

  const reload = () => {
    if (!user) {
      return;
    }
    void Promise.all([
      fetchGovernanceMotions({ limit: MOTIONS_PAGE_SIZE }),
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
        setMotionsCursor(motionsResult.nextCursor);
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

  const loadMoreMotions = () => {
    if (!user || !motionsCursor || loadingMoreMotions) {
      return;
    }
    setLoadingMoreMotions(true);
    void fetchGovernanceMotions({
      limit: MOTIONS_PAGE_SIZE,
      cursor: motionsCursor,
    }).then((result) => {
      setMotions((prev) => [...prev, ...result.data]);
      setMotionsCursor(result.nextCursor);
      setLoadingMoreMotions(false);
    });
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

  const body = (
    <>
      {!embedded && (
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
            to="/studio/governance"
            search={{ tab: 'guide' }}
            onClick={closeSettings}
            className="text-foreground-secondary inline-block w-fit text-xs underline-offset-2 hover:underline"
          >
            Governance help →
          </Link>
        </div>
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
                      <Link
                        to="/governance/meetings/$id"
                        params={{ id: meeting.id }}
                        className="font-medium hover:underline"
                      >
                        {meeting.title}
                      </Link>
                      <div className="text-foreground-secondary mt-0.5 text-xs">
                        {meeting.scheduledAt
                          ? new Date(meeting.scheduledAt).toLocaleDateString()
                          : 'Date not listed'}{' '}
                        · {meeting.state}
                        {meeting.quorumMet !== null &&
                          ` · quorum ${meeting.quorumMet ? 'met' : 'not met'}`}
                        {meeting.eligibleMemberCount !== null &&
                          ` · ${meeting.presentCount} of ${meeting.eligibleMemberCount} present`}
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
                {members.slice(0, 8).map((member) => (
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
            <Link
              to="/governance/members"
              onClick={closeSettings}
              className="text-foreground-secondary mt-3 text-xs hover:underline"
            >
              View full directory →
            </Link>
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
          <div className="flex items-center gap-1.5">
            <span className="text-foreground-secondary text-xs">
              Advisory proposals for board review
            </span>
            <Tooltip
              side="bottom"
              content={
                <p className="max-w-64 text-xs leading-relaxed">
                  Members can submit advisory proposals for board review. Drafts
                  are not voting ballots until the board opens them.
                </p>
              }
            >
              <span
                tabIndex={0}
                aria-label="About motion drafts"
                className="text-foreground-secondary hover:text-foreground inline-flex size-4 cursor-help items-center justify-center rounded-full border border-current"
              >
                <span className="text-[10px] leading-none font-bold">?</span>
              </span>
            </Tooltip>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <Input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder="Motion title"
              maxLength={200}
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
        <div className="flex flex-col gap-3">
          <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
            {motions.map((m) => (
              <MotionCard
                key={m.id}
                motion={m}
                isBoard={isBoard}
                memberCount={members.length}
                linkTitle
                onChanged={reload}
              />
            ))}
          </ul>
          {motionsCursor ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={loadingMoreMotions}
              onClick={loadMoreMotions}
            >
              {loadingMoreMotions ? 'Loading…' : 'Load more motions'}
            </Button>
          ) : null}
        </div>
      )}
    </>
  );

  if (embedded) {
    return <div className="flex flex-col gap-6">{body}</div>;
  }

  return (
    <ViewShell
      title="Governance"
      classes={{
        root: 'px-0 pt-0 mx-auto max-w-3xl',
        scrollableArea: 'gap-6',
      }}
    >
      {body}
    </ViewShell>
  );
}
