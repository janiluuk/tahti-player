import {
  AwardIcon,
  ClockIcon,
  DicesIcon,
  Disc3Icon,
  FlameIcon,
  HeartIcon,
  ListMusicIcon,
  NewspaperIcon,
  ShuffleIcon,
  SparklesIcon,
  StarIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  type CompassIcon,
} from 'lucide-react';

import type { DiscoverTrackItem } from '../../api/types';
import type { DiscoverWidgetId } from '../../stores/discoverStore';

export function pickRandomTrack(
  pool: DiscoverTrackItem[],
  excludeId: string | null,
): DiscoverTrackItem[] {
  const candidates =
    pool.length > 1 ? pool.filter((item) => item.id !== excludeId) : pool;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return pick ? [pick] : [];
}

export const WIDGET_LABELS: Record<DiscoverWidgetId, string> = {
  'this-week-most-played': 'This week: most played',
  'this-week-least-played': 'This week: least played',
  'new-to-you': 'New to you',
  'latest-tracks': 'Latest tracks',
  'most-played': 'Most played',
  loved: 'Loved by the community',
  'artist-of-the-week': 'Random artist of the week',
  'random-artist': 'Random artist pick',
  'public-playlists': 'Public playlists',
  'tahti-selects': 'Tahti Selects',
  'latest-releases': 'Latest releases',
  'random-track': 'Random track',
  'community-stories': 'Community stories',
};

/** What each widget shows, for the Add a widget menu. */
export const WIDGET_MENU: Record<
  DiscoverWidgetId,
  { icon: typeof CompassIcon; description: string }
> = {
  'this-week-most-played': {
    icon: TrendingUpIcon,
    description: 'The week’s most played tracks',
  },
  'this-week-least-played': {
    icon: TrendingDownIcon,
    description: 'Overlooked tracks from this week',
  },
  'new-to-you': {
    icon: SparklesIcon,
    description: 'Tracks you have not played yet',
  },
  'latest-tracks': { icon: ClockIcon, description: 'Fresh uploads' },
  'most-played': { icon: FlameIcon, description: 'All-time favourites' },
  loved: { icon: HeartIcon, description: 'What listeners love most' },
  'artist-of-the-week': {
    icon: StarIcon,
    description: 'One artist in the spotlight',
  },
  'random-artist': { icon: ShuffleIcon, description: 'Meet someone new' },
  'public-playlists': {
    icon: ListMusicIcon,
    description: 'Playlists shared by listeners',
  },
  'tahti-selects': { icon: AwardIcon, description: 'Hand-picked by Tahti' },
  'latest-releases': { icon: Disc3Icon, description: 'New albums and EPs' },
  'random-track': {
    icon: DicesIcon,
    description: 'One track at random from the genres you pick',
  },
  'community-stories': {
    icon: NewspaperIcon,
    description: 'The newest posts from artists across Tahti',
  },
};

export const TOP_LIST_WIDGET_IDS = new Set<DiscoverWidgetId>([
  'this-week-most-played',
  'this-week-least-played',
  'most-played',
]);
