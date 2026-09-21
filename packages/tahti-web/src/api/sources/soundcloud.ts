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
