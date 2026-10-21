import type { FetchMeta } from '.././client';
import { failMeta, isForceMock } from '.././mode';
import { requestJson } from '.././request-json';

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

export function mockDaily(days: number): StatsPlaysDay[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    return {
      date: d.toISOString().slice(0, 10),
      plays: 20 + ((i * 17) % 80),
    };
  });
}

export function mockDailyBetween(from: string, to: string): StatsPlaysDay[] {
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
