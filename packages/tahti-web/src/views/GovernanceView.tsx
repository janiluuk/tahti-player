import { Link } from '@tanstack/react-router';
import {
  ArrowRightIcon,
  FileTextIcon,
  HelpCircleIcon,
  HistoryIcon,
  LandmarkIcon,
  MessagesSquareIcon,
  ScrollTextIcon,
  UsersIcon,
  VoteIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Box,
  Button,
  ButtonLink,
  ExternalLink,
  Input,
  StatChip,
  Textarea,
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
  fetchMotionCommentsBulk,
  type MotionComment,
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
import { AnnualReportsPanel } from '../components/governance/AnnualReportsPanel';
import { AssociationPanel } from '../components/governance/AssociationPanel';
import { CorrectionsPanel } from '../components/governance/CorrectionsPanel';
import { CurrentBoardPanel } from '../components/governance/CurrentBoardPanel';
import { ElectionsPanel } from '../components/governance/ElectionsPanel';
import { GovernancePanel } from '../components/governance/GovernancePanel';
import { LatestDiscussionsPanel } from '../components/governance/LatestDiscussionsPanel';
import { MotionCard } from '../components/governance/MotionCard';
import { PageBackLink } from '../components/PageBackLink';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { hasAccountRole } from '../lib/accountRoles';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { useSettingsModalStore } from '../stores/settingsModalStore';

function LoadErrorCaption({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <p className="text-foreground-secondary mb-2 text-xs" role="status">
      Could not refresh this list: {message}{' '}
      <Button
        variant="plain"
        size="flexible"
        className="inline p-0 text-xs underline underline-offset-2"
        onClick={onRetry}
      >
        Retry
      </Button>
    </p>
  );
}

const QUICK_LINKS = [
  {
    to: '/governance/discussions' as const,
    label: 'Discussions',
    icon: MessagesSquareIcon,
  },
  {
    to: '/governance/feature-requests' as const,
    label: 'Feature requests',
    icon: VoteIcon,
  },
  {
    to: '/governance/history' as const,
    label: 'Closed decisions',
    icon: HistoryIcon,
  },
  {
    to: '/transparency' as const,
    label: 'Transparency ledger',
    icon: ScrollTextIcon,
  },
  {
    to: '/studio/governance' as const,
    search: { tab: 'guide' } as const,
    label: 'Governance help',
    icon: HelpCircleIcon,
  },
];

export function GovernanceView({ embedded = false }: { embedded?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const isBoard = hasAccountRole(user, 'BOARD');
  const closeSettings = useSettingsModalStore((s) => s.close);
  const [motions, setMotions] = useState<GovernanceMotion[]>([]);
  const [motionComments, setMotionComments] = useState<
    Record<string, MotionComment[]>
  >({});
  const [motionsCursor, setMotionsCursor] = useState<string | null>(null);
  const [loadingMoreMotions, setLoadingMoreMotions] = useState(false);
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [meetings, setMeetings] = useState<GovernanceMeeting[]>([]);
  const [documents, setDocuments] = useState<GovernanceDocument[]>([]);
  const [members, setMembers] = useState<GovernanceMember[]>([]);
  const [reports, setReports] = useState<GovernanceQuarterlyReport[]>([]);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState<
    Partial<
      Record<
        | 'motions'
        | 'requests'
        | 'meetings'
        | 'documents'
        | 'members'
        | 'reports',
        string
      >
    >
  >({});
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
        if (motionsResult.data.length > 0) {
          void fetchMotionCommentsBulk(
            motionsResult.data.map((m) => m.id),
          ).then((res) => setMotionComments(res.data));
        }
        setRequests(requestsResult.data);
        setMeetings(meetingsResult.data);
        setDocuments(documentsResult.data);
        setMembers(membersResult.data);
        setReports(reportsResult.data);
        const reasonOf = (meta: { source: string; reason?: string }) =>
          meta.source === 'api' ? meta.reason : undefined;
        setLoadErrors({
          motions: motionsResult.forbidden
            ? undefined
            : reasonOf(motionsResult.meta),
          requests: requestsResult.forbidden
            ? undefined
            : reasonOf(requestsResult.meta),
          meetings: reasonOf(meetingsResult.meta),
          documents: reasonOf(documentsResult.meta),
          members: reasonOf(membersResult.meta),
          reports: reasonOf(reportsResult.meta),
        });
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
      const reason =
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null;
      if (reason) {
        setActionMsg(`Could not load more motions: ${reason}`);
        setLoadingMoreMotions(false);
        return;
      }
      setActionMsg(null);
      setMotions((prev) => [...prev, ...result.data]);
      setMotionsCursor(result.nextCursor);
      setLoadingMoreMotions(false);
      if (result.data.length > 0) {
        void fetchMotionCommentsBulk(result.data.map((m) => m.id)).then((res) =>
          setMotionComments((prev) => ({ ...prev, ...res.data })),
        );
      }
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

  const openMotionsCount = motions.filter(
    (motion) => motion.state === 'OPEN' && !motion.youVoted,
  ).length;
  const openMotionsTotal = motions.filter(
    (motion) => motion.state === 'OPEN',
  ).length;
  const openTopicsCount = requests.filter(
    (request) => request.status === 'OPEN' && !request.youVoted,
  ).length;

  const body = (
    <>
      {!embedded && (
        <div className="flex flex-wrap gap-2">
          {QUICK_LINKS.map((link) => (
            <ButtonLink
              key={link.label}
              to={link.to}
              search={'search' in link ? link.search : undefined}
              onClick={closeSettings}
              size="sm"
              variant="secondary"
            >
              <link.icon size={14} aria-hidden className="mr-1.5" />
              {link.label}
            </ButtonLink>
          ))}
        </div>
      )}

      {user && !loading && !forbidden && (
        <div className="grid grid-cols-1 gap-3 min-[22.5rem]:grid-cols-2 sm:grid-cols-4">
          <StatChip
            value={openMotionsTotal}
            label="Open motions"
            icon={<VoteIcon size={16} aria-hidden />}
          />
          <StatChip
            value={requests.length}
            label="Topics"
            icon={<LandmarkIcon size={16} aria-hidden />}
          />
          <StatChip
            value={meetings.length}
            label="Meetings"
            icon={<UsersIcon size={16} aria-hidden />}
          />
          <StatChip
            value={documents.length}
            label="Documents"
            icon={<FileTextIcon size={16} aria-hidden />}
          />
        </div>
      )}

      {user && !loading && !forbidden && <LatestDiscussionsPanel />}

      {!user && (
        <Box variant="secondary" className="flex flex-col gap-3">
          <p className="text-sm">
            Sign in with a cooperative membership account to vote.
          </p>
          <Button
            size="sm"
            className="w-fit"
            onClick={() => useAuthModalStore.getState().open('login')}
          >
            Log in
          </Button>
        </Box>
      )}

      {user && loading && <PageLoading label="Loading motions…" />}

      {user && !loading && forbidden && (
        <Box variant="secondary" className="flex flex-col gap-3">
          <p className="text-sm">
            Motions are gated to active Tahti ry members. Signed in as @
            {user.username}.
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="w-fit"
            onClick={() => useSettingsModalStore.getState().open('account')}
          >
            Manage membership
          </Button>
        </Box>
      )}

      {user && !loading && !forbidden && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <GovernancePanel
            title="Needs your attention"
            icon={VoteIcon}
            variant="secondary"
          >
            <p className="text-sm opacity-90">
              {openMotionsCount === 1
                ? '1 open motion still needs your vote.'
                : `${openMotionsCount} open motions still need your vote.`}
            </p>
            <p className="text-xs">
              {openMotionsTotal} open motion
              {openMotionsTotal === 1 ? '' : 's'} · {openTopicsCount} topic
              {openTopicsCount === 1 ? '' : 's'} you have not voted on
            </p>
            <ButtonLink
              to="/governance"
              onClick={closeSettings}
              size="sm"
              variant="noShadow"
              className="mt-1 w-fit"
            >
              View all motions
              <ArrowRightIcon size={14} aria-hidden className="ml-1.5" />
            </ButtonLink>
          </GovernancePanel>
          <GovernancePanel title="Top topics" icon={LandmarkIcon}>
            {loadErrors.requests && requests.length > 0 ? (
              <LoadErrorCaption
                message={loadErrors.requests}
                onRetry={reload}
              />
            ) : null}
            {loadErrors.requests && requests.length === 0 ? (
              <PageError
                title="Could not load topics"
                description={loadErrors.requests}
                onRetry={reload}
              />
            ) : requests.length === 0 ? (
              <PageEmpty title="No topics yet." />
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
              className="text-foreground-secondary mt-1 text-xs hover:underline"
            >
              View all topics →
            </Link>
          </GovernancePanel>
        </div>
      )}

      {user && !loading && !forbidden && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <GovernancePanel title="Published meetings" icon={UsersIcon}>
            {loadErrors.meetings && meetings.length > 0 ? (
              <LoadErrorCaption
                message={loadErrors.meetings}
                onRetry={reload}
              />
            ) : null}
            {loadErrors.meetings && meetings.length === 0 ? (
              <PageError
                title="Could not load meetings"
                description={loadErrors.meetings}
                onRetry={reload}
              />
            ) : meetings.length === 0 ? (
              <PageEmpty title="No published meeting records yet." />
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
          </GovernancePanel>
          <GovernancePanel title="Published documents" icon={FileTextIcon}>
            {loadErrors.documents && documents.length > 0 ? (
              <LoadErrorCaption
                message={loadErrors.documents}
                onRetry={reload}
              />
            ) : null}
            {loadErrors.documents && documents.length === 0 ? (
              <PageError
                title="Could not load documents"
                description={loadErrors.documents}
                onRetry={reload}
              />
            ) : documents.length === 0 ? (
              <PageEmpty title="No governance documents have been published yet." />
            ) : (
              <ul className="divide-border divide-y">
                {documents.map((document) => (
                  <li
                    key={document.id}
                    className="py-2 text-sm first:pt-0 last:pb-0"
                  >
                    {document.downloadUrl || document.externalUrl ? (
                      <ExternalLink
                        href={
                          document.downloadUrl ??
                          document.externalUrl ??
                          undefined
                        }
                        className="font-medium no-underline underline-offset-2 hover:underline"
                      >
                        {document.title}
                      </ExternalLink>
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
          </GovernancePanel>
          <GovernancePanel title="Quarterly reviews" icon={ScrollTextIcon}>
            {loadErrors.reports && reports.length > 0 ? (
              <LoadErrorCaption message={loadErrors.reports} onRetry={reload} />
            ) : null}
            {loadErrors.reports && reports.length === 0 ? (
              <PageError
                title="Could not load reviews"
                description={loadErrors.reports}
                onRetry={reload}
              />
            ) : reports.length === 0 ? (
              <PageEmpty title="No quarterly feature-request reviews have been published yet." />
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
          </GovernancePanel>
          <GovernancePanel title="Member directory" icon={UsersIcon}>
            {loadErrors.members && members.length > 0 ? (
              <LoadErrorCaption message={loadErrors.members} onRetry={reload} />
            ) : null}
            {loadErrors.members && members.length === 0 ? (
              <PageError
                title="Could not load the member directory"
                description={loadErrors.members}
                onRetry={reload}
              />
            ) : members.length === 0 ? (
              <PageEmpty title="No member directory is published yet." />
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
              className="text-foreground-secondary mt-1 text-xs hover:underline"
            >
              View full directory →
            </Link>
          </GovernancePanel>
          <CurrentBoardPanel />
          <ElectionsPanel />
          <AnnualReportsPanel />
          <AssociationPanel />
          <CorrectionsPanel />
        </div>
      )}

      {user && !loading && !forbidden && (
        <GovernancePanel title="Submit a motion draft" icon={VoteIcon}>
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
                role="img"
                aria-label="About motion drafts"
                className="text-foreground-secondary hover:text-foreground inline-flex size-4 cursor-help items-center justify-center rounded-full border border-current"
              >
                <span className="text-[10px] leading-none font-bold">?</span>
              </span>
            </Tooltip>
          </div>
          <form
            className="flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
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
            <Input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              aria-label="Motion title"
              placeholder="Motion title"
              maxLength={200}
            />
            <Textarea
              submitOnModEnter
              tone="secondary"
              value={draftDescription}
              onChange={(event) => setDraftDescription(event.target.value)}
              aria-label="Explain the proposal"
              placeholder="Explain the proposal"
              maxLength={10000}
              rows={4}
              className="text-sm"
            />
            <Button
              size="sm"
              className="w-fit"
              disabled={
                submittingDraft ||
                !draftTitle.trim() ||
                !draftDescription.trim()
              }
              type="submit"
            >
              {submittingDraft ? 'Submitting…' : 'Submit draft'}
            </Button>
          </form>
        </GovernancePanel>
      )}

      {actionMsg && (
        <p className="border-border bg-background-secondary rounded-lg border px-3 py-2 text-sm">
          {actionMsg}
        </p>
      )}

      {user &&
        !loading &&
        !forbidden &&
        motions.length === 0 &&
        (loadErrors.motions ? (
          <PageError
            title="Could not load motions"
            description={loadErrors.motions}
            onRetry={reload}
          />
        ) : (
          <PageEmpty title="No motions yet" />
        ))}

      {user && motions.length > 0 && (
        <div className="flex flex-col gap-3">
          {loadErrors.motions ? (
            <LoadErrorCaption message={loadErrors.motions} onRetry={reload} />
          ) : null}
          <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
            {motions.map((m) => (
              <MotionCard
                key={m.id}
                motion={m}
                isBoard={isBoard}
                memberCount={members.length}
                linkTitle
                preloadedComments={motionComments[m.id]}
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
        root: 'px-0 pt-0 mx-auto max-w-5xl',
        content: 'gap-6',
      }}
    >
      <PageBackLink to="/what-is-it" label="What is Tahti" />
      {body}
    </ViewShell>
  );
}
