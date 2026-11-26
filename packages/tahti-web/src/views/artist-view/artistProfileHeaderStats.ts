import {
  CirclePlayIcon,
  DownloadIcon,
  HeartIcon,
  ListMusicIcon,
  MusicIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react';

import type { PublicProfile } from '../../api/types';
import { type EntitySocialStat } from '../../components/EntitySocialHeader';
import { entityStatLabel, type EntityStatKey } from '../../lib/entityStatLabel';

/** Social stats in the artist page header; zero and missing counts are left
 * out. */
export function artistProfileHeaderStats({
  profile,
  followerCount,
  onFollowers,
  onFollowing,
}: {
  profile: PublicProfile;
  followerCount: number | null;
  onFollowers: () => void;
  onFollowing: () => void;
}): EntitySocialStat[] {
  const { artist, collections } = profile;
  const stat = (
    key: EntityStatKey,
    value: number | null | undefined,
    icon: EntitySocialStat['icon'],
    onClick?: () => void,
  ): EntitySocialStat[] =>
    value != null && value > 0
      ? [{ key, label: entityStatLabel(key, value), value, icon, onClick }]
      : [];
  return [
    ...stat(
      'followers',
      artist.followerCount != null
        ? (followerCount ?? artist.followerCount)
        : null,
      UsersIcon,
      onFollowers,
    ),
    ...stat('following', artist.followingCount, UserPlusIcon, onFollowing),
    ...stat('tracks', profile.tracks.length, MusicIcon),
    ...stat('plays', profile.totals?.plays, CirclePlayIcon),
    ...stat('likes', profile.totals?.likes, HeartIcon),
    ...stat('downloads', profile.totals?.downloads, DownloadIcon),
    ...stat('playlists', collections.length, ListMusicIcon),
  ];
}
