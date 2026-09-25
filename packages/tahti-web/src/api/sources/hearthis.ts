import { playableFromHearthisEmbed } from '../../lib/embedPlayback';
import { useProcessingJobsStore } from '../../stores/processingJobsStore';
import type { FetchMeta } from '.././client';
import { isForceMock } from '.././mode';
import { requestJson } from '.././request-json';
import type { TahtiPlayable } from '.././types';
import { failMeta, HEARTHIS_IMPORT_BATCH_SIZE } from './shared';

export type HearthisTrack = {
  id: string;
  url: string;
  title: string;
  username: string;
  durationSec: number;
  kind?: string;
  coverUrl?: string | null;
  streamUrl?: string | null;
  /** Set only when the uploader offers the file for download. */
  download?: { url: string; fileName: string | null } | null;
};

export type HearthisCollection = {
  id: string;
  permalink: string;
  title: string;
  description: string;
  trackCount: number;
  coverUrl: string | null;
};

export type HearthisLibrary = {
  username: string | null;
  tracks: HearthisTrack[];
  sets: HearthisTrack[];
  collections: HearthisCollection[];
};

export type HearthisApiTrack = {
  id: string;
  title: string;
  type?: string;
  permalink_url: string;
  duration: string;
  artwork_url?: string | null;
  stream_url?: string | null;
  /** `'1'` when the uploader allows downloads. */
  downloadable?: string;
  download_url?: string | null;
  download_filename?: string | null;
  user: { username: string };
};

export type HearthisApiCollection = {
  id: string;
  permalink: string;
  title: string;
  description?: string;
  track_count?: number;
  artwork_url?: string | null;
};

export function hearthisApiTrack(track: HearthisApiTrack): HearthisTrack {
  return {
    id: track.id,
    url: track.permalink_url,
    title: track.title,
    username: track.user.username,
    durationSec: Number.parseInt(track.duration, 10) || 0,
    kind: track.type,
    coverUrl: track.artwork_url ?? null,
    streamUrl: track.stream_url ?? null,
    download:
      track.downloadable === '1' && track.download_url
        ? { url: track.download_url, fileName: track.download_filename ?? null }
        : null,
  };
}

/**
 * The set permalink from a pasted hearthis.at set link
 * (`https://hearthis.at/set/380208-9827046/`) or a bare permalink.
 */
export function parseHearthisSetPermalink(input: string): string | null {
  const value = input.trim();
  if (!value) {
    return null;
  }
  const link = value.match(
    /^(?:https?:\/\/)?(?:www\.)?hearthis\.at\/set\/([^/?#\s]+)\/?(?:[?#].*)?$/i,
  );
  if (link) {
    return decodeURIComponent(link[1]!);
  }
  return /^[\w-]+$/.test(value) ? value : null;
}

export async function fetchHearthisPublic<T>(path: string): Promise<T> {
  const response = await fetch(`https://api-v2.hearthis.at${path}`);
  if (!response.ok) {
    throw new Error(`hearthis.at → ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchHearthisLibrary(): Promise<{
  data: HearthisLibrary;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    const track: HearthisTrack = {
      id: 'ht-mock-1',
      url: 'https://hearthis.at/mockartist/deep-space-transmission/',
      title: 'Deep Space Transmission',
      username: 'mockartist',
      durationSec: 214,
      kind: 'Track',
      coverUrl: null,
      streamUrl: null,
    };
    return {
      data: {
        username: 'mockartist',
        tracks: [track],
        sets: [
          {
            ...track,
            id: 'ht-mock-set',
            title: 'Live at Kaiku',
            kind: 'DJ-Set',
          },
        ],
        collections: [
          {
            id: 'ht-mock-collection',
            permalink: 'ht-mock-collection',
            title: 'Recorded sets',
            description: 'Mock hearthis.at collection',
            trackCount: 2,
            coverUrl: null,
          },
        ],
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{
      username: string | null;
      tracks: HearthisTrack[];
    }>('/api/v1/imports/hearthis/me-tracks');
    if (!data.username) {
      return {
        data: { username: null, tracks: [], sets: [], collections: [] },
        meta: { source: 'api' },
      };
    }
    const username = encodeURIComponent(data.username);
    const [rawTracks, rawCollections] = await Promise.all([
      fetchHearthisPublic<HearthisApiTrack[]>(
        `/${username}/?type=tracks&count=100`,
      ),
      fetchHearthisPublic<HearthisApiCollection[]>(
        `/${username}/?type=playlists&count=100`,
      ),
    ]);
    const tracks = rawTracks.map(hearthisApiTrack);
    return {
      data: {
        username: data.username,
        tracks: tracks.filter(
          (track) => track.kind?.toLowerCase() !== 'dj-set',
        ),
        sets: tracks.filter((track) => track.kind?.toLowerCase() === 'dj-set'),
        collections: rawCollections.map((collection) => ({
          id: collection.id,
          permalink: collection.permalink,
          title: collection.title,
          description: collection.description ?? '',
          trackCount: collection.track_count ?? 0,
          coverUrl: collection.artwork_url ?? null,
        })),
      },
      meta: { source: 'api' },
    };
  } catch (err) {
    return {
      data: { username: null, tracks: [], sets: [], collections: [] },
      meta: failMeta(err),
    };
  }
}

export async function fetchHearthisCollectionTracks(
  permalink: string,
): Promise<HearthisTrack[]> {
  if (isForceMock()) {
    const [set] = (await fetchHearthisLibrary()).data.sets;
    return [1, 2, 3, 4].map((n) => ({
      ...set!,
      id: `ht-mock-set-${n}`,
      title: `Live at Kaiku, part ${n}`,
      durationSec: 1800 + n * 60,
      download:
        n === 3
          ? null
          : {
              url: `https://hearthis.at/mockartist/live-at-kaiku-${n}/download/`,
              fileName: `Live at Kaiku ${n}.mp3`,
            },
    }));
  }
  const tracks = await fetchHearthisPublic<HearthisApiTrack[]>(
    `/set/${encodeURIComponent(permalink)}/?type=tracks&count=500`,
  );
  return tracks.map(hearthisApiTrack);
}

export async function importHearthisTracks(
  collectionId: string,
  tracks: HearthisTrack[],
): Promise<{
  imported: number;
  failed: number;
  artworkFailed: number;
  items: Array<{ trackId: string; soundId: string }>;
}> {
  if (isForceMock()) {
    return {
      imported: tracks.length,
      failed: 0,
      artworkFailed: 0,
      items: tracks.map((track) => ({
        trackId: track.id,
        soundId: `hearthis-${track.id}`,
      })),
    };
  }
  const results: PromiseSettledResult<{
    artworkFailed: boolean;
    trackId: string;
    soundId: string;
  }>[] = [];
  for (
    let index = 0;
    index < tracks.length;
    index += HEARTHIS_IMPORT_BATCH_SIZE
  ) {
    const batch = tracks.slice(index, index + HEARTHIS_IMPORT_BATCH_SIZE);
    results.push(
      ...(await Promise.allSettled(
        batch.map((track) =>
          requestJson<{
            soundId: string;
            track: { coverUrl?: string | null };
          }>('/api/v1/imports/hearthis/add', {
            method: 'POST',
            body: JSON.stringify({ collectionId, trackUrl: track.url }),
          }).then(async ({ data }) => {
            const coverUrl = data.track.coverUrl ?? track.coverUrl;
            if (!coverUrl) {
              return {
                artworkFailed: false,
                trackId: track.id,
                soundId: data.soundId,
              };
            }
            try {
              await requestJson(
                `/api/me/sound/${encodeURIComponent(data.soundId)}/banner/from-url`,
                {
                  method: 'POST',
                  body: JSON.stringify({ sourceUrl: coverUrl }),
                },
              );
              return {
                artworkFailed: false,
                trackId: track.id,
                soundId: data.soundId,
              };
            } catch {
              return {
                artworkFailed: true,
                trackId: track.id,
                soundId: data.soundId,
              };
            }
          }),
        ),
      )),
    );
  }
  const imported = results.filter(
    (result) => result.status === 'fulfilled',
  ).length;
  const artworkFailed = results.filter(
    (result) => result.status === 'fulfilled' && result.value.artworkFailed,
  ).length;
  const items = results.flatMap((result) =>
    result.status === 'fulfilled'
      ? [
          {
            trackId: result.value.trackId,
            soundId: result.value.soundId,
          },
        ]
      : [],
  );
  useProcessingJobsStore.getState().start(
    items.map((item) => ({
      id: item.soundId,
      title:
        tracks.find((track) => track.id === item.trackId)?.title ??
        'HearThis track',
      status: 'PENDING' as const,
    })),
  );
  return {
    imported,
    failed: results.length - imported,
    artworkFailed,
    items,
  };
}

/** Backed by the same public read API the main Tahti app's collection
 * editor uses (apps/api /api/v1/imports/hearthis/search) — embed-only,
 * Tahti never fetches or re-hosts the audio. */
export async function searchHearthisTracks(q: string): Promise<{
  data: HearthisTrack[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [
        {
          id: 'ht-mock-1',
          url: 'https://hearthis.at/mockartist/deep-space-transmission/',
          title: q ? `${q} (hearthis.at)` : 'Deep Space Transmission',
          username: 'mockartist',
          durationSec: 214,
          coverUrl: null,
          streamUrl: null,
        },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ tracks: HearthisTrack[] }>(
      `/api/v1/imports/hearthis/search?q=${encodeURIComponent(q)}`,
    );
    return { data: data.tracks ?? [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function fetchHearthisTrackById(
  id: string,
): Promise<HearthisTrack | null> {
  const result = await searchHearthisTracks(id);
  return result.data.find((track) => track.id === id) ?? result.data[0] ?? null;
}

export function playableFromHearthis(t: HearthisTrack): TahtiPlayable {
  return playableFromHearthisEmbed({
    playerId: `hearthis:${t.id}`,
    title: t.title,
    artist: t.username || 'hearthis.at',
    coverUrl: t.coverUrl ?? undefined,
    embedUri: t.id,
    durationSec: t.durationSec,
  });
}
