import { playableFromHearthisEmbed } from '../lib/embedPlayback';
import { useProcessingJobsStore } from '../stores/processingJobsStore';
import type { FetchMeta } from './client';
import { DEMO_MP3 } from './mock';
import {
  isMockOauthConnected,
  setMockOauthConnected,
  type MockOauthId,
} from './mock-session';
import type { TahtiPlayable } from './types';

const forceMock = () => import.meta.env.VITE_FORCE_MOCK === '1';
const HEARTHIS_IMPORT_BATCH_SIZE = 5;
const SOUNDCLOUD_IMPORT_BATCH_SIZE = 20;

const OAUTH_IDS = new Set<MockOauthId>([
  'bandcamp',
  'soundcloud',
  'google-drive',
  'mixcloud',
  'spotify',
  'musicbrainz',
]);

function asOauthId(id: string): MockOauthId | null {
  return OAUTH_IDS.has(id as MockOauthId) ? (id as MockOauthId) : null;
}

const apiBase = () => {
  if (import.meta.env.VITE_TAHTI_API_URL?.startsWith('http')) {
    return import.meta.env.VITE_TAHTI_API_URL.replace(/\/$/, '');
  }
  return '/tahti-api';
};

function failMeta(err: unknown): FetchMeta {
  return {
    source: 'mock',
    reason: err instanceof Error ? err.message : 'fetch failed',
  };
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; status: number }> {
  const { headers: initHeaders, ...rest } = init ?? {};
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...initHeaders,
    },
  });
  if (!res.ok) {
    let detail = `${path} → ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      if (body.error || body.message) {
        detail = body.error ?? body.message ?? detail;
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  if (res.status === 204) {
    return { data: undefined as T, status: res.status };
  }
  return { data: (await res.json()) as T, status: res.status };
}

export type IntegrationId =
  | 'upload'
  | 'stash'
  | 'bandcamp'
  | 'soundcloud'
  | 'google-drive'
  | 'mixcloud'
  | 'url'
  | 'spotify'
  | 'hearthis'
  | 'broadcast'
  | 'radio'
  | 'musicbrainz';

export type ConnectionStatus = {
  connected: boolean;
  configured: boolean;
  /** Only set by providers that expose a display name once connected
   * (e.g. musicbrainz's connected editor username). */
  username?: string | null;
};

export type SourceDef = {
  id: IntegrationId;
  name: string;
  description: string;
  /** OAuth start path under API, or null if not OAuth */
  oauthStartPath: string | null;
  studioDeepLink?: string;
  kind: 'oauth' | 'upload' | 'search' | 'tool';
  capabilities: SourceCapabilities;
};

export type SourceCapabilities = {
  connect: boolean;
  search: boolean;
  import: boolean;
  playback: boolean;
};

export const SOURCE_DEFS: SourceDef[] = [
  {
    id: 'upload',
    name: 'Local upload',
    description:
      'Upload audio files into your archive (prepare → MinIO → complete).',
    oauthStartPath: null,
    studioDeepLink: '/library/upload',
    kind: 'upload',
    capabilities: {
      connect: false,
      search: false,
      import: true,
      playback: true,
    },
  },
  {
    id: 'stash',
    name: 'Stash',
    description:
      'Private file locker — upload stems/masters without publishing to the channel.',
    oauthStartPath: null,
    kind: 'upload',
    capabilities: {
      connect: false,
      search: false,
      import: true,
      playback: false,
    },
  },
  {
    id: 'bandcamp',
    name: 'Bandcamp',
    description: 'Connect Bandcamp and import albums into your catalog.',
    oauthStartPath: '/api/me/bandcamp/oauth/start',
    kind: 'oauth',
    capabilities: {
      connect: true,
      search: false,
      import: true,
      playback: true,
    },
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    description:
      'OAuth connect, list downloadable tracks, queue server-side import to archive.',
    oauthStartPath: '/api/me/soundcloud/oauth/start',
    kind: 'oauth',
    capabilities: {
      connect: true,
      search: false,
      import: true,
      playback: false,
    },
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Connect Drive and import audio files via cloud-import jobs.',
    oauthStartPath: '/api/me/google-drive/oauth/start',
    kind: 'oauth',
    capabilities: {
      connect: true,
      search: false,
      import: true,
      playback: false,
    },
  },
  {
    id: 'mixcloud',
    name: 'Mixcloud',
    description:
      'Connect Mixcloud for rescue/upload of mixes to/from your archive.',
    oauthStartPath: '/api/me/mixcloud/oauth/start',
    kind: 'oauth',
    capabilities: {
      connect: true,
      search: false,
      import: true,
      playback: false,
    },
  },
  {
    id: 'url',
    name: 'URL / DSP paste',
    description:
      'Paste Spotify/Bandcamp/etc. URLs to seed smart-link targets on a release.',
    oauthStartPath: null,
    studioDeepLink: '/studio/releases',
    kind: 'tool',
    capabilities: {
      connect: false,
      search: false,
      import: false,
      playback: false,
    },
  },
  {
    id: 'spotify',
    name: 'Spotify search',
    description:
      'Search Spotify tracks (app token) to add into mixed-source collections.',
    oauthStartPath: null,
    kind: 'search',
    capabilities: {
      connect: false,
      search: true,
      import: true,
      playback: true,
    },
  },
  {
    id: 'hearthis',
    name: 'hearthis.at',
    description:
      "Search hearthis.at's public catalogue and queue tracks as provider-hosted embeds.",
    oauthStartPath: null,
    kind: 'search',
    capabilities: {
      connect: false,
      search: true,
      import: true,
      playback: true,
    },
  },
  {
    id: 'radio',
    name: 'Internet radio',
    description:
      'Paste an M3U/M3U8 playlist or direct stream URL to play a station, with metadata looked up automatically.',
    oauthStartPath: null,
    kind: 'tool',
    capabilities: {
      connect: false,
      search: true,
      import: false,
      playback: true,
    },
  },
];

export function sourceCapabilities(id: IntegrationId): SourceCapabilities {
  return (
    SOURCE_DEFS.find((source) => source.id === id)?.capabilities ?? {
      connect: false,
      search: false,
      import: false,
      playback: false,
    }
  );
}

export function oauthStartUrl(path: string): string {
  return `${apiBase()}${path}`;
}

export async function fetchConnectionStatus(
  id: IntegrationId,
): Promise<{ data: ConnectionStatus; meta: FetchMeta }> {
  if (
    id === 'upload' ||
    id === 'url' ||
    id === 'broadcast' ||
    id === 'radio' ||
    id === 'hearthis'
  ) {
    return {
      data: { connected: true, configured: true },
      meta: { source: forceMock() ? 'mock' : 'api' },
    };
  }
  if (forceMock()) {
    const oauthId = asOauthId(id);
    if (oauthId) {
      return {
        data: {
          connected: isMockOauthConnected(oauthId),
          configured: true,
        },
        meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
      };
    }
    return {
      data: { connected: true, configured: true },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  const path =
    id === 'stash'
      ? null
      : id === 'spotify'
        ? '/api/me/spotify-profile'
        : `/api/me/${id}`;
  if (!path) {
    // stash: probe list
    try {
      await requestJson('/api/me/stash?page=1&limit=1');
      return {
        data: { connected: true, configured: true },
        meta: { source: 'api' },
      };
    } catch (err) {
      return {
        data: { connected: false, configured: true },
        meta: failMeta(err),
      };
    }
  }
  try {
    if (id === 'spotify') {
      const { data } = await requestJson<{ spotifyArtistId?: string | null }>(
        path,
      );
      return {
        data: {
          connected: Boolean(data.spotifyArtistId),
          configured: true,
        },
        meta: { source: 'api' },
      };
    }
    const { data } = await requestJson<ConnectionStatus>(path);
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: { connected: false, configured: false },
      meta: failMeta(err),
    };
  }
}

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
  if (forceMock()) {
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
  if (forceMock()) {
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

export type SpotifySearchTrack = {
  id: string;
  name: string;
  artists?: string[];
  album?: string;
  artworkUrl?: string | null;
  uri?: string;
  externalUrl?: string;
};

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
  if (forceMock()) {
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
  if (forceMock()) {
    return { ok: true, count: album.trackCount ?? 0 };
  }
  try {
    const { data } = await requestJson<{ imported?: number }>(
      '/api/v1/imports/bandcamp/add',
      {
        method: 'POST',
        body: JSON.stringify({ albumUrl: album.url }),
      },
    );
    return { ok: true, count: data.imported ?? album.trackCount ?? 0 };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Bandcamp import failed',
    };
  }
}

export async function searchSpotifyTracks(q: string): Promise<{
  data: SpotifySearchTrack[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
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
  if (forceMock()) {
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

export type HearthisTrack = {
  id: string;
  url: string;
  title: string;
  username: string;
  durationSec: number;
  kind?: string;
  coverUrl?: string | null;
  streamUrl?: string | null;
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

type HearthisApiTrack = {
  id: string;
  title: string;
  type?: string;
  permalink_url: string;
  duration: string;
  artwork_url?: string | null;
  stream_url?: string | null;
  user: { username: string };
};

type HearthisApiCollection = {
  id: string;
  permalink: string;
  title: string;
  description?: string;
  track_count?: number;
  artwork_url?: string | null;
};

function hearthisApiTrack(track: HearthisApiTrack): HearthisTrack {
  return {
    id: track.id,
    url: track.permalink_url,
    title: track.title,
    username: track.user.username,
    durationSec: Number.parseInt(track.duration, 10) || 0,
    kind: track.type,
    coverUrl: track.artwork_url ?? null,
    streamUrl: track.stream_url ?? null,
  };
}

async function fetchHearthisPublic<T>(path: string): Promise<T> {
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
  if (forceMock()) {
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
  if (forceMock()) {
    return (await fetchHearthisLibrary()).data.sets;
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
  if (forceMock()) {
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
                `/api/me/archive/${encodeURIComponent(data.soundId)}/banner/from-url`,
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
  if (forceMock()) {
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

export type TrackExportStatus = {
  status: string;
  url: string | null;
  error: string | null;
};

export async function fetchTrackExportStatus(
  soundId: string,
  target: 'mixcloud',
): Promise<TrackExportStatus | null> {
  if (forceMock()) {
    return null;
  }
  try {
    const { data } = await requestJson<{
      status: string;
      mixcloudUrl: string | null;
      error: string | null;
    }>(
      `/api/me/archive/${encodeURIComponent(soundId)}/${encodeURIComponent(target)}`,
    );
    return {
      status: data.status,
      url: data.mixcloudUrl,
      error: data.error,
    };
  } catch {
    return null;
  }
}

export async function exportTrack(
  soundId: string,
  target: 'mixcloud',
): Promise<
  { ok: true; status: TrackExportStatus } | { ok: false; error: string }
> {
  if (forceMock()) {
    return {
      ok: true,
      status: { status: 'PENDING', url: null, error: null },
    };
  }
  try {
    const { data } = await requestJson<{ status: string }>(
      `/api/me/archive/${encodeURIComponent(soundId)}/${encodeURIComponent(target)}`,
      { method: 'POST' },
    );
    return {
      ok: true,
      status: { status: data.status, url: null, error: null },
    };
  } catch (err) {
    const existing = await fetchTrackExportStatus(soundId, target);
    if (existing) {
      return { ok: true, status: existing };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Export failed',
    };
  }
}

export type StashShare = {
  id: string;
  granteeUsername: string | null;
  token: string;
  permission: 'READ' | 'DOWNLOAD';
  fileCount: number;
  expiresAt: string | null;
  createdAt: string;
};

export type StashFile = {
  id: string;
  filename: string;
  contentType?: string;
  sizeBytes?: number | string;
  createdAt?: string;
  shareCount: number;
  shares: StashShare[];
};

let mockStashShares: StashShare[] = [];
const MILLISECONDS_PER_DAY = 86_400_000;

export async function fetchStashFiles(): Promise<{
  data: StashFile[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: [
        {
          id: 'stash-1',
          filename: 'stems-kick.wav',
          contentType: 'audio/wav',
          sizeBytes: 12_000_000,
          shareCount: mockStashShares.length,
          shares: [...mockStashShares],
        },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ files: StashFile[] }>(
      '/api/me/stash?page=1&limit=50',
    );
    return { data: data.files ?? [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function fetchStashDownload(id: string): Promise<{
  data: { url: string; filename?: string } | null;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: { url: DEMO_MP3, filename: 'mock.mp3' },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ url: string; filename?: string }>(
      `/api/me/stash/${encodeURIComponent(id)}/download`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function uploadStashFile(
  file: File,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (forceMock()) {
    return { ok: true, id: `mock-stash-${Date.now()}` };
  }
  try {
    const { data: prep } = await requestJson<{
      objectKey: string;
      uploadUrl: string;
    }>('/api/me/stash/prepare', {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
      }),
    });
    const put = await fetch(prep.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    });
    if (!put.ok) {
      return { ok: false, error: `Upload PUT failed (${put.status})` };
    }
    const { data } = await requestJson<{ id: string }>('/api/me/stash', {
      method: 'POST',
      body: JSON.stringify({
        objectKey: prep.objectKey,
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
      }),
    });
    return { ok: true, id: data.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    };
  }
}

export async function deleteStashFile(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    return { ok: true };
  }
  try {
    await requestJson<void>(`/api/me/stash/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Delete failed',
    };
  }
}

export async function createStashShare(
  id: string,
  input: {
    granteeUsername?: string;
    permission: 'READ' | 'DOWNLOAD';
    expiresInDays?: number;
  },
): Promise<{ ok: true; data: StashShare } | { ok: false; error: string }> {
  if (forceMock()) {
    const now = new Date();
    const share: StashShare = {
      id: `mock-share-${Date.now()}`,
      granteeUsername: input.granteeUsername?.replace(/^@/, '') || null,
      token: `mock-token-${Date.now()}`,
      permission: input.permission,
      fileCount: 1,
      expiresAt: input.expiresInDays
        ? new Date(
            now.getTime() + input.expiresInDays * MILLISECONDS_PER_DAY,
          ).toISOString()
        : null,
      createdAt: now.toISOString(),
    };
    mockStashShares = [...mockStashShares, share];
    return { ok: true, data: share };
  }
  try {
    const { data } = await requestJson<{
      id: string;
      token: string;
      permission: 'READ' | 'DOWNLOAD';
      expiresAt: string | null;
    }>(`/api/me/stash/${encodeURIComponent(id)}/share`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return {
      ok: true,
      data: {
        ...data,
        granteeUsername: input.granteeUsername ?? null,
        fileCount: 1,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Share creation failed',
    };
  }
}

export async function revokeStashShare(
  shareId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    mockStashShares = mockStashShares.filter((share) => share.id !== shareId);
    return { ok: true };
  }
  try {
    await requestJson<void>(
      `/api/me/stash/shares/${encodeURIComponent(shareId)}`,
      { method: 'DELETE' },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Revoke failed',
    };
  }
}

export function playableFromSpotify(t: SpotifySearchTrack): TahtiPlayable {
  return {
    id: `spotify:${t.id}`,
    kind: 'archive',
    title: t.name,
    artist: t.artists?.join(', ') || 'Spotify',
    coverUrl: t.artworkUrl ?? undefined,
    // Preview/stream may be unavailable — use demo in POC when no preview
    streamUrl: DEMO_MP3,
    protocol: 'https',
    sourceProvider: 'spotify',
  };
}

export function playableFromSoundcloud(t: SoundcloudTrack): TahtiPlayable {
  return {
    id: `soundcloud:${t.id}`,
    kind: 'archive',
    title: t.title,
    artist: 'SoundCloud',
    coverUrl: t.artworkUrl ?? undefined,
    streamUrl: DEMO_MP3,
    protocol: 'https',
    sourceProvider: 'soundcloud',
  };
}

/** Mock-only: flip an OAuth integration to connected without leaving the app. */
export async function connectIntegrationMock(
  id: MockOauthId,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!forceMock()) {
    return { ok: false, error: 'connectIntegrationMock is mock-only' };
  }
  setMockOauthConnected(id, true);
  return { ok: true };
}

export async function disconnectIntegration(
  id: 'bandcamp' | 'soundcloud' | 'google-drive' | 'mixcloud' | 'musicbrainz',
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    setMockOauthConnected(id, false);
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/${id}`, { method: 'DELETE' });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Disconnect failed',
    };
  }
}
