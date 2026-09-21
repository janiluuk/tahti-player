import type { FetchMeta } from '.././client';
import { apiBase } from '.././http';
import { isMockOauthConnected } from '.././mock-session';
import { isForceMock } from '.././mode';
import { requestJson } from '.././request-json';
import { asOauthId, failMeta } from './shared';

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
      meta: { source: isForceMock() ? 'mock' : 'api' },
    };
  }
  if (isForceMock()) {
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
