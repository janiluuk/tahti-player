import { Link } from '@tanstack/react-router';
import {
  BanknoteIcon,
  BuildingIcon,
  FileTextIcon,
  GavelIcon,
  ScrollTextIcon,
  ShieldCheckIcon,
  VoteIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, Input, SaveButton, Select, Textarea } from '@tahti-player/ui';

import {
  createAdminResolution,
  fetchAdminGovernanceActivity,
  fetchAdminGovernanceOverview,
  fetchAdminResolutions,
  patchAdminResolution,
  type AdminActivityEntry,
  type AdminGovernanceOverview,
} from '../../api/admin';
import type { BoardResolution } from '../../api/types';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { StudioPageHeader, StudioPanel } from '../../components/StudioPanel';

type ResolutionOutcome = 'PASSED' | 'FAILED' | 'DEFERRED';

export function AdminGovernanceView() {
  const [overview, setOverview] = useState<AdminGovernanceOverview | null>(
    null,
  );
  const [activity, setActivity] = useState<AdminActivityEntry[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [resolutions, setResolutions] = useState<BoardResolution[]>([]);
  const [resolutionTitle, setResolutionTitle] = useState('');
  const [resolutionBody, setResolutionBody] = useState('');
  const [resolutionOutcome, setResolutionOutcome] =
    useState<ResolutionOutcome>('PASSED');
  const [resolutionFor, setResolutionFor] = useState('1');
  const [resolutionAgainst, setResolutionAgainst] = useState('0');
  const [resolutionAbstain, setResolutionAbstain] = useState('0');
  const [resolutionBusy, setResolutionBusy] = useState(false);

  useEffect(() => {
    void Promise.all([
      fetchAdminGovernanceOverview(),
      fetchAdminGovernanceActivity(),
      fetchAdminResolutions(),
    ]).then(([overviewResult, activityResult, resolutionsResult]) => {
      setOverview(overviewResult.data);
      setActivity(activityResult.data);
      setTotalVotes(activityResult.totalVotes);
      setTotalComments(activityResult.totalComments);
      setResolutions(resolutionsResult.data);
    });
  }, []);

  const votingActivity = activity.filter((entry) =>
    ['VOTE_CAST', 'FEATURE_REQUEST_VOTE', 'FEATURE_REQUEST_UNVOTE'].includes(
      entry.action,
    ),
  );
  const discussionActivity = activity.filter((entry) =>
    ['MOTION_COMMENT_CREATE', 'FEATURE_REQUEST_COMMENT_CREATE'].includes(
      entry.action,
    ),
  );
  const discussionCount = new Set(
    discussionActivity.map((entry) => entry.targetId).filter(Boolean),
  ).size;
  const textMeta = (entry: AdminActivityEntry, key: string) =>
    typeof entry.meta[key] === 'string' ? String(entry.meta[key]) : null;
  const activitySubject = (entry: AdminActivityEntry) =>
    textMeta(entry, 'subjectTitle') ??
    textMeta(entry, 'title') ??
    entry.targetId ??
    'Governance item';
  const activityAction = (entry: AdminActivityEntry) => {
    if (entry.action === 'VOTE_CAST') {
      return `Voted ${textMeta(entry, 'choice') ?? ''}`.trim();
    }
    if (entry.action === 'FEATURE_REQUEST_VOTE') {
      return 'Voted for topic';
    }
    if (entry.action === 'FEATURE_REQUEST_UNVOTE') {
      return 'Removed vote';
    }
    return 'Commented';
  };

  const cards: {
    icon: typeof VoteIcon;
    title: string;
    desc: string;
    badge?: string;
    to?: string;
  }[] = [
    {
      icon: VoteIcon,
      title: 'Member motions & voting',
      desc: 'Open member motions and the public governance portal.',
      badge: overview ? `${overview.openMotions} open` : undefined,
      to: '/governance',
    },
    {
      icon: BuildingIcon,
      title: 'Venue verification queue',
      desc: 'Review and verify venue submissions for the events calendar.',
      badge: overview
        ? `${overview.pendingVenueVerifications} pending`
        : undefined,
      to: '/admin/venues',
    },
    {
      icon: ScrollTextIcon,
      title: 'Annual report generator',
      desc: 'Generate and store the yearly nonprofit activity report.',
      badge: overview?.lastAnnualReportYear
        ? `Last: ${overview.lastAnnualReportYear}`
        : undefined,
      to: '/admin/reports',
    },
    {
      icon: GavelIcon,
      title: 'Board resolutions',
      desc: 'Record and publish formal board decisions and vote outcomes — form below.',
      badge: overview
        ? `${overview.boardResolutionsThisYear} this year`
        : undefined,
    },
    {
      icon: VoteIcon,
      title: 'Annual General Meeting',
      desc: 'Agenda builder, open motions, member notice checklist, and minutes links.',
      to: '/admin/agm',
    },
    {
      icon: BanknoteIcon,
      title: 'Grants',
      desc: 'Yearly grant cycles, applications, and payout tracking.',
      to: '/admin/grants',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Audit log',
      desc: 'Searchable log of privileged actions across the platform.',
      to: '/admin/logs',
    },
    {
      icon: FileTextIcon,
      title: 'Member register',
      desc: 'Full member list, exportable for the AGM notice mailing.',
      to: '/admin/users',
    },
  ];

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/governance">
          <div className="flex max-w-4xl flex-col gap-6">
            <StudioPageHeader
              title="Governance"
              subtitle="Association governance tools — motions, venues, resolutions, AGM, and audit trail."
            />

            <StudioPanel
              title="Member activity"
              description="Voting and discussion activity across motions and feature topics."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="border-border bg-background-secondary/35 rounded-lg border p-3">
                  <p className="text-foreground-secondary text-xs uppercase">
                    Votes recorded
                  </p>
                  <p className="mt-1 text-2xl font-bold">{totalVotes}</p>
                </div>
                <div className="border-border bg-background-secondary/35 rounded-lg border p-3">
                  <p className="text-foreground-secondary text-xs uppercase">
                    Discussions
                  </p>
                  <p className="mt-1 text-2xl font-bold">{discussionCount}</p>
                  <p className="text-foreground-secondary text-xs">
                    Subjects with comments
                  </p>
                </div>
                <div className="border-border bg-background-secondary/35 rounded-lg border p-3">
                  <p className="text-foreground-secondary text-xs uppercase">
                    Comments
                  </p>
                  <p className="mt-1 text-2xl font-bold">{totalComments}</p>
                  <p className="text-foreground-secondary text-xs">
                    Recorded governance comments
                  </p>
                </div>
              </div>

              <div className="border-border mt-4 overflow-x-auto rounded-lg border">
                <div className="border-border border-b px-3 py-2">
                  <h3 className="text-xs font-semibold tracking-wide uppercase">
                    Recent voting activity
                  </h3>
                </div>
                {votingActivity.length === 0 ? (
                  <p className="text-foreground-secondary px-3 py-4 text-sm">
                    No voting activity recorded.
                  </p>
                ) : (
                  <ul className="divide-border divide-y">
                    {votingActivity.slice(0, 12).map((entry) => (
                      <li
                        key={entry.id}
                        className="flex min-w-[38rem] items-start gap-3 px-3 py-2.5 text-sm"
                      >
                        <time
                          dateTime={entry.createdAt}
                          className="text-foreground-secondary w-32 shrink-0 text-xs"
                        >
                          {new Date(entry.createdAt).toLocaleString([], {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </time>
                        <span className="w-36 shrink-0 font-medium">
                          {entry.actorDisplayName ??
                            entry.actorUsername ??
                            entry.actorId}
                        </span>
                        <span className="text-foreground-secondary w-32 shrink-0 text-xs">
                          {activityAction(entry)}
                        </span>
                        <span className="min-w-0 truncate">
                          {activitySubject(entry)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="text-foreground-secondary mt-3 text-xs">
                Every governance vote and comment is attributed to the account
                that performed it and retains the subject context in the audit
                log.{' '}
                <Link
                  to="/admin/logs"
                  className="underline-offset-2 hover:underline"
                >
                  Open full audit log →
                </Link>
              </p>
            </StudioPanel>

            <StudioPanel title="Board resolutions">
              <p className="text-foreground-secondary text-sm">
                Record formal board decisions here. These are separate from
                advisory member motions and can be published after approval.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Input
                  value={resolutionTitle}
                  onChange={(event) => setResolutionTitle(event.target.value)}
                  placeholder="Resolution title"
                />
                <Select
                  value={resolutionOutcome}
                  onValueChange={(value) =>
                    setResolutionOutcome(value as ResolutionOutcome)
                  }
                  options={[
                    { id: 'PASSED', label: 'Passed' },
                    { id: 'FAILED', label: 'Failed' },
                    { id: 'DEFERRED', label: 'Deferred' },
                  ]}
                />
                <Textarea
                  value={resolutionBody}
                  onChange={(event) => setResolutionBody(event.target.value)}
                  placeholder="Resolution body"
                  rows={4}
                  className="sm:col-span-2"
                />
                <Input
                  value={resolutionFor}
                  onChange={(event) => setResolutionFor(event.target.value)}
                  inputMode="numeric"
                  placeholder="Votes for"
                />
                <Input
                  value={resolutionAgainst}
                  onChange={(event) => setResolutionAgainst(event.target.value)}
                  inputMode="numeric"
                  placeholder="Votes against"
                />
                <Input
                  value={resolutionAbstain}
                  onChange={(event) => setResolutionAbstain(event.target.value)}
                  inputMode="numeric"
                  placeholder="Abstentions"
                />
              </div>
              <SaveButton
                size="sm"
                className="mt-3"
                disabled={
                  resolutionBusy ||
                  !resolutionTitle.trim() ||
                  !resolutionBody.trim()
                }
                saving={resolutionBusy}
                label="Record resolution"
                onClick={() => {
                  setResolutionBusy(true);
                  void createAdminResolution({
                    title: resolutionTitle.trim(),
                    body: resolutionBody.trim(),
                    votedAt: new Date().toISOString(),
                    outcome: resolutionOutcome,
                    voteFor: Number(resolutionFor) || 0,
                    voteAgainst: Number(resolutionAgainst) || 0,
                    voteAbstain: Number(resolutionAbstain) || 0,
                  }).then((result) => {
                    setResolutionBusy(false);
                    if (result.data) {
                      setResolutions((current) => [result.data!, ...current]);
                      setResolutionTitle('');
                      setResolutionBody('');
                    }
                  });
                }}
              />
              <ul className="divide-border mt-4 divide-y">
                {resolutions.map((resolution) => (
                  <li
                    key={resolution.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                  >
                    <span>
                      <span className="font-medium">{resolution.title}</span>
                      <span className="text-foreground-secondary ml-2 text-xs">
                        {resolution.outcome}
                      </span>
                    </span>
                    {!resolution.publishedAt && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          void patchAdminResolution(resolution.id, {
                            publishedAt: new Date().toISOString(),
                          }).then((result) => {
                            if (result.data) {
                              setResolutions((current) =>
                                current.map((item) =>
                                  item.id === result.data!.id
                                    ? result.data!
                                    : item,
                                ),
                              );
                            }
                          });
                        }}
                      >
                        Publish
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </StudioPanel>

            <div className="grid gap-3 sm:grid-cols-2">
              {cards.map((c) => {
                const Icon = c.icon;
                const content = (
                  <StudioPanel key={c.title} className="h-full">
                    <div className="flex items-start gap-3">
                      <Icon
                        size={18}
                        aria-hidden
                        className="text-foreground-secondary mt-0.5 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-medium">{c.title}</div>
                          {c.badge && (
                            <span className="text-foreground-secondary shrink-0 text-xs">
                              {c.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-foreground-secondary mt-1 text-xs">
                          {c.desc}
                        </p>
                      </div>
                    </div>
                  </StudioPanel>
                );
                return c.to ? (
                  <Link
                    key={c.title}
                    to={c.to}
                    className="rounded-xl transition-opacity hover:opacity-80"
                  >
                    {content}
                  </Link>
                ) : (
                  content
                );
              })}
            </div>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
