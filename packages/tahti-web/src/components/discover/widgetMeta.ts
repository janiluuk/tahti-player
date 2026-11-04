import {
  AwardIcon,
  ClockIcon,
  DicesIcon,
  Disc3Icon,
  FlameIcon,
  HeartIcon,
  ListMusicIcon,
  ShuffleIcon,
  SparklesIcon,
  StarIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  type CompassIcon,
} from 'lucide-react';

import type { ParseKeys } from '@tahti-player/i18n';

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

export const WIDGET_LABEL_KEYS: Record<DiscoverWidgetId, ParseKeys<'web'>> = {
  'this-week-most-played': 'discover.widgets.thisWeekMostPlayed',
  'this-week-least-played': 'discover.widgets.thisWeekLeastPlayed',
  'new-to-you': 'discover.widgets.newToYou',
  'latest-tracks': 'discover.widgets.latestTracks',
  'most-played': 'discover.widgets.mostPlayed',
  loved: 'discover.widgets.loved',
  'artist-of-the-week': 'discover.widgets.artistOfTheWeek',
  'random-artist': 'discover.widgets.randomArtist',
  'public-playlists': 'discover.widgets.publicPlaylists',
  'tahti-selects': 'discover.widgets.tahtiSelects',
  'latest-releases': 'discover.widgets.latestReleases',
  'random-track': 'discover.widgets.randomTrack',
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
};

export const TOP_LIST_WIDGET_IDS = new Set<DiscoverWidgetId>([
  'this-week-most-played',
  'this-week-least-played',
  'most-played',
]);
