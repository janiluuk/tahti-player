import type { FetchMeta } from '.././client';
import { isForceMock } from '.././mode';
import { requestJson } from '.././request-json';
import { failMeta } from './shared';

export type BandcampAlbum = {
  id: string;
  title: string;
  url: string;
  artistName?: string | null;
  type?: 'ALBUM' | 'EP' | 'SINGLE' | string;
  releaseDate?: string | null;
  coverUrl?: string | null;
  trackCount?: number;
};

export async function fetchBandcampAlbums(): Promise<{
  data: BandcampAlbum[];
  connected: boolean;
  message?: string;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [
        {
          id: 'bc-mock-1',
          title: 'Night Signals',
          url: 'https://mockartist.bandcamp.com/album/night-signals',
          artistName: 'Mock Artist',
          type: 'ALBUM',
          releaseDate: '2026-01-20',
          trackCount: 8,
        },
      ],
      connected: true,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{
      albums?: BandcampAlbum[];
      message?: string;
    }>('/api/me/bandcamp/albums');
    return {
      data: data.albums ?? [],
      connected: true,
      message: data.message,
      meta: { source: 'api' },
    };
  } catch (err) {
    return {
      data: [],
      connected: false,
      meta: failMeta(err),
    };
  }
}

export async function importBandcampAlbum(
  album: BandcampAlbum,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true, count: album.trackCount ?? 0 };
  }
  // Catalog honesty: GET /api/me/import-plugins marks bandcamp import:false —
  // there is no /api/v1/imports/bandcamp/add route until Bandcamp API v1 lands.
  void album;
  return {
    ok: false,
    error:
      'Bandcamp album import is not available yet (API catalog import:false).',
  };
}
