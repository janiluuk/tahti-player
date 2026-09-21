import type { FetchMeta } from '.././client';
import { DEMO_MP3 } from '.././mock';
import { isForceMock } from '.././mode';
import { requestJson } from '.././request-json';
import type { TahtiPlayable } from '.././types';
import { failMeta } from './shared';

export type SpotifySearchTrack = {
  id: string;
  name: string;
  artists?: string[];
  album?: string;
  artworkUrl?: string | null;
  uri?: string;
  externalUrl?: string;
};

export async function searchSpotifyTracks(q: string): Promise<{
  data: SpotifySearchTrack[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [
        {
          id: 'sp-mock-1',
          name: q,
          artists: ['Various Artists'],
          externalUrl: 'https://open.spotify.com/track/mock',
        },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ tracks: SpotifySearchTrack[] }>(
      `/api/v1/imports/spotify/search?q=${encodeURIComponent(q)}`,
    );
    return { data: data.tracks ?? [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function importSpotifyTracks(
  tracks: Array<{ trackId: string; title: string; externalUrl?: string }>,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true, count: tracks.length };
  }
  try {
    const { data } = await requestJson<{ imported?: number }>(
      '/api/v1/imports/spotify/add',
      { method: 'POST', body: JSON.stringify({ tracks }) },
    );
    return { ok: true, count: data.imported ?? tracks.length };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Spotify import failed',
    };
  }
}

export function playableFromSpotify(t: SpotifySearchTrack): TahtiPlayable {
  return {
    id: `spotify:${t.id}`,
    kind: 'sound',
    title: t.name,
    artist: t.artists?.join(', ') || 'Spotify',
    coverUrl: t.artworkUrl ?? undefined,
    // Preview/stream may be unavailable — use demo in POC when no preview
    streamUrl: DEMO_MP3,
    protocol: 'https',
    sourceProvider: 'spotify',
  };
}
