import { Link } from '@tanstack/react-router';
import {
  BarChart3Icon,
  CalendarIcon,
  CreditCardIcon,
  DiscAlbumIcon,
  LayoutTemplateIcon,
  LibraryBigIcon,
  MicIcon,
  NewspaperIcon,
  RadioIcon,
  RocketIcon,
  UploadCloudIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState, type FC, type ReactNode } from 'react';

import { Badge, Button, CardGrid, StatChip } from '@tahti-player/ui';

import {
  fetchRecentBroadcasts,
  type RecentBroadcast,
} from '../../api/broadcast';
import { fetchFeatureRequests, fetchGovernanceMotions } from '../../api/client';
import { fetchShowSchedule, type ScheduledShow } from '../../api/shows';
import {
  fetchStudioCollections,
  fetchStudioReleases,
  fetchStudioSounds,
} from '../../api/studio';
import { fetchStatsSummary, type StatsSummary } from '../../api/studio-extras';
import type { FeatureRequest, GovernanceMotion } from '../../api/types';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPageHeader } from '../../components/StudioPanel';
import { Eyebrow } from '../../components/tahti/Eyebrow';
import { useStripeConfigured } from '../../hooks/useStripeConfigured';
import { accountRoleLabel, getAccountRole } from '../../lib/accountRoles';
import { timeOfDayGreeting } from '../../lib/greeting';
import { useAuthStore } from '../../stores/authStore';
import { useChannelSetupModalStore } from '../../stores/channelSetupModalStore';

type Counts = { archive: number; collections: number; releases: number };

function formatBroadcastDate(iso: string): string {
  return new Date(iso).toLocaleString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatBroadcastDuration(seconds: number | undefined): string {
  if (!seconds) {
    return '';
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function RecentBroadcastRow({ broadcast }: { broadcast: RecentBroadcast }) {
  const title =
    broadcast.title ||
    broadcast.soundTitle ||
    `Broadcast ${formatBroadcastDate(broadcast.startedAt)}`;
  const published = broadcast.soundStatus === 'READY';

  return (
    <li className="border-border flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0">
      <span className="bg-accent-red/15 text-accent-red flex size-9 shrink-0 items-center justify-center rounded-lg text-sm">
        ●
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{title}</p>
        <p className="text-foreground-secondary truncate text-xs">
          {formatBroadcastDate(broadcast.startedAt)}
          {broadcast.durationSec
            ? ` · ${formatBroadcastDuration(broadcast.durationSec)}`
            : ''}
          {broadcast.source
            ? ` · ${broadcast.source.toLowerCase().replace('_', ' ')}`
            : ''}
        </p>
      </div>
      <span
        className={`text-xs font-medium ${
          published ? 'text-accent-green' : 'text-foreground-secondary'
        }`}
      >
        {published ? 'Published' : 'Recorded'}
      </span>
      <Link
        to={broadcast.soundId ? '/studio/sounds/$id' : '/studio/recordings'}
        params={broadcast.soundId ? { id: broadcast.soundId } : undefined}
      >
        <Button size="sm" variant="secondary">
          {broadcast.soundId ? 'Open' : 'Publish'}
        </Button>
      </Link>
    </li>
  );
}

const EMPTY_STATS: StatsSummary = {
  playsToday: 0,
  playsTotal: 0,
  downloadsToday: 0,
  downloadsTotal: 0,
  followerCount: 0,
};

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2>
        <Eyebrow>{title}</Eyebrow>
      </h2>
      {children}
    </section>
  );
}

/** Colour-coded, icon-first nav tile — the label sits in a translucent
 * strip over the icon (opacity layer) so it stays legible regardless of
 * the tile's background colour, instead of plain text below an artwork
 * square like the music Card component. */
function StudioActionTile({
  to,
  icon: Icon,
  label,
  subtitle,
  color,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  subtitle?: string;
  color: string;
}) {
  return (
    <Link
      to={to}
      className="group border-border relative flex aspect-[4/3] flex-col overflow-hidden rounded-xl border shadow-sm transition-transform hover:-translate-y-0.5"
      style={{ background: color }}
    >
      <div className="relative z-10 bg-black/45 px-3 py-2 backdrop-blur-sm">
        <div className="truncate text-sm font-bold text-white">{label}</div>
        {subtitle ? (
          <div className="truncate text-[11px] text-white/75">{subtitle}</div>
        ) : null}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon
          size={40}
          absoluteStrokeWidth
          strokeWidth={1.5}
          className="text-white/90 transition-transform group-hover:scale-110"
          aria-hidden
        />
      </div>
    </Link>
  );
}

type CompactBroadcastTileProps = {
  to: '/studio/go-live' | '/studio/schedule';
  icon: LucideIcon;
  label: string;
  subtitle: string;
  color: string;
};

const CompactBroadcastTile: FC<CompactBroadcastTileProps> = ({
  to,
  icon: Icon,
  label,
  subtitle,
  color,
}) => (
  <Link
    to={to}
    data-testid="compact-broadcast-card"
    className="border-border bg-background-secondary/40 hover:bg-background-secondary group flex min-h-20 items-center gap-3 rounded-xl border px-4 py-3 shadow-sm transition-transform hover:-translate-y-0.5"
  >
    <span
      className="flex size-11 shrink-0 items-center justify-center rounded-lg text-white"
      style={{ background: color }}
    >
      <Icon size={22} aria-hidden />
    </span>
    <span className="min-w-0">
      <span className="block text-sm font-bold">{label}</span>
      <span className="text-foreground-secondary block truncate text-xs">
        {subtitle}
      </span>
    </span>
  </Link>
);

type SummaryStatProps = {
  label: string;
  value: number;
  note: string;
  icon: LucideIcon;
};

const SummaryStat: FC<SummaryStatProps> = ({
  label,
  value,
  note,
  icon: Icon,
}) => (
  <Link
    to="/studio/stats"
    aria-label={`${value.toLocaleString()} ${label.toLowerCase()}`}
    className="border-border bg-background-secondary/35 hover:bg-background-secondary group flex min-w-0 flex-col gap-2 rounded-xl border p-4 shadow-sm transition-transform hover:-translate-y-0.5"
  >
    <StatChip
      value={value.toLocaleString()}
      label={label}
      icon={<Icon size={16} aria-hidden className="text-primary" />}
    />
    <span className="text-foreground-secondary text-xs">{note}</span>
  </Link>
);

export function StudioHomeView() {
  const user = useAuthStore((s) => s.user);
  const openChannelSetup = useChannelSetupModalStore((s) => s.open);
  const stripeConfigured = useStripeConfigured();
  const [counts, setCounts] = useState<Counts>({
    archive: 0,
    collections: 0,
    releases: 0,
  });
  const [stats, setStats] = useState<StatsSummary>(EMPTY_STATS);
  const [upcomingShows, setUpcomingShows] = useState<ScheduledShow[]>([]);
  const [recentBroadcasts, setRecentBroadcasts] = useState<RecentBroadcast[]>(
    [],
  );
  const [governanceMotions, setGovernanceMotions] = useState<
    GovernanceMotion[]
  >([]);
  const [governanceRequests, setGovernanceRequests] = useState<
    FeatureRequest[]
  >([]);

  useEffect(() => {
    if (!user?.channel) {
      return;
    }
    void Promise.all([
      fetchStudioSounds(),
      fetchStudioCollections(),
      fetchStudioReleases(),
      fetchStatsSummary(),
      fetchShowSchedule(),
      fetchRecentBroadcasts(5),
    ]).then(
      ([archive, collections, releases, summary, showSchedule, broadcasts]) => {
        setCounts({
          archive: archive.data.length,
          collections: collections.data.length,
          releases: releases.data.releases.length,
        });
        setStats(summary.data);
        setUpcomingShows(
          showSchedule.data.scheduledShows
            .filter((show) => new Date(show.startAt).getTime() > Date.now())
            .sort(
              (left, right) =>
                new Date(left.startAt).getTime() -
                new Date(right.startAt).getTime(),
            ),
        );
        setRecentBroadcasts(broadcasts.data);
      },
    );
    void Promise.all([fetchGovernanceMotions(), fetchFeatureRequests()]).then(
      ([motionsResult, requestsResult]) => {
        setGovernanceMotions(motionsResult.data);
        setGovernanceRequests(requestsResult.data);
      },
    );
  }, [user?.channel]);

  const channel = user?.channel;
  const governanceVotes = governanceMotions.filter(
    (motion) => motion.state === 'OPEN' && !motion.youVoted,
  );
  const unresolvedRequests = governanceRequests.filter(
    (request) => !['DONE', 'DECLINED', 'DUPLICATE'].includes(request.status),
  );
  const discussionUpdates = [
    ...governanceMotions
      .filter(
        (motion) => motion.state !== 'CLOSED' && (motion.commentCount ?? 0) > 0,
      )
      .map((motion) => ({
        id: `motion-${motion.id}`,
        title: motion.title,
        detail: `${motion.commentCount} discussion comment${motion.commentCount === 1 ? '' : 's'}`,
        to: '/studio/governance' as const,
      })),
    ...unresolvedRequests
      .filter((request) => request.commentCount > 0)
      .map((request) => ({
        id: `request-${request.id}`,
        title: request.title,
        detail: `${request.commentCount} discussion comment${request.commentCount === 1 ? '' : 's'}`,
        to: '/governance/feature-requests' as const,
      })),
  ].slice(0, 5);

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-8">
        <StudioNav current="/studio" />

        <div className="flex flex-col gap-4">
          <StudioPageHeader
            title={
              user
                ? `${timeOfDayGreeting(new Date().getHours())}, ${user.displayName || user.username}`
                : 'Studio'
            }
            action={
              user ? (
                <div
                  aria-label="Account status"
                  className="flex flex-wrap items-center justify-end gap-2"
                >
                  <Badge variant="pill" color="purple">
                    {accountRoleLabel(getAccountRole(user))}
                  </Badge>
                  <Badge
                    variant="pill"
                    color={user.isMember ? 'green' : 'secondary'}
                  >
                    {user.isMember ? 'Member' : 'Community account'}
                  </Badge>
                </div>
              ) : undefined
            }
          />
          {!channel ? (
            <p className="text-foreground-secondary text-sm">
              <button
                type="button"
                onClick={openChannelSetup}
                className="text-foreground underline-offset-2 hover:underline"
              >
                Create your channel
              </button>{' '}
              to unlock Music and Go Live.
            </p>
          ) : null}
        </div>

        {!channel ? null : (
          <>
            <section
              aria-label="Channel summary"
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              <SummaryStat
                label="Plays today"
                value={stats.playsToday}
                note="Open detailed stats"
                icon={RadioIcon}
              />
              <SummaryStat
                label="Total plays"
                value={stats.playsTotal}
                note="All-time audience"
                icon={BarChart3Icon}
              />
              <SummaryStat
                label="Total downloads"
                value={stats.downloadsTotal}
                note={`${stats.downloadsToday.toLocaleString()} today`}
                icon={UploadCloudIcon}
              />
              <SummaryStat
                label="Followers"
                value={stats.followerCount}
                note="Audience overview"
                icon={UsersIcon}
              />
            </section>

            <Group title="Broadcast">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CompactBroadcastTile
                  to="/studio/go-live"
                  icon={RadioIcon}
                  label="Go Live"
                  subtitle="Keys, signal, on-air"
                  color="var(--accent-red)"
                />
                <CompactBroadcastTile
                  to="/studio/schedule"
                  icon={CalendarIcon}
                  label="Schedule"
                  subtitle="Next show & programme"
                  color="var(--accent-blue)"
                />
              </div>
            </Group>
            <Group title="Recent broadcasts">
              {recentBroadcasts.length === 0 ? (
                <div className="border-border rounded-xl border px-4 py-4">
                  <p className="text-foreground-secondary text-sm">
                    No broadcasts yet.
                  </p>
                  <p className="text-foreground-secondary mt-1 text-xs">
                    Completed recordings will appear here.
                  </p>
                </div>
              ) : (
                <div className="border-border overflow-hidden rounded-xl border">
                  <ul>
                    {recentBroadcasts.slice(0, 3).map((broadcast) => (
                      <RecentBroadcastRow
                        key={broadcast.id}
                        broadcast={broadcast}
                      />
                    ))}
                  </ul>
                  <div className="border-border border-t px-4 py-3">
                    <Link
                      to="/studio/recordings"
                      className="text-foreground-secondary text-xs underline-offset-2 hover:underline"
                    >
                      View all recordings →
                    </Link>
                  </div>
                </div>
              )}
            </Group>
            {upcomingShows.length > 0 ? (
              <Group title="Upcoming shows">
                <ul className="border-border divide-border divide-y rounded-xl border">
                  {upcomingShows.map((show) => (
                    <li
                      key={show.id}
                      className="flex flex-wrap items-center gap-3 px-4 py-3"
                    >
                      <span className="bg-accent-blue/15 text-accent-blue flex size-10 shrink-0 items-center justify-center rounded-lg">
                        <CalendarIcon size={20} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">
                          {show.title}
                          {show.episodeNumber != null
                            ? ` · Episode ${show.episodeNumber}`
                            : ''}
                        </p>
                        <p className="text-foreground-secondary text-xs">
                          {new Date(show.startAt).toLocaleString([], {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                          {show.venue ? ` · ${show.venue}` : ''}
                        </p>
                      </div>
                      <Link
                        to="/studio/shows/$id"
                        params={{ id: show.seriesId }}
                      >
                        <Button size="sm" variant="secondary">
                          View &amp; edit
                        </Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Group>
            ) : null}
            <Group title="Governance">
              <div className="border-border bg-background-secondary/30 rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">Have your say</p>
                    <p className="text-foreground-secondary mt-1 text-xs">
                      Review open votes and follow discussions that are still
                      unresolved.
                    </p>
                  </div>
                  <Link
                    to="/studio/governance"
                    className="text-foreground-secondary text-xs underline-offset-2 hover:underline"
                  >
                    Open governance →
                  </Link>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-foreground-secondary mb-2 text-xs font-semibold tracking-wide uppercase">
                      Needs your opinion
                    </p>
                    {governanceVotes.length === 0 &&
                    unresolvedRequests.every((request) => request.youVoted) ? (
                      <p className="text-foreground-secondary text-sm">
                        Nothing waiting for your vote.
                      </p>
                    ) : (
                      <ul className="divide-border divide-y">
                        {[
                          ...governanceVotes.map((motion) => ({
                            id: `motion-${motion.id}`,
                            title: motion.title,
                            detail: 'Open motion',
                            to: '/studio/governance' as const,
                          })),
                          ...unresolvedRequests
                            .filter((request) => !request.youVoted)
                            .map((request) => ({
                              id: `request-${request.id}`,
                              title: request.title,
                              detail: 'Open topic',
                              to: '/governance/feature-requests' as const,
                            })),
                        ]
                          .slice(0, 4)
                          .map((item) => (
                            <li
                              key={item.id}
                              className="py-2 first:pt-0 last:pb-0"
                            >
                              <Link
                                to={item.to}
                                className="block hover:underline"
                              >
                                <span className="block truncate text-sm font-medium">
                                  {item.title}
                                </span>
                                <span className="text-foreground-secondary text-xs">
                                  {item.detail}
                                </span>
                              </Link>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="text-foreground-secondary mb-2 text-xs font-semibold tracking-wide uppercase">
                      Ongoing discussions
                    </p>
                    {discussionUpdates.length === 0 ? (
                      <p className="text-foreground-secondary text-sm">
                        No unresolved discussion updates.
                      </p>
                    ) : (
                      <ul className="divide-border divide-y">
                        {discussionUpdates.map((item) => (
                          <li
                            key={item.id}
                            className="py-2 first:pt-0 last:pb-0"
                          >
                            <Link
                              to={item.to}
                              className="block hover:underline"
                            >
                              <span className="block truncate text-sm font-medium">
                                {item.title}
                              </span>
                              <span className="text-foreground-secondary text-xs">
                                {item.detail}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </Group>
            <Group title="Music">
              <CardGrid>
                <StudioActionTile
                  to="/studio/shows"
                  icon={MicIcon}
                  label="Shows"
                  subtitle="Episodes & slots"
                  color="var(--accent-purple)"
                />
                <StudioActionTile
                  to="/studio/sounds"
                  icon={LibraryBigIcon}
                  label="Music"
                  subtitle={
                    counts.archive
                      ? `${counts.archive} items`
                      : 'Sounds & files'
                  }
                  color="var(--accent-orange)"
                />
                <StudioActionTile
                  to="/library/upload"
                  icon={UploadCloudIcon}
                  label="Upload"
                  subtitle="Add audio"
                  color="var(--accent-green)"
                />
                <StudioActionTile
                  to="/studio/collections"
                  icon={DiscAlbumIcon}
                  label="Collections"
                  subtitle={
                    counts.collections
                      ? `${counts.collections} collections`
                      : 'Albums, EPs, DJ sets & playlists'
                  }
                  color="var(--accent-yellow)"
                />
                <StudioActionTile
                  to="/studio/releases"
                  icon={RocketIcon}
                  label="Releases"
                  subtitle={
                    counts.releases
                      ? `${counts.releases} releases`
                      : 'Share releases'
                  }
                  color="var(--primary)"
                />
              </CardGrid>
            </Group>
            <Group title="Audience & channel">
              <CardGrid>
                <StudioActionTile
                  to="/studio/updates"
                  icon={NewspaperIcon}
                  label="Updates"
                  subtitle="Posts & newsletter"
                  color="var(--accent-blue)"
                />
                <StudioActionTile
                  to="/studio/stats"
                  icon={BarChart3Icon}
                  label="Stats"
                  subtitle="Plays & downloads"
                  color="var(--accent-cyan)"
                />
                <StudioActionTile
                  to="/studio/revenue"
                  icon={WalletIcon}
                  label="Revenue"
                  subtitle="Orders & grants"
                  color="var(--accent-green)"
                />
                {stripeConfigured ? (
                  <StudioActionTile
                    to="/studio/stripe"
                    icon={CreditCardIcon}
                    label="Stripe"
                    subtitle="Payout account"
                    color="var(--accent-yellow)"
                  />
                ) : null}
                <StudioActionTile
                  to="/studio/channel"
                  icon={LayoutTemplateIcon}
                  label="Channel look"
                  subtitle="Design & domain"
                  color="var(--accent-purple)"
                />
              </CardGrid>
            </Group>
          </>
        )}
      </div>
    </StudioGate>
  );
}
