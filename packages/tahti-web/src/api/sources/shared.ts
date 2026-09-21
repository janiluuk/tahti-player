import type { FetchMeta } from '.././client';
import { type MockOauthId } from '.././mock-session';

export const HEARTHIS_IMPORT_BATCH_SIZE = 5;
export const SOUNDCLOUD_IMPORT_BATCH_SIZE = 20;

export const OAUTH_IDS = new Set<MockOauthId>([
  'bandcamp',
  'soundcloud',
  'google-drive',
  'mixcloud',
  'spotify',
  'musicbrainz',
]);

export function asOauthId(id: string): MockOauthId | null {
  return OAUTH_IDS.has(id as MockOauthId) ? (id as MockOauthId) : null;
}

export function failMeta(err: unknown): FetchMeta {
  return {
    source: 'mock',
    reason: err instanceof Error ? err.message : 'fetch failed',
  };
}
