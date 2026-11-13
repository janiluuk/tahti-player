import type { LucideIcon } from 'lucide-react';
import {
  CirclePlayIcon,
  DownloadIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react';

import type { PublicChannelMetrics } from '../../api/public-channel-metrics';
import type { PublicChannel } from '../../api/types';
import { entityStatLabel } from '../../lib/entityStatLabel';

export type ChannelPublicMetricKey =
  | 'followers'
  | 'following'
  | 'playsToday'
  | 'playsYesterday'
  | 'playsTotal'
  | 'downloads';

export type ChannelPublicMetricRow = {
  key: ChannelPublicMetricKey;
  value: number;
  label: string;
  icon: LucideIcon;
};

/** Rows for the channel metrics block — only values present on the channel
 * (API already omits hidden metrics). Zero is still shown when the key is on. */
export function buildChannelPublicMetricRows(
  channel: Pick<
    PublicChannel,
    'followerCount' | 'followingCount' | 'metrics' | 'publicPlays'
  >,
  labels: {
    playsToday: string;
    playsYesterday: string;
  },
): ChannelPublicMetricRow[] {
  const metrics: PublicChannelMetrics = {
    ...channel.metrics,
  };
  if (metrics.playsTotal == null && channel.publicPlays != null) {
    metrics.playsTotal = channel.publicPlays;
  }

  const rows: ChannelPublicMetricRow[] = [];
  if (channel.followerCount != null) {
    rows.push({
      key: 'followers',
      value: channel.followerCount,
      label: entityStatLabel('followers', channel.followerCount),
      icon: UsersIcon,
    });
  }
  if (channel.followingCount != null) {
    rows.push({
      key: 'following',
      value: channel.followingCount,
      label: entityStatLabel('following', channel.followingCount),
      icon: UserPlusIcon,
    });
  }
  if (metrics.playsToday != null) {
    rows.push({
      key: 'playsToday',
      value: metrics.playsToday,
      label: labels.playsToday,
      icon: CirclePlayIcon,
    });
  }
  if (metrics.playsYesterday != null) {
    rows.push({
      key: 'playsYesterday',
      value: metrics.playsYesterday,
      label: labels.playsYesterday,
      icon: CirclePlayIcon,
    });
  }
  if (metrics.playsTotal != null) {
    rows.push({
      key: 'playsTotal',
      value: metrics.playsTotal,
      label: entityStatLabel('plays', metrics.playsTotal),
      icon: CirclePlayIcon,
    });
  }
  if (metrics.downloads != null) {
    rows.push({
      key: 'downloads',
      value: metrics.downloads,
      label: entityStatLabel('downloads', metrics.downloads),
      icon: DownloadIcon,
    });
  }
  return rows;
}
