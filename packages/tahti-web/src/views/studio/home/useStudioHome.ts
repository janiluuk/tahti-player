import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  fetchRecentBroadcasts,
  type RecentBroadcast,
} from '../../../api/broadcast';
import {
  fetchFeatureRequests,
  fetchGovernanceMotions,
} from '../../../api/client';
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
import { useAuthStore } from '../../../stores/authStore';
import { useChannelSetupModalStore } from '../../../stores/channelSetupModalStore';
import { Counts, EMPTY_STATS } from './home-helpers';

/** Loads and derives every number/list shown on the Studio home dashboard. */
export function useStudioHome() {
  const user = useAuthStore((s) => s.user);
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
          // Only after a successful load: a failure must not look like an empty
          // discography.
          setDiscographyLoaded(true);
        },
      )
      // The dashboard still renders its tiles if a summary request fails.
      .catch(() => toast.error('Could not load your studio overview.'));
    Promise.all([fetchGovernanceMotions({ limit: 10 }), fetchFeatureRequests()])
      .then(([motionsResult, requestsResult]) => {
        if (!cancelled) {
          setGovernanceMotions(motionsResult.data);
          setGovernanceRequests(requestsResult.data);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
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
  };
}

export type StudioHomeState = ReturnType<typeof useStudioHome>;
