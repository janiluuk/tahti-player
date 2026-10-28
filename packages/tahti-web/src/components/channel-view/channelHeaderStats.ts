import { CirclePlayIcon, UsersIcon } from 'lucide-react';

import type { PublicChannel } from '../../api/types';
import type { EntitySocialStat } from '../EntitySocialHeader';

/** The channel header's stat row: followers (live count after a follow,
 * when known) and plays across the channel's public tracks. Zero or
 * missing values are left out. */
export function channelHeaderStats(
  channel: PublicChannel,
  liveFollowerCount: number | null | undefined,
): EntitySocialStat[] {
  const stats: EntitySocialStat[] = [];
  if (channel.followerCount != null && channel.followerCount > 0) {
    stats.push({
      key: 'followers',
      label: 'Followers',
      value: liveFollowerCount ?? channel.followerCount,
      icon: UsersIcon,
    });
  }
  if (channel.publicPlays != null && channel.publicPlays > 0) {
    stats.push({
      key: 'plays',
      label: 'Plays',
      value: channel.publicPlays,
      icon: CirclePlayIcon,
    });
  }
  return stats;
}
