import { useEffect, useRef, useState } from 'react';

import {
  fetchRecentBroadcasts,
  type RecentBroadcast,
} from '../../../api/broadcast';
import {
  fetchFeatureRequests,
  fetchGovernanceMotions,
} from '../../../api/client';
import type { FetchMeta } from '../../../api/mode';
import { fetchShowSchedule, type ScheduledShow } from '../../../api/shows';
import {
  fetchStudioCollectionCount,
  fetchStudioReleases,
  fetchStudioSoundCount,
} from '../../../api/studio';
import {
  fetchStatsSummary,
  type StatsSummary,
} from '../../../api/studio-extras';
import type { FeatureRequest, GovernanceMotion } from '../../../api/types';
import { hasStudioAccess } from '../../../lib/accountRoles';
import { useAuthStore } from '../../../stores/authStore';
import { useChannelSetupModalStore } from '../../../stores/channelSetupModalStore';
import { Counts, EMPTY_STATS } from './home-helpers';

function apiErrorReason(meta: FetchMeta): string | null {
  return meta.source === 'api' ? (meta.reason ?? null) : null;
}

/** Loads and derives every number/list shown on the Studio home dashboard. */
export function useStudioHome() {
  const user = useAuthStore((s) => s.user);
  const profileLoaded = useAuthStore((s) => s.profileLoaded);
  const openChannelSetup = useChannelSetupModalStore((s) => s.open);
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
  const [broadcastsError, setBroadcastsError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [governanceError, setGovernanceError] = useState<string | null>(null);
  const [overviewAttempt, setOverviewAttempt] = useState(0);
  const [governanceAttempt, setGovernanceAttempt] = useState(0);
  const autoPromptedChannelSetup = useRef(false);

  useEffect(() => {
    if (
      !user ||
      !profileLoaded ||
      user.channel ||
      !hasStudioAccess(user) ||
      autoPromptedChannelSetup.current
    ) {
      return;
    }
    autoPromptedChannelSetup.current = true;
    openChannelSetup();
  }, [openChannelSetup, profileLoaded, user]);

  useEffect(() => {
    if (!user?.channel) {
      return;
    }
    let cancelled = false;
    Promise.all([
      fetchStudioSoundCount(),
      fetchStudioCollectionCount(),
      fetchStudioReleases(),
      fetchStatsSummary(),
      fetchShowSchedule(),
      fetchRecentBroadcasts(5),
    ])
      .then(
        ([
          soundCount,
          collectionCount,
          releases,
          summary,
          showSchedule,
          broadcasts,
        ]) => {
          if (cancelled) {
            return;
          }
          setCounts({
            sounds: soundCount.data,
            collections: collectionCount.data,
            releases: releases.data.total,
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
          setStatsError(apiErrorReason(summary.meta));
          setScheduleError(apiErrorReason(showSchedule.meta));
          setBroadcastsError(apiErrorReason(broadcasts.meta));
          setDiscographyLoaded(
            !apiErrorReason(soundCount.meta) &&
              !apiErrorReason(collectionCount.meta) &&
              !apiErrorReason(releases.meta),
          );
        },
      )
      .catch(() => {
        if (cancelled) {
          return;
        }
        const message = 'Could not load your studio overview.';
        setStatsError(message);
        setScheduleError(message);
        setBroadcastsError(message);
        setDiscographyLoaded(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.channel, overviewAttempt]);

  useEffect(() => {
    if (!user?.channel) {
      return;
    }
    let cancelled = false;
    Promise.all([fetchGovernanceMotions({ limit: 10 }), fetchFeatureRequests()])
      .then(([motionsResult, requestsResult]) => {
        if (cancelled) {
          return;
        }
        setGovernanceMotions(motionsResult.data);
        setGovernanceRequests(requestsResult.data);
        setGovernanceError(
          apiErrorReason(motionsResult.meta) ??
            apiErrorReason(requestsResult.meta),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setGovernanceError('Could not load governance.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user?.channel, governanceAttempt]);

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

  return {
    user,
    openChannelSetup,
    counts,
    stats,
    upcomingShows,
    recentBroadcasts,
    channel,
    hasEmptyDiscography,
    governanceVotes,
    unresolvedRequests,
    discussionUpdates,
    broadcastsError,
    scheduleError,
    statsError,
    governanceError,
    reloadOverview: () => setOverviewAttempt((attempt) => attempt + 1),
    reloadGovernance: () => setGovernanceAttempt((attempt) => attempt + 1),
  };
}

export type StudioHomeState = ReturnType<typeof useStudioHome>;
