import type { FetchMeta } from '.././client';
import { failMeta, isForceMock } from '.././mode';
import { requestJson } from '.././request-json';
import { type StatsPlaysRange } from './stats-plays';

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
