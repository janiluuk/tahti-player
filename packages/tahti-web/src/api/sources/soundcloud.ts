import type { FetchMeta } from '.././client';
import { DEMO_MP3 } from '.././mock';
import { isForceMock } from '.././mode';
import { requestJson } from '.././request-json';
import type { TahtiPlayable } from '.././types';
import { failMeta, SOUNDCLOUD_IMPORT_BATCH_SIZE } from './shared';

export type SoundcloudTrack = {
  id: string;
  title: string;
  durationMs?: number;
  artworkUrl?: string | null;
  downloadable?: boolean;
};

export async function fetchSoundcloudTracks(): Promise<{
  data: SoundcloudTrack[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [
        {
          id: 'sc-1',
          title: 'Mock SoundCloud track',
          durationMs: 240000,
          downloadable: true,
        },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ tracks: SoundcloudTrack[] }>(
      '/api/me/soundcloud/tracks',
    );
    return { data: data.tracks ?? [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function importSoundcloudTracks(
  tracks: Array<{ trackId: string; title: string }>,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true, count: tracks.length };
  }
  try {
    let importedCount = 0;
    for (
      let start = 0;
      start < tracks.length;
      start += SOUNDCLOUD_IMPORT_BATCH_SIZE
    ) {
      const batch = tracks.slice(start, start + SOUNDCLOUD_IMPORT_BATCH_SIZE);
      await requestJson('/api/me/soundcloud/import', {
        method: 'POST',
        body: JSON.stringify({ tracks: batch }),
      });
      importedCount += batch.length;
    }
    return { ok: true, count: importedCount };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Import failed',
    };
  }
}

export function playableFromSoundcloud(t: SoundcloudTrack): TahtiPlayable {
  return {
    id: `soundcloud:${t.id}`,
    kind: 'sound',
    title: t.title,
    artist: 'SoundCloud',
    coverUrl: t.artworkUrl ?? undefined,
    streamUrl: DEMO_MP3,
    protocol: 'https',
    sourceProvider: 'soundcloud',
  };
}

/** One of the connected user's SoundCloud playlists/sets. */
export type SoundcloudPlaylist = {
  id: string;
  title: string;
  trackCount: number;
  artworkUrl: string | null;
  permalinkUrl: string | null;
};

/**
 * A set entry. `download` is set only for tracks SoundCloud offers for
 * download; its `url` is a signed Tahti link that stops working at
 * `expiresAt`, after which the set has to be loaded again.
 */
export type SoundcloudPlaylistTrack = {
  id: string;
  title: string;
  username: string;
  durationSec: number;
  artworkUrl: string | null;
  permalinkUrl: string | null;
  download: { url: string; expiresAt: string } | null;
};

const MOCK_PLAYLIST: SoundcloudPlaylist = {
  id: '101',
  title: 'Mock SoundCloud set',
  trackCount: 3,
  artworkUrl: null,
  permalinkUrl: 'https://soundcloud.com/mock/sets/mock-set',
};

export async function fetchSoundcloudPlaylists(): Promise<
  SoundcloudPlaylist[]
> {
  if (isForceMock()) {
    return [MOCK_PLAYLIST];
  }
  const { data } = await requestJson<{ playlists: SoundcloudPlaylist[] }>(
    '/api/me/soundcloud/playlists',
  );
  return data.playlists ?? [];
}

export async function fetchSoundcloudPlaylistTracks(
  playlistId: string,
): Promise<SoundcloudPlaylistTrack[]> {
  if (isForceMock()) {
    const expiresAt = new Date(Date.now() + 12 * 3600_000).toISOString();
    return [1, 2, 3].map((n) => ({
      id: `sc-mock-${n}`,
      title: `Mock SoundCloud track ${n}`,
      username: 'mock',
      durationSec: 300 + n * 30,
      artworkUrl: null,
      permalinkUrl: null,
      download: n === 2 ? null : { url: DEMO_MP3, expiresAt },
    }));
  }
  const { data } = await requestJson<{ tracks: SoundcloudPlaylistTrack[] }>(
    `/api/me/soundcloud/playlists/${encodeURIComponent(playlistId)}/tracks`,
  );
  return data.tracks ?? [];
}

/** True for an https `soundcloud.com` (or `on.soundcloud.com`) link. */
export function isSoundcloudLink(input: string): boolean {
  try {
    const url = new URL(input.trim());
    return (
      url.protocol === 'https:' &&
      /^(?:(?:www|m|on)\.)?soundcloud\.com$/i.test(url.hostname)
    );
  } catch {
    return false;
  }
}

/** Resolves a pasted SoundCloud set link through the Tahti API. */
export async function resolveSoundcloudPlaylist(
  link: string,
): Promise<SoundcloudPlaylist> {
  if (isForceMock()) {
    return MOCK_PLAYLIST;
  }
  const { data } = await requestJson<{ playlist: SoundcloudPlaylist }>(
    `/api/me/soundcloud/resolve?url=${encodeURIComponent(link.trim())}`,
  );
  return data.playlist;
}
