import type { FetchMeta } from './client';
import { apiBase } from './http';
import { setMockFreeSubscriptionsEnabled } from './mock-profile-preferences';
import { allowMockFallback, apiErrorMeta, failMeta, isForceMock } from './mode';

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

// ── Schedule ────────────────────────────────────────────────────────────────

export type ChannelSchedule = {
  nextBroadcastAt: string | null;
  nextBroadcastNote: string | null;
  nextBroadcastShowType?: 'LIVE_SET' | 'TALK' | null;
  nextBroadcastShowId?: string | null;
  nextBroadcastMode?: 'SINGLE' | 'SERIES' | null;
  nextBroadcastDescription?: string | null;
  nextBroadcastCoverUrl?: string | null;
  nextBroadcastDurationHours?: 1 | 2 | null;
};

export type UpcomingBroadcast = {
  id: string;
  startAt: string;
  title: string;
  episodeNumber: number | null;
  showType: 'LIVE_SET' | 'TALK';
  visibility: 'PUBLIC' | 'FAN_ONLY';
  venue: string | null;
  location: string | null;
};

export type ProgrammeItem = {
  id: string;
  title: string;
  status: string;
  contentType?: string | null;
  durationSec: number | null;
  isFallback: boolean;
  fallbackOrder: number | null;
  /** Set for EMBED_ONLY items (hearthis.at, Mixcloud, Spotify, Bandcamp) —
   * Tahti holds no audio file for these, only a provider widget, so they
   * cannot play unattended in a 24/7 rotation and should never be offered
   * as rotation candidates. */
  embedProvider?: 'HEARTHIS' | 'MIXCLOUD' | 'SPOTIFY' | 'BANDCAMP' | null;
};

export type ProgrammeView = {
  fallbackMode: 'shuffle' | 'ordered';
  fallbackEnabled: boolean;
  fallbackAutoEnroll: boolean;
  announcementsEnabled: boolean;
  items: ProgrammeItem[];
};

let mockSchedule: ChannelSchedule = {
  nextBroadcastAt: new Date(Date.now() + 3 * 24 * 3600_000).toISOString(),
  nextBroadcastNote: 'Mock Friday set',
  nextBroadcastShowType: 'LIVE_SET',
  nextBroadcastMode: 'SERIES',
  nextBroadcastDescription: 'A two-hour northern lights session.',
  nextBroadcastCoverUrl: null,
  nextBroadcastDurationHours: 2,
};

let mockProgramme: ProgrammeView = {
  fallbackMode: 'shuffle',
  fallbackEnabled: true,
  fallbackAutoEnroll: true,
  announcementsEnabled: true,
  items: [
    {
      id: 'arch-mock-1',
      title: 'Northern Lights — Live Set',
      status: 'READY',
      durationSec: 3720,
      isFallback: true,
      fallbackOrder: 0,
    },
  ],
};

export async function fetchChannelSchedule(): Promise<{
  data: ChannelSchedule;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: { ...mockSchedule },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ChannelSchedule>(
      '/api/me/channel/schedule',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: { nextBroadcastAt: null, nextBroadcastNote: null },
      meta: failMeta(err),
    };
  }
}

export async function patchChannelSchedule(
  patch: Partial<ChannelSchedule>,
): Promise<{ ok: true; data: ChannelSchedule } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockSchedule = { ...mockSchedule, ...patch };
    return { ok: true, data: { ...mockSchedule } };
  }
  try {
    const { data } = await requestJson<ChannelSchedule>(
      '/api/me/channel/schedule',
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

export async function fetchUpcomingBroadcasts(): Promise<{
  data: UpcomingBroadcast[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    const first = mockSchedule.nextBroadcastAt;
    return {
      data: first
        ? [
            {
              id: 'scheduled-mock-1',
              startAt: first,
              title: mockSchedule.nextBroadcastNote ?? 'Next live session',
              episodeNumber: 4,
              showType: 'LIVE_SET',
              visibility: 'PUBLIC',
              venue: null,
              location: 'Helsinki',
            },
            {
              id: 'scheduled-mock-2',
              startAt: new Date(
                new Date(first).getTime() + 7 * 24 * 3600_000,
              ).toISOString(),
              title: 'Northern Signals #5',
              episodeNumber: 5,
              showType: 'LIVE_SET',
              visibility: 'PUBLIC',
              venue: null,
              location: null,
            },
          ]
        : [],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{
      scheduledShows?: UpcomingBroadcast[];
    }>('/api/me/channel/show-series');
    return {
      data: [...(data.scheduledShows ?? [])].sort(
        (left, right) =>
          new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
      ),
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function fetchProgramme(): Promise<{
  data: ProgrammeView;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: { ...mockProgramme, items: [...mockProgramme.items] },
      meta: { source: 'mock' },
    };
  }
  try {
    const { data } = await requestJson<ProgrammeView>(
      '/api/me/channel/programme',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: {
        fallbackMode: 'shuffle',
        fallbackEnabled: false,
        fallbackAutoEnroll: false,
        announcementsEnabled: false,
        items: [],
      },
      meta: failMeta(err),
    };
  }
}

export type ProgrammeItemPatch = {
  soundId: string;
  isFallback: boolean;
  fallbackOrder?: number;
};

export async function patchProgramme(
  patch: Partial<
    Pick<
      ProgrammeView,
      | 'fallbackMode'
      | 'fallbackEnabled'
      | 'fallbackAutoEnroll'
      | 'announcementsEnabled'
    >
  > & { items?: ProgrammeItemPatch[] },
): Promise<{ ok: true; data: ProgrammeView } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockProgramme = {
      ...mockProgramme,
      ...patch,
      items: patch.items
        ? patch.items.map((i, idx) => ({
            id: i.soundId,
            title: `Rotation ${idx + 1}`,
            status: 'READY',
            durationSec: null,
            isFallback: i.isFallback,
            fallbackOrder: i.fallbackOrder ?? idx,
          }))
        : mockProgramme.items,
    };
    return {
      ok: true,
      data: { ...mockProgramme, items: [...mockProgramme.items] },
    };
  }
  try {
    const { data } = await requestJson<ProgrammeView>(
      '/api/me/channel/programme',
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

/** Apply a playlist's archive tracks as the channel 24/7 rotation. */
export async function applyPlaylistToProgramme(
  soundIds: string[],
  opts?: {
    enable?: boolean;
    mode?: 'shuffle' | 'ordered';
    autoEnroll?: boolean;
    announcementsEnabled?: boolean;
  },
): Promise<{ ok: true; data: ProgrammeView } | { ok: false; error: string }> {
  const ids = soundIds.filter(Boolean);
  if (ids.length === 0) {
    return { ok: false, error: 'Playlist has no archive tracks to rotate' };
  }
  return patchProgramme({
    fallbackEnabled: opts?.enable ?? true,
    fallbackMode: opts?.mode ?? 'ordered',
    ...(opts?.autoEnroll !== undefined
      ? { fallbackAutoEnroll: opts.autoEnroll }
      : {}),
    ...(opts?.announcementsEnabled !== undefined
      ? { announcementsEnabled: opts.announcementsEnabled }
      : {}),
    items: ids.map((soundId, fallbackOrder) => ({
      soundId,
      isFallback: true,
      fallbackOrder,
    })),
  });
}

// ── Stats ───────────────────────────────────────────────────────────────────

export type StatsSummary = {
  playsToday: number;
  playsTotal: number;
  downloadsToday: number;
  downloadsTotal: number;
  followerCount: number;
};

export type StorageUsage = {
  usedBytes: number;
  quotaBytes: number | null;
  unlimited: boolean;
};

export async function fetchStorageUsage(): Promise<{
  data: StorageUsage;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: {
        usedBytes: 86_000_000,
        quotaBytes: 524_288_000,
        unlimited: false,
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<StorageUsage>('/api/me/storage');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: { usedBytes: 0, quotaBytes: null, unlimited: true },
      meta: failMeta(err),
    };
  }
}

export type StatsTopTrack = {
  soundId: string;
  title: string;
  plays: number;
};
export type StatsTopCountry = { country: string; count: number };

export type StatsTopListDimension = 'type' | 'genre';
export type StatsTopListSort = 'asc' | 'desc';
export type StatsTopListEntry = {
  soundId: string;
  listens: number;
  title: string;
  contentType: string;
  genre: string | null;
};
export type StatsTopListBucket = {
  bucket: string;
  entries: StatsTopListEntry[];
};

export async function fetchStatsSummary(): Promise<{
  data: StatsSummary;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: {
        playsToday: 42,
        playsTotal: 12890,
        downloadsToday: 3,
        downloadsTotal: 910,
        followerCount: 284,
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<StatsSummary>('/api/me/stats/summary');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: {
        playsToday: 0,
        playsTotal: 0,
        downloadsToday: 0,
        downloadsTotal: 0,
        followerCount: 0,
      },
      meta: failMeta(err),
    };
  }
}

export async function fetchStatsTopTracks(
  range: StatsPlaysRange = '30',
): Promise<{
  data: StatsTopTrack[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [
        {
          soundId: 'arch-mock-1',
          title: 'Northern Lights — Live Set',
          plays: 420,
        },
        { soundId: 'arch-mock-2', title: 'Studio sketch A', plays: 88 },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ items: StatsTopTrack[] }>(
      `/api/me/stats/top-tracks?range=${range}`,
    );
    return { data: data.items ?? [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function fetchStatsTopCountries(
  range: StatsPlaysRange = '30',
): Promise<{
  data: StatsTopCountry[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [
        { country: 'FI', count: 120 },
        { country: 'DE', count: 45 },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ items: StatsTopCountry[] }>(
      `/api/me/stats/top-countries?range=${range}`,
    );
    return { data: data.items ?? [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function fetchStatsTopLists(
  range: StatsPlaysRange = '30',
  dimension: StatsTopListDimension = 'type',
  sort: StatsTopListSort = 'desc',
): Promise<{
  data: StatsTopListBucket[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [
        {
          bucket: 'TRACK',
          entries: [
            {
              soundId: 'arch-mock-1',
              listens: 420,
              title: 'Northern Lights — Live Set',
              contentType: 'TRACK',
              genre: 'Electronic',
            },
          ],
        },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  const period =
    range === '7' ? 'week' : range === 'all' ? 'all_time' : 'month';
  try {
    const { data } = await requestJson<{ buckets: StatsTopListBucket[] }>(
      `/api/me/stats/top-lists?period=${period}&dimension=${dimension}&sort=${sort}`,
    );
    return { data: data.buckets ?? [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export type StatsPlaysRange = '1' | '7' | '30' | 'all' | 'custom';

export type StatsPlaysDay = {
  date: string;
  plays: number;
};

export type StatsPlaysCountry = {
  countryCode: string;
  displayName: string;
  count: number;
};

export type StatsPlays = {
  totalPlays: number;
  totalDownloads: number;
  totalSmartLinkClicks?: number;
  daily: StatsPlaysDay[];
  downloadCountries?: StatsPlaysCountry[];
};

export type StatsPlaysQuery = {
  range?: StatsPlaysRange;
  from?: string;
  to?: string;
};

export type ListenerGeoPeriod = '7d' | '30d' | 'all';

export type ListenerGeoPoint = {
  countryCode: string;
  displayName: string;
  count: number;
};

export type ChannelEgressStats = {
  windowDays: number;
  liveHlsBytes: number;
  estimatedLiveHlsBytes: number;
};

export type ChannelLiveStats = {
  windowDays: number;
  totalLiveSeconds: number;
  totalBroadcasts: number;
  peakDailyListeners: number;
};

function mockDaily(days: number): StatsPlaysDay[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    return {
      date: d.toISOString().slice(0, 10),
      plays: 20 + ((i * 17) % 80),
    };
  });
}

function mockDailyBetween(from: string, to: string): StatsPlaysDay[] {
  const start = new Date(`${from}T12:00:00Z`);
  const end = new Date(`${to}T12:00:00Z`);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return [];
  }
  const days: StatsPlaysDay[] = [];
  let i = 0;
  for (
    let cursor = new Date(start);
    cursor <= end;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    days.push({
      date: cursor.toISOString().slice(0, 10),
      plays: 20 + ((i * 17) % 80),
    });
    i += 1;
  }
  return days;
}

export async function fetchStatsPlays(
  rangeOrQuery: StatsPlaysRange | StatsPlaysQuery = '30',
): Promise<{
  data: StatsPlays;
  meta: FetchMeta;
}> {
  const query: StatsPlaysQuery =
    typeof rangeOrQuery === 'string' ? { range: rangeOrQuery } : rangeOrQuery;
  const range = query.range ?? '30';

  if (isForceMock()) {
    const daily =
      range === 'custom' && query.from && query.to
        ? mockDailyBetween(query.from, query.to)
        : mockDaily(
            range === '1' ? 1 : range === '7' ? 7 : range === '30' ? 30 : 90,
          );
    return {
      data: {
        totalPlays: daily.reduce((sum, day) => sum + day.plays, 0),
        totalDownloads: 120,
        totalSmartLinkClicks: 45,
        daily,
        downloadCountries: [
          { countryCode: 'FI', displayName: 'Finland', count: 80 },
          { countryCode: 'DE', displayName: 'Germany', count: 25 },
        ],
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const params = new URLSearchParams();
    if (range === 'custom' && query.from && query.to) {
      params.set('range', 'all');
      params.set('from', query.from);
      params.set('to', query.to);
    } else {
      params.set('range', range === 'custom' ? '30' : range);
    }
    const { data } = await requestJson<StatsPlays>(
      `/api/me/stats/plays?${params.toString()}`,
    );
    return {
      data: {
        totalPlays: data.totalPlays ?? 0,
        totalDownloads: data.totalDownloads ?? 0,
        totalSmartLinkClicks: data.totalSmartLinkClicks,
        daily: data.daily ?? [],
        downloadCountries: data.downloadCountries,
      },
      meta: { source: 'api' },
    };
  } catch (err) {
    return {
      data: {
        totalPlays: 0,
        totalDownloads: 0,
        daily: [],
        downloadCountries: [],
      },
      meta: failMeta(err),
    };
  }
}

/** Hourly play counts for a UTC day (downloads + smart-link clicks). */
export async function fetchStatsPlaysHourly(date: string): Promise<{
  data: number[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    const seed = date.split('-').reduce((sum, part) => sum + Number(part), 0);
    const hours = Array.from({ length: 24 }, (_, hour) => {
      if (hour < 6) {
        return Math.max(0, (seed + hour) % 4);
      }
      return 4 + ((seed * (hour + 3)) % 28);
    });
    return {
      data: hours,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{
      date: string;
      hours: number[];
      totalPlays: number;
    }>(`/api/me/stats/plays/hourly?date=${encodeURIComponent(date)}`);
    const hours = Array.isArray(data.hours) ? data.hours : [];
    return {
      data:
        hours.length === 24
          ? hours
          : Array.from({ length: 24 }, (_, hour) => hours[hour] ?? 0),
      meta: { source: 'api' },
    };
  } catch (err) {
    return {
      data: Array.from({ length: 24 }, () => 0),
      meta: failMeta(err),
    };
  }
}

export async function fetchListenerGeo(
  period: ListenerGeoPeriod = '30d',
): Promise<{ data: ListenerGeoPoint[]; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: [
        { countryCode: 'FI', displayName: 'Finland', count: 180 },
        { countryCode: 'DE', displayName: 'Germany', count: 72 },
        { countryCode: 'US', displayName: 'United States', count: 54 },
        { countryCode: 'SE', displayName: 'Sweden', count: 41 },
        { countryCode: 'JP', displayName: 'Japan', count: 19 },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{
      period: ListenerGeoPeriod;
      geo: ListenerGeoPoint[];
    }>(`/api/me/listener-geo?period=${period}`);
    return { data: data.geo ?? [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function fetchChannelEgressStats(): Promise<{
  data: ChannelEgressStats;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: {
        windowDays: 30,
        liveHlsBytes: 9_331_200_000,
        estimatedLiveHlsBytes: 0,
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ChannelEgressStats>(
      '/api/me/channel-egress',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: { windowDays: 30, liveHlsBytes: 0, estimatedLiveHlsBytes: 0 },
      meta: failMeta(err),
    };
  }
}

export async function fetchChannelLiveStats(): Promise<{
  data: ChannelLiveStats;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: {
        windowDays: 14,
        totalLiveSeconds: 43_200,
        totalBroadcasts: 6,
        peakDailyListeners: 38,
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ChannelLiveStats>(
      '/api/me/channel-live-stats',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: {
        windowDays: 14,
        totalLiveSeconds: 0,
        totalBroadcasts: 0,
        peakDailyListeners: 0,
      },
      meta: failMeta(err),
    };
  }
}

// ── Profile / channel settings lite ─────────────────────────────────────────

export type ProfileFields = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  /** Optional longer-form history, shown expanded below the short bio. */
  fullBio?: string | null;
  avatarUrl?: string | null;
  tipJarUrl: string | null;
  pronouns: string | null;
  chatEnabled: boolean;
  freeSubscriptionsEnabled: boolean;
  artistKind?: 'SINGLE' | 'COLLECTIVE';
  /** ISO 3166-1 alpha-2, e.g. 'FI'. */
  countryCode?: string | null;
  defaultLocation?: string | null;
  showJoinDate?: boolean;
  showFollowers?: boolean;
  showFollowing?: boolean;
  showDailyListeners?: boolean;
  /** Handles for cross-posting/import sources — e.g. { hearthisAt: 'myhandle' }. */
  socialLinks?: Record<string, string> | null;
};

let mockProfile: ProfileFields = {
  id: 'user-mock',
  username: 'demo',
  displayName: 'Demo Artist',
  bio: 'Mock bio for Nuclear studio channel settings.',
  fullBio: null,
  avatarUrl: null,
  tipJarUrl: null,
  pronouns: null,
  chatEnabled: true,
  freeSubscriptionsEnabled: true,
  artistKind: 'SINGLE',
  countryCode: null,
  defaultLocation: null,
  showJoinDate: true,
  showFollowers: true,
  showFollowing: true,
  showDailyListeners: true,
  socialLinks: {},
};

export async function fetchMeProfile(): Promise<{
  data: ProfileFields;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: { ...mockProfile },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ProfileFields>('/api/me/profile');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return {
        data: { ...mockProfile, username: 'unknown' },
        meta: failMeta(err),
      };
    }
    return {
      data: {
        id: '',
        username: 'unknown',
        displayName: '',
        bio: '',
        fullBio: null,
        avatarUrl: null,
        tipJarUrl: null,
        pronouns: null,
        chatEnabled: false,
        freeSubscriptionsEnabled: false,
        artistKind: 'SINGLE',
        countryCode: null,
        defaultLocation: null,
        showJoinDate: false,
        showFollowers: false,
        showFollowing: false,
        showDailyListeners: false,
        socialLinks: {},
      },
      meta: apiErrorMeta(err),
    };
  }
}

export async function patchMeProfile(
  patch: Partial<
    Pick<
      ProfileFields,
      | 'displayName'
      | 'bio'
      | 'fullBio'
      | 'tipJarUrl'
      | 'pronouns'
      | 'chatEnabled'
      | 'freeSubscriptionsEnabled'
      | 'artistKind'
      | 'countryCode'
      | 'defaultLocation'
      | 'showJoinDate'
      | 'showFollowers'
      | 'showFollowing'
      | 'showDailyListeners'
      | 'socialLinks'
    >
  >,
): Promise<{ ok: true; data: ProfileFields } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockProfile = { ...mockProfile, ...patch };
    if (patch.freeSubscriptionsEnabled !== undefined) {
      setMockFreeSubscriptionsEnabled(
        mockProfile.username,
        patch.freeSubscriptionsEnabled,
      );
    }
    return { ok: true, data: { ...mockProfile } };
  }
  try {
    const { data } = await requestJson<ProfileFields>('/api/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

// ── Posts + newsletter ──────────────────────────────────────────────────────

export type ArtistPost = {
  id: string;
  title: string | null;
  body: string;
  linkUrl: string | null;
  linkLabel: string | null;
  images: string[];
  publishAt: string;
  createdAt: string;
};

export type NewsletterDraft = {
  id: string;
  subject: string;
  bodyMd?: string;
  state?: string;
  subscribersOnly?: boolean;
  createdAt?: string;
  sentAt?: string | null;
};

let mockPosts: ArtistPost[] = [
  {
    id: 'post-mock-1',
    title: 'New set up',
    body: 'Archive just dropped — listen on the channel.',
    linkUrl: null,
    linkLabel: null,
    images: [],
    publishAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

let mockDrafts: NewsletterDraft[] = [
  {
    id: 'nl-mock-1',
    subject: 'This week on the channel',
    bodyMd: 'Thanks for tuning in.',
    state: 'DRAFT',
    subscribersOnly: false,
    createdAt: new Date().toISOString(),
    sentAt: null,
  },
];

export async function fetchArtistPosts(): Promise<{
  data: ArtistPost[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockPosts.map((post) => ({ ...post, images: [...post.images] })),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ArtistPost[]>('/api/me/posts');
    return {
      data: Array.isArray(data)
        ? data.map((post) => ({ ...post, images: post.images ?? [] }))
        : [],
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function fetchChannelPosts(slug: string): Promise<{
  data: ArtistPost[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockPosts.map((post) => ({ ...post, images: [...post.images] })),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ArtistPost[]>(
      `/api/channels/${encodeURIComponent(slug)}/posts`,
    );
    return {
      data: Array.isArray(data)
        ? data.map((post) => ({ ...post, images: post.images ?? [] }))
        : [],
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function createArtistPost(input: {
  title?: string;
  body: string;
  linkUrl?: string;
}): Promise<{ ok: true; data: ArtistPost } | { ok: false; error: string }> {
  if (isForceMock()) {
    const row: ArtistPost = {
      id: `post-mock-${Date.now()}`,
      title: input.title ?? null,
      body: input.body,
      linkUrl: input.linkUrl ?? null,
      linkLabel: null,
      images: [],
      publishAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    mockPosts = [row, ...mockPosts];
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<ArtistPost>('/api/me/posts', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return { ok: true, data: { ...data, images: data.images ?? [] } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Create failed',
    };
  }
}

export async function uploadArtistPostImage(
  postId: string,
  file: File,
): Promise<{ ok: true; data: ArtistPost } | { ok: false; error: string }> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { ok: false, error: 'Choose a JPEG, PNG, or WebP image.' };
  }
  if (isForceMock()) {
    const imageUrl = URL.createObjectURL(file);
    const current = mockPosts.find((post) => post.id === postId);
    if (!current) {
      return { ok: false, error: 'Post not found.' };
    }
    const data = { ...current, images: [...current.images, imageUrl] };
    mockPosts = mockPosts.map((post) => (post.id === postId ? data : post));
    return { ok: true, data };
  }
  try {
    const prepared = await requestJson<{
      uploadKey: string;
      uploadUrl: string;
    }>(`/api/me/posts/${encodeURIComponent(postId)}/images/prepare`, {
      method: 'POST',
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });
    const upload = await fetch(prepared.data.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!upload.ok) {
      throw new Error(`Image upload failed (${upload.status})`);
    }
    const { data } = await requestJson<ArtistPost>(
      `/api/me/posts/${encodeURIComponent(postId)}/images/complete`,
      {
        method: 'POST',
        body: JSON.stringify({ uploadKey: prepared.data.uploadKey }),
      },
    );
    return { ok: true, data: { ...data, images: data.images ?? [] } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Image upload failed',
    };
  }
}

export async function deleteArtistPost(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockPosts = mockPosts.filter((p) => p.id !== id);
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/posts/${encodeURIComponent(id)}`, {
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

export async function fetchNewsletterDrafts(): Promise<{
  data: NewsletterDraft[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [...mockDrafts],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<
      | NewsletterDraft[]
      | { drafts: NewsletterDraft[]; page?: number; total?: number }
    >('/api/me/newsletter/drafts?page=1&limit=50');
    const list = Array.isArray(data) ? data : (data.drafts ?? []);
    return { data: list, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function sendNewsletterDraft(
  draftId: string,
  audience?: 'all' | 'fans',
): Promise<{ ok: true; queued?: number } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockDrafts = mockDrafts.map((d) =>
      d.id === draftId
        ? { ...d, state: 'SENT', sentAt: new Date().toISOString() }
        : d,
    );
    return { ok: true, queued: 3 };
  }
  try {
    const { data } = await requestJson<{ queued?: number; ok?: boolean }>(
      `/api/me/newsletter/send/${encodeURIComponent(draftId)}`,
      { method: 'POST', body: JSON.stringify({ audience }) },
    );
    return { ok: true, queued: data.queued };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Send failed',
    };
  }
}

export async function createNewsletterDraft(input: {
  subject: string;
  bodyMd: string;
  subscribersOnly?: boolean;
}): Promise<
  { ok: true; data: NewsletterDraft } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const row: NewsletterDraft = {
      id: `nl-mock-${Date.now()}`,
      subject: input.subject,
      bodyMd: input.bodyMd,
      state: 'DRAFT',
      subscribersOnly: input.subscribersOnly ?? false,
      createdAt: new Date().toISOString(),
      sentAt: null,
    };
    mockDrafts = [row, ...mockDrafts];
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<NewsletterDraft>(
      '/api/me/newsletter/drafts',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Create failed',
    };
  }
}

/** Fire-and-forget emoji reaction (no auth required on Tahti). */
export async function postChatReaction(
  slug: string,
  emoji: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await requestJson(`/api/chat/${encodeURIComponent(slug)}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'React failed',
    };
  }
}
