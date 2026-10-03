import { requestJson } from './client-request';
import { mockDirectory, mockFeed, mockSearch, TAHTI_RADIO_SLUG } from './mock';
import { mockFixture } from './mock-overrides';
import {
  apiErrorMeta,
  isForceMock,
  withMockFallback,
  type FetchMeta,
} from './mode';
import type {
  ChannelDirectoryResponse,
  FeedResponse,
  SearchResponse,
  SearchTrackResult,
} from './types';

export type OnAirChannel = {
  slug: string;
  state: string;
  fallbackEnabled: boolean;
  user: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
};

export type OnAirChannelResponse = {
  live: OnAirChannel[];
  replaying: OnAirChannel[];
  recent: OnAirChannel[];
};

async function getJson<T>(path: string): Promise<T> {
  const { data } = await requestJson<T>(path);
  return data;
}

export async function fetchDirectory(): Promise<{
  data: ChannelDirectoryResponse;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockDirectory(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<ChannelDirectoryResponse>(
      '/api/v1/channels/directory',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(err, mockDirectory, () => ({ items: [] }));
  }
}

/** Global search — top nav search bar. type narrows to one result kind;
 * omit for all three at once. */
export async function fetchSearch(
  q: string,
  type: 'all' | 'tracks' | 'artists' | 'collections' = 'all',
): Promise<{
  data: SearchResponse;
  meta: FetchMeta;
}> {
  const empty: SearchResponse = { tracks: [], artists: [], collections: [] };
  if (!q.trim()) {
    return { data: empty, meta: { source: 'api' } };
  }
  if (isForceMock()) {
    return {
      data: mockSearch(q, type),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<SearchResponse>(
      `/api/v1/search?q=${encodeURIComponent(q)}&type=${type}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(
      err,
      () => mockSearch(q, type),
      () => empty,
    );
  }
}

/** Public tracks carrying an exact tag (case-insensitive) - the track page's
 * tag chips land here. Errors are returned, not mocked: an API without the
 * `tag` filter answers 400, and the view says it couldn't load. */
export async function fetchTracksByTag(
  tag: string,
): Promise<
  { ok: true; tracks: SearchTrackResult[] } | { ok: false; error: string }
> {
  const trimmed = tag.trim();
  if (!trimmed) {
    return { ok: true, tracks: [] };
  }
  if (isForceMock()) {
    return { ok: true, tracks: mockFixture('tagTracks', [], trimmed) };
  }
  try {
    const data = await getJson<SearchResponse>(
      `/api/v1/search?tag=${encodeURIComponent(trimmed)}&type=tracks&count=50`,
    );
    return { ok: true, tracks: data.tracks };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Search failed',
    };
  }
}

export async function fetchOnAirChannels(): Promise<{
  data: OnAirChannelResponse;
  meta: FetchMeta;
}> {
  const empty = (): OnAirChannelResponse => ({
    live: [],
    replaying: [],
    recent: [],
  });
  const mock = (): OnAirChannelResponse => ({
    live: mockDirectory()
      .items.filter(
        (item) =>
          item.slug === TAHTI_RADIO_SLUG || item.slug === 'northern-lights',
      )
      .map((item) => ({
        slug: item.slug,
        state: 'LIVE',
        fallbackEnabled: false,
        user: {
          username: item.username,
          displayName: item.displayName,
          avatarUrl: item.avatarUrl,
        },
      })),
    replaying: [],
    recent: [],
  });
  if (isForceMock()) {
    return {
      data: mock(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    return {
      data: await getJson<OnAirChannelResponse>('/api/v1/channels'),
      meta: { source: 'api' },
    };
  } catch (err) {
    return withMockFallback(err, mock, empty);
  }
}

/** GET /api/me/feed — listener home: recent activity from followed artists. */
export async function fetchFeed(): Promise<{
  data: FeedResponse;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockFeed(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<FeedResponse>('/api/me/feed');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: { items: [], followingCount: 0 },
      meta: apiErrorMeta(err),
    };
  }
}
