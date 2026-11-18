import type { FetchMeta } from './client';
import { isForceMock } from './mode';
import { requestJson } from './request-json';

/** `true`/`false` once the artist has chosen, `null` while they haven't. */
export type MusicbrainzDefault = boolean | null;

let mockDefault: MusicbrainzDefault = null;

/** The remembered "offer MusicBrainz registration" choice
 * (`GET /api/me/musicbrainz/default`). */
export async function fetchMusicbrainzDefault(): Promise<{
  data: MusicbrainzDefault;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockDefault,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{
      defaultRegisterToMusicbrainz: MusicbrainzDefault;
    }>('/api/me/musicbrainz/default');
    return {
      data: data.defaultRegisterToMusicbrainz ?? null,
      meta: { source: 'api' },
    };
  } catch (err) {
    return {
      data: null,
      meta: {
        source: 'api',
        reason: err instanceof Error ? err.message : 'fetch failed',
      },
    };
  }
}

export async function saveMusicbrainzDefault(
  value: MusicbrainzDefault,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockDefault = value;
    return { ok: true };
  }
  try {
    await requestJson('/api/me/musicbrainz/default', {
      method: 'PATCH',
      body: JSON.stringify({ defaultRegisterToMusicbrainz: value }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not save',
    };
  }
}
