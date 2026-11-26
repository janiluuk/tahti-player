import {
  AwardIcon,
  CalendarDaysIcon,
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
  'upcoming-events': 'discover.widgets.upcomingEvents',
};

/** What each widget shows, for the Add widget menu. */
export const WIDGET_MENU: Record<
  DiscoverWidgetId,
  { icon: typeof CompassIcon; descriptionKey: ParseKeys<'web'> }
> = {
  'this-week-most-played': {
    icon: TrendingUpIcon,
    descriptionKey: 'discover.widgetDescriptions.thisWeekMostPlayed',
  },
  'this-week-least-played': {
    icon: TrendingDownIcon,
    descriptionKey: 'discover.widgetDescriptions.thisWeekLeastPlayed',
  },
  'new-to-you': {
    icon: SparklesIcon,
    descriptionKey: 'discover.widgetDescriptions.newToYou',
  },
  'latest-tracks': {
    icon: ClockIcon,
    descriptionKey: 'discover.widgetDescriptions.latestTracks',
  },
  'most-played': {
    icon: FlameIcon,
    descriptionKey: 'discover.widgetDescriptions.mostPlayed',
  },
  loved: {
    icon: HeartIcon,
    descriptionKey: 'discover.widgetDescriptions.loved',
  },
  'artist-of-the-week': {
    icon: StarIcon,
    descriptionKey: 'discover.widgetDescriptions.artistOfTheWeek',
  },
  'random-artist': {
    icon: ShuffleIcon,
    descriptionKey: 'discover.widgetDescriptions.randomArtist',
  },
  'public-playlists': {
    icon: ListMusicIcon,
    descriptionKey: 'discover.widgetDescriptions.publicPlaylists',
  },
  'tahti-selects': {
    icon: AwardIcon,
    descriptionKey: 'discover.widgetDescriptions.tahtiSelects',
  },
  'latest-releases': {
    icon: Disc3Icon,
    descriptionKey: 'discover.widgetDescriptions.latestReleases',
  },
  'random-track': {
    icon: DicesIcon,
    descriptionKey: 'discover.widgetDescriptions.randomTrack',
  },
  'upcoming-events': {
    icon: CalendarDaysIcon,
    descriptionKey: 'discover.widgetDescriptions.upcomingEvents',
  },
};

export const TOP_LIST_WIDGET_IDS = new Set<DiscoverWidgetId>([
  'this-week-most-played',
  'this-week-least-played',
  'most-played',
]);
