import type { FeedItem } from '../api/types';

const RELEASE_PHRASES: Record<string, string> = {
  SINGLE: 'a single',
  EP: 'an EP',
  ALBUM: 'an album',
  COMPILATION: 'a compilation',
  REMIX: 'a remix',
};

/** What the artist did, shown after their name on a feed card. */
export function feedBadge(item: FeedItem): string {
  if (item.kind === 'post') {
    return 'posted';
  }
  if (item.kind === 'track') {
    return 'shared a track';
  }
  return `released ${RELEASE_PHRASES[item.releaseType] ?? 'new music'}`;
}
