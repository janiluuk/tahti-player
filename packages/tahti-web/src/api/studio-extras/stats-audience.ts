import type { FetchMeta } from '.././client';
import { failMeta, isForceMock } from '.././mode';
import { requestJson } from '.././request-json';
import type { StatsPlaysRange } from './stats-plays';

export type StatsShare = { name: string; count: number; share: number };

export type StatsAudienceDimension =
  'browser' | 'os' | 'deviceType' | 'deviceVendor' | 'source';

export type StatsAudience = {
  dimension: StatsAudienceDimension;
  total: number;
  minBucket: number;
  items: StatsShare[];
};

export type StatsAudienceWindow = {
  range: StatsPlaysRange;
  from?: string;
  to?: string;
  soundId?: string;
  includeBots?: boolean;
};

export function statsWindowParams(
  window: StatsAudienceWindow,
): URLSearchParams {
  const params = new URLSearchParams();
  if (window.range === 'custom' && window.from && window.to) {
    params.set('range', 'all');
    params.set('from', window.from);
    params.set('to', window.to);
  } else {
    params.set('range', window.range === 'custom' ? '30' : window.range);
  }
  if (window.soundId) {
    params.set('soundId', window.soundId);
  }
  if (window.includeBots) {
    params.set('includeBots', 'true');
  }
  return params;
}

const MOCK_AUDIENCE: Record<StatsAudienceDimension, [string, number][]> = {
  browser: [
    ['Chrome', 412],
    ['Mobile Safari', 236],
    ['Firefox', 98],
    ['Samsung Internet', 41],
    ['Other', 33],
  ],
  os: [
    ['Android 15', 214],
    ['iOS 18', 198],
    ['Windows 10', 176],
    ['macOS 10.15', 121],
    ['GNU/Linux', 58],
    ['Other', 53],
  ],
  deviceType: [
    ['Smartphone', 452],
    ['Desktop', 331],
    ['Tablet', 37],
  ],
  deviceVendor: [
    ['Apple', 344],
    ['Unknown', 214],
    ['Samsung', 152],
    ['Google', 61],
    ['Other', 49],
  ],
  source: [
    ['Direct', 501],
    ['instagram.com', 142],
    ['google.com', 88],
    ['bandcamp.com', 51],
    ['Other', 38],
  ],
};

export function mockStatsAudience(
  dimension: StatsAudienceDimension,
): StatsAudience {
  const rows = MOCK_AUDIENCE[dimension];
  const total = rows.reduce((sum, [, count]) => sum + count, 0);
  return {
    dimension,
    total,
    minBucket: 5,
    items: rows.map(([name, count]) => ({
      name,
      count,
      share: Math.round((count / total) * 10_000) / 10_000,
    })),
  };
}

export async function fetchStatsAudience(
  dimension: StatsAudienceDimension,
  window: StatsAudienceWindow,
): Promise<{ data: StatsAudience; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: mockStatsAudience(dimension),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  const params = statsWindowParams(window);
  params.set('dimension', dimension);
  try {
    const { data } = await requestJson<StatsAudience>(
      `/api/me/stats/audience?${params.toString()}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: { dimension, total: 0, minBucket: 5, items: [] },
      meta: failMeta(err),
    };
  }
}
