import { fetchDirectory, fetchProfile } from './client';
import { mockLatestTracks, mockNewToYou, mockTopTracks } from './mock';
import {
  allowMockFallback,
  failMeta,
  isForceMock,
  type FetchMeta,
} from './mode';
import type { DiscoverCollection, DiscoverTrackItem } from './types';

const forceMock = isForceMock;

const apiBase = () => {
  if (import.meta.env.VITE_TAHTI_API_URL?.startsWith('http')) {
    return import.meta.env.VITE_TAHTI_API_URL.replace(/\/$/, '');
  }
  return '/tahti-api';
};

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`${path} → ${res.status}`);
  }
  return (await res.json()) as T;
}

export type TopTracksPeriod = 'week' | 'month' | 'half_year' | 'all_time';
export type TopTracksSort = 'asc' | 'desc';

export type DiscoverFilters = {
  genres: string[];
  contentTypes: string[];
};

export async function fetchPublicCollections(
  filters: DiscoverFilters,
): Promise<{
  data: DiscoverCollection[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: [
        {
          slug: 'favorites-vault',
          name: 'Favorites vault',
          description: 'Hand-picked highlights from the archive.',
          coverUrl: null,
          itemCount: 2,
          ownerUsername: 'northern-lights',
          ownerDisplayName: 'Northern Lights',
        },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const directory = await fetchDirectory();
    const selectedArtists = directory.data.items.filter((artist) => {
      if (filters.genres.length === 0) {
        return true;
      }
      const genres = new Set(artist.genres.map((genre) => genre.toLowerCase()));
      return filters.genres.some((genre) => genres.has(genre.toLowerCase()));
    });
    const profiles = await Promise.all(
      selectedArtists
        .slice(0, 24)
        .map((artist) => fetchProfile(artist.username)),
    );
    const collections = profiles.flatMap((profile) =>
      profile.data.collections.map((collection) => ({
        slug: collection.slug,
        name: collection.name,
        description: collection.description,
        coverUrl: collection.coverUrl,
        itemCount: collection.itemCount,
        ownerUsername: profile.data.artist.username,
        ownerDisplayName: profile.data.artist.displayName,
      })),
    );
    return {
      data: collections.slice(0, 24),
      meta: { source: 'api' },
    };
  } catch (err) {
    if (allowMockFallback()) {
      return {
        data: [],
        meta: failMeta(err),
      };
    }
    throw err instanceof Error ? err : new Error('Public collections failed');
  }
}

export type DiscoverArtistOfWeek = {
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  channelSlug: string;
};

function getWeekIndex(): number {
  const weekInMilliseconds = 7 * 24 * 60 * 60 * 1000;
  return Math.floor(Date.now() / weekInMilliseconds);
}

export async function fetchArtistOfTheWeek(): Promise<{
  data: DiscoverArtistOfWeek | null;
  meta: FetchMeta;
}> {
  try {
    const directory = await fetchDirectory();
    const artists = directory.data.items.filter(
      (artist) => artist.slug !== 'tahti-radio',
    );
    if (artists.length === 0) {
      return { data: null, meta: directory.meta };
    }

    const selected = artists[getWeekIndex() % artists.length]!;
    const profile = await fetchProfile(selected.username);
    return {
      data: {
        username: profile.data.artist.username,
        displayName: profile.data.artist.displayName,
        bio: profile.data.artist.bio,
        avatarUrl: profile.data.artist.avatarUrl ?? selected.avatarUrl,
        channelSlug: selected.slug,
      },
      meta: profile.meta,
    };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

/** Generalized fetchArtistOfTheWeek: stable for `rotationDays` days at a
 * time (default 1 — a new pick daily) instead of hardcoded to a week, so
 * the widget settings can offer "every N days" without re-randomizing on
 * every reload within the same window. */
export async function fetchRandomArtist(rotationDays = 1): Promise<{
  data: DiscoverArtistOfWeek | null;
  meta: FetchMeta;
}> {
  try {
    const directory = await fetchDirectory();
    const artists = directory.data.items.filter(
      (artist) => artist.slug !== 'tahti-radio',
    );
    if (artists.length === 0) {
      return { data: null, meta: directory.meta };
    }

    const windowMs = Math.max(1, rotationDays) * 24 * 60 * 60 * 1000;
    const windowIndex = Math.floor(Date.now() / windowMs);
    const selected = artists[windowIndex % artists.length]!;
    const profile = await fetchProfile(selected.username);
    return {
      data: {
        username: profile.data.artist.username,
        displayName: profile.data.artist.displayName,
        bio: profile.data.artist.bio,
        avatarUrl: profile.data.artist.avatarUrl ?? selected.avatarUrl,
        channelSlug: selected.slug,
      },
      meta: profile.meta,
    };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

function filterQuery(filters: DiscoverFilters): string {
  const params = new URLSearchParams();
  // The backend only accepts a single genre per request; the multi-select
  // widens the request by OR-ing client-side across each selected genre.
  if (filters.contentTypes.length > 0) {
    params.set('contentTypes', filters.contentTypes.join(','));
  }
  return params.toString();
}

type WireTopListEntry = {
  soundId: string;
  listens: number;
  title: string;
  artistName: string;
  channelSlug: string;
  bannerUrl: string | null;
  genre: string | null;
  contentType: string;
};

function topListEntryToTrack(entry: WireTopListEntry): DiscoverTrackItem {
  return {
    id: `sound:${entry.soundId}`,
    title: entry.title,
    artist: entry.artistName,
    channelSlug: entry.channelSlug,
    coverUrl: entry.bannerUrl,
    genre: entry.genre,
    listens: entry.listens,
  };
}

async function fetchTopTracksForGenre(
  period: TopTracksPeriod,
  sort: TopTracksSort,
  genre: string | undefined,
  filters: DiscoverFilters,
): Promise<WireTopListEntry[]> {
  const qs = filterQuery(filters);
  const genrePart = genre ? `&genre=${encodeURIComponent(genre)}` : '';
  const { entries } = await getJson<{ entries: WireTopListEntry[] }>(
    `/api/top-lists?period=${period}&sort=${sort}${genrePart}${qs ? `&${qs}` : ''}`,
  );
  return entries;
}

/** Most/least played tracks in a time window. When multiple genres are
 * selected, fetches each and merges by highest listen count (the backend
 * only filters by one genre per request). */
export async function fetchTopTracks(
  period: TopTracksPeriod,
  sort: TopTracksSort,
  filters: DiscoverFilters,
): Promise<{ data: DiscoverTrackItem[]; meta: FetchMeta }> {
  if (forceMock()) {
    return {
      data: mockTopTracks(sort),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const genres = filters.genres.length > 0 ? filters.genres : [undefined];
    const lists = await Promise.all(
      genres.map((genre) =>
        fetchTopTracksForGenre(period, sort, genre, filters),
      ),
    );
    const byId = new Map<string, WireTopListEntry>();
    for (const list of lists) {
      for (const entry of list) {
        if (!byId.has(entry.soundId)) {
          byId.set(entry.soundId, entry);
        }
      }
    }
    const merged = [...byId.values()].sort((a, b) =>
      sort === 'asc' ? a.listens - b.listens : b.listens - a.listens,
    );
    return { data: merged.map(topListEntryToTrack), meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockTopTracks(sort), meta: failMeta(err) };
    }
    return { data: [], meta: failMeta(err) };
  }
}

type WireGalleryItem = {
  soundId: string;
  title: string;
  artistName: string;
  artistUsername: string | null;
  channelSlug: string;
  bannerUrl: string | null;
  durationSec: number | null;
  audioUrl: string | null;
};

function galleryItemToTrack(item: WireGalleryItem): DiscoverTrackItem {
  return {
    id: `sound:${item.soundId}`,
    title: item.title,
    artist: item.artistName,
    artistUsername: item.artistUsername,
    channelSlug: item.channelSlug,
    coverUrl: item.bannerUrl,
    durationSec: item.durationSec,
    audioUrl: item.audioUrl,
  };
}

async function fetchLatestForGenre(
  genre: string | undefined,
  filters: DiscoverFilters,
): Promise<WireGalleryItem[]> {
  const qs = filterQuery(filters);
  const genrePart = genre ? `genre=${encodeURIComponent(genre)}&` : '';
  const { items } = await getJson<{ items: WireGalleryItem[] }>(
    `/api/discover/latest-tracks?${genrePart}${qs}`,
  );
  return items;
}

export async function fetchLatestTracks(
  filters: DiscoverFilters,
): Promise<{ data: DiscoverTrackItem[]; meta: FetchMeta }> {
  if (forceMock()) {
    return {
      data: mockLatestTracks(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const genres = filters.genres.length > 0 ? filters.genres : [undefined];
    const lists = await Promise.all(
      genres.map((genre) => fetchLatestForGenre(genre, filters)),
    );
    const byId = new Map<string, WireGalleryItem>();
    for (const list of lists) {
      for (const item of list) {
        if (!byId.has(item.soundId)) {
          byId.set(item.soundId, item);
        }
      }
    }
    return {
      data: [...byId.values()].map(galleryItemToTrack),
      meta: { source: 'api' },
    };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockLatestTracks(), meta: failMeta(err) };
    }
    return { data: [], meta: failMeta(err) };
  }
}

/** "New to you" is fully personalized to the signed-in listener's own
 * follow/listen signals server-side — the dashboard's genre/type filter row
 * doesn't apply to it. */
export async function fetchNewToYou(): Promise<{
  data: DiscoverTrackItem[];
  authenticated: boolean;
  preferenceGenres: string[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    const mock = mockNewToYou();
    return {
      data: mock.items,
      authenticated: true,
      preferenceGenres: mock.preferenceGenres,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const res = await getJson<{
      authenticated: boolean;
      preferenceGenres: string[];
      items: WireGalleryItem[];
    }>('/api/discover/new-to-you');
    return {
      data: res.items.map(galleryItemToTrack),
      authenticated: res.authenticated,
      preferenceGenres: res.preferenceGenres,
      meta: { source: 'api' },
    };
  } catch (err) {
    if (allowMockFallback()) {
      const mock = mockNewToYou();
      return {
        data: mock.items,
        authenticated: true,
        preferenceGenres: mock.preferenceGenres,
        meta: failMeta(err),
      };
    }
    return {
      data: [],
      authenticated: false,
      preferenceGenres: [],
      meta: failMeta(err),
    };
  }
}

type TrackReactionResponse = {
  reactions: Array<{ type: string }>;
};

async function countTrackLoves(trackId: string): Promise<number> {
  const response = await getJson<TrackReactionResponse>(
    `/api/reactions/track/${encodeURIComponent(trackId)}`,
  );
  return response.reactions.filter((reaction) => reaction.type === 'LOVE')
    .length;
}

/** Community-wide Loved list, ranked from the public LOVE reactions on tracks. */
export async function fetchLovedTracks(
  filters: DiscoverFilters,
): Promise<{ data: DiscoverTrackItem[]; meta: FetchMeta }> {
  if (forceMock()) {
    return {
      data: mockTopTracks('desc').map((item, index) => ({
        ...item,
        loves: Math.max(1, 42 - index * 7),
      })),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const candidates = await fetchTopTracks('all_time', 'desc', filters);
    const ranked = await Promise.all(
      candidates.data.slice(0, 24).map(async (track) => ({
        track,
        loves: await countTrackLoves(track.id.replace(/^sound:/, '')),
      })),
    );
    return {
      data: ranked
        .filter(({ loves }) => loves > 0)
        .sort((left, right) => right.loves - left.loves)
        .map(({ track, loves }) => ({ ...track, loves })),
      meta: { source: 'api' },
    };
  } catch (err) {
    if (allowMockFallback()) {
      return {
        data: mockTopTracks('desc').map((item, index) => ({
          ...item,
          loves: Math.max(1, 42 - index * 7),
        })),
        meta: failMeta(err),
      };
    }
    return { data: [], meta: failMeta(err) };
  }
}
