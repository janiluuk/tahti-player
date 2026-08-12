import type { FetchMeta } from './client';
import { DEMO_MP3 } from './mock';
import {
  isMockOauthConnected,
  setMockOauthConnected,
  type MockOauthId,
} from './mock-session';
import { allowMockFallback, apiErrorMeta, isForceMock } from './mode';
import type { TahtiPlayable } from './types';

const forceMock = () => isForceMock();

const OAUTH_IDS = new Set<MockOauthId>([
  'bandcamp',
  'soundcloud',
  'google-drive',
  'mixcloud',
  'spotify',
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
  | 'broadcast';

export type ConnectionStatus = {
  connected: boolean;
  configured: boolean;
};

export type SourceDef = {
  id: IntegrationId;
  name: string;
  description: string;
  /** OAuth start path under API, or null if not OAuth */
  oauthStartPath: string | null;
  studioDeepLink?: string;
  kind: 'oauth' | 'upload' | 'search' | 'tool';
};

export const SOURCE_DEFS: SourceDef[] = [
  {
    id: 'upload',
    name: 'Local upload',
    description:
      'Upload audio files into your archive (prepare → MinIO → complete).',
    oauthStartPath: null,
    studioDeepLink: '/studio/upload',
    kind: 'upload',
  },
  {
    id: 'stash',
    name: 'Stash',
    description:
      'Private file locker — upload stems/masters without publishing to the channel.',
    oauthStartPath: null,
    kind: 'upload',
  },
  {
    id: 'bandcamp',
    name: 'Bandcamp',
    description: 'Connect Bandcamp and import albums into your catalog.',
    oauthStartPath: '/api/me/bandcamp/oauth/start',
    kind: 'oauth',
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    description:
      'OAuth connect, list downloadable tracks, queue server-side import to archive.',
    oauthStartPath: '/api/me/soundcloud/oauth/start',
    kind: 'oauth',
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Connect Drive and import audio files via cloud-import jobs.',
    oauthStartPath: '/api/me/google-drive/oauth/start',
    kind: 'oauth',
  },
  {
    id: 'mixcloud',
    name: 'Mixcloud',
    description:
      'Connect Mixcloud for rescue/upload of mixes to/from your archive.',
    oauthStartPath: '/api/me/mixcloud/oauth/start',
    kind: 'oauth',
  },
  {
    id: 'url',
    name: 'URL / DSP paste',
    description:
      'Paste Spotify/Bandcamp/etc. URLs to seed smart-link targets on a release.',
    oauthStartPath: null,
    kind: 'tool',
  },
  {
    id: 'spotify',
    name: 'Spotify search',
    description:
      'Search Spotify tracks (app token) to add into mixed-source collections.',
    oauthStartPath: null,
    kind: 'search',
  },
  {
    id: 'broadcast',
    name: 'From broadcast',
    description:
      'Promote recent live archive captures into published Music items.',
    oauthStartPath: null,
    studioDeepLink: '/studio/archive',
    kind: 'tool',
  },
];

export function oauthStartUrl(path: string): string {
  return `${apiBase()}${path}`;
}

/** Absolute OAuth start URL (same-origin /tahti-api in beta). */
export function oauthStartHref(path: string): string {
  return oauthStartUrl(path);
}

/**
 * Provider callbacks finish on production `appUrl` (e.g. tahti.live/dashboard/…).
 * After connecting there, return here and refresh status.
 */
export function oauthCallbackHint(id: IntegrationId): string {
  const map: Partial<Record<IntegrationId, string>> = {
    soundcloud: 'https://tahti.live/dashboard/upload/import/soundcloud',
    bandcamp: 'https://tahti.live/dashboard/upload/import/bandcamp',
    'google-drive': 'https://tahti.live/dashboard/upload/import/google-drive',
    mixcloud: 'https://tahti.live/dashboard?mixcloud=connected',
  };
  const dest = map[id];
  if (!dest) {
    return 'Complete OAuth in the provider window, then return here and refresh.';
  }
  return `OAuth finishes on production (${dest}). When connected, come back to this Sources tile — status refreshes on focus.`;
}


export async function fetchConnectionStatus(
  id: IntegrationId,
): Promise<{ data: ConnectionStatus; meta: FetchMeta }> {
  if (id === 'upload' || id === 'url' || id === 'broadcast') {
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
      if (allowMockFallback()) {
        return {
          data: { connected: false, configured: true },
          meta: failMeta(err),
        };
      }
      return {
        data: { connected: false, configured: true },
        meta: apiErrorMeta(err),
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
    // Prod/beta: never paint a silent "Mock" chip — report API error meta.
    if (allowMockFallback() && asOauthId(id)) {
      const oauthId = asOauthId(id)!;
      return {
        data: {
          connected: isMockOauthConnected(oauthId),
          configured: true,
        },
        meta: failMeta(err),
      };
    }
    const msg = err instanceof Error ? err.message : '';
    const notConfigured =
      /503|not configured|OAuth is not configured/i.test(msg);
    return {
      data: {
        connected: false,
        configured: !notConfigured,
      },
      meta: apiErrorMeta(err),
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
    if (allowMockFallback()) {
      return { data: [], meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function importSoundcloudTracks(
  tracks: Array<{ trackId: string; title: string }>,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  if (forceMock()) {
    return { ok: true, count: tracks.length };
  }
  try {
    await requestJson('/api/me/soundcloud/import', {
      method: 'POST',
      body: JSON.stringify({ tracks }),
    });
    return { ok: true, count: tracks.length };
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

export async function searchSpotifyTracks(q: string): Promise<{
  data: SpotifySearchTrack[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: [
        {
          id: 'sp-mock-1',
          name: `${q} (mock)`,
          artists: ['Mock Artist'],
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
    if (allowMockFallback()) {
      return { data: [], meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export type StashFile = {
  id: string;
  filename: string;
  contentType?: string;
  sizeBytes?: number;
  createdAt?: string;
};

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
  onProgress?: (pct: number) => void,
): Promise<{ ok: true; id: string; meta: FetchMeta } | { ok: false; error: string }> {
  if (forceMock()) {
    onProgress?.(100);
    const id = `stash-mock-${Date.now()}`;
    return {
      ok: true,
      id,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    onProgress?.(5);
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
    onProgress?.(25);
    const put = await fetch(prep.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    });
    if (!put.ok) {
      throw new Error(`Stash PUT failed (${put.status})`);
    }
    onProgress?.(80);
    const ext = file.name.split('.').pop()?.toUpperCase() ?? '';
    const formatMap: Record<string, string> = {
      FLAC: 'FLAC',
      WAV: 'WAV',
      MP3: 'MP3',
      ZIP: 'ZIP',
      AIFF: 'AIFF',
    };
    const { data: registered } = await requestJson<{ id: string }>(
      '/api/me/stash',
      {
        method: 'POST',
        body: JSON.stringify({
          objectKey: prep.objectKey,
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          format: formatMap[ext] ?? (ext || undefined),
        }),
      },
    );
    onProgress?.(100);
    return { ok: true, id: registered.id, meta: { source: 'api' } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Stash upload failed',
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
    await requestJson(`/api/me/stash/${encodeURIComponent(id)}`, {
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
  id: 'bandcamp' | 'soundcloud' | 'google-drive' | 'mixcloud',
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
