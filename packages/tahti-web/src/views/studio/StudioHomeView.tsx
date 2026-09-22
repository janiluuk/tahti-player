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
  PlusIcon,
  RadioIcon,
  RocketIcon,
  UploadCloudIcon,
  UsersIcon,
  WalletIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  Badge,
  Button,
  CardGrid,
  EmptyState,
  ViewShell,
} from '@tahti-player/ui';

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
import { useStripeConfigured } from '../../hooks/useStripeConfigured';
import { accountRoleLabel, getAccountRole } from '../../lib/accountRoles';
import { useAuthStore } from '../../stores/authStore';
import { useChannelSetupModalStore } from '../../stores/channelSetupModalStore';
import { Counts, EMPTY_STATS } from './home/home-helpers';
import {
  CompactBroadcastTile,
  Group,
  StudioActionTile,
  SummaryStat,
} from './home/HomeTiles';
import { RecentBroadcastRow } from './home/RecentBroadcastRow';

export function StudioHomeView() {
  const user = useAuthStore((s) => s.user);
  const openChannelSetup = useChannelSetupModalStore((s) => s.open);
  const stripeConfigured = useStripeConfigured();
  const [counts, setCounts] = useState<Counts>({
    sounds: 0,
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
  const [discographyLoaded, setDiscographyLoaded] = useState(false);
  const autoPromptedChannelSetup = useRef(false);

  useEffect(() => {
    if (!user || user.channel || autoPromptedChannelSetup.current) {
      return;
    }
    autoPromptedChannelSetup.current = true;
    openChannelSetup();
  }, [openChannelSetup, user]);

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
      ([sounds, collections, releases, summary, showSchedule, broadcasts]) => {
        setCounts({
          sounds: sounds.data.length,
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
        setDiscographyLoaded(true);
      },
    );
    void Promise.all([
      fetchGovernanceMotions({ limit: 10 }),
      fetchFeatureRequests(),
    ]).then(([motionsResult, requestsResult]) => {
      setGovernanceMotions(motionsResult.data);
      setGovernanceRequests(requestsResult.data);
    });
  }, [user?.channel]);

  const channel = user?.channel;
  const hasEmptyDiscography =
    discographyLoaded && counts.sounds === 0 && counts.releases === 0;
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

        <ViewShell title="Studio" classes={{ root: 'px-0 pt-0' }}>
          {user ? (
            <div
              aria-label="Account status"
              className="mb-4 flex flex-wrap items-center gap-2"
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
          ) : null}
          {!channel ? (
            <p className="text-foreground-secondary text-sm">
              <button
                type="button"
                onClick={openChannelSetup}
                className="text-foreground underline-offset-2 hover:underline"
              >
                Create your channel
              </button>{' '}
              to unlock Music and Broadcast.
            </p>
          ) : null}

          {!channel ? null : (
            <div className="flex flex-col gap-8">
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

              {hasEmptyDiscography ? (
                <div className="border-border bg-background-secondary/30 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
                  <div>
                    <p className="text-sm font-bold">
                      Nothing in your discography yet
                    </p>
                    <p className="text-foreground-secondary mt-1 text-xs">
                      Add an album or a track to start building it out.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to="/studio/releases" search={{ create: true }}>
                      <Button size="sm" variant="secondary">
                        <PlusIcon size={14} aria-hidden className="mr-1.5" />
                        Add an album
                      </Button>
                    </Link>
                    <Link to="/library/upload">
                      <Button size="sm">
                        <PlusIcon size={14} aria-hidden className="mr-1.5" />
                        Add a track
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : null}

              <Group title="Broadcast">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <CompactBroadcastTile
                    to="/studio/go-live"
                    icon={RadioIcon}
                    label="Broadcast"
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
                  <EmptyState
                    size="sm"
                    className="border-border rounded-xl border"
                    title="No broadcasts yet"
                    description="Completed recordings will appear here."
                  />
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
                        to="/library/recordings"
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
                      unresolvedRequests.every(
                        (request) => request.youVoted,
                      ) ? (
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
                      counts.sounds
                        ? `${counts.sounds} items`
                        : 'Tracks & files'
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
                    to="/studio/audience"
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
            </div>
          )}
        </ViewShell>
      </div>
    </StudioGate>
  );
}
