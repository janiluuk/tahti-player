import type { FetchMeta } from './client';

const forceMock = () => import.meta.env.VITE_FORCE_MOCK === '1';

const apiBase = () => {
  if (import.meta.env.VITE_TAHTI_API_URL?.startsWith('http')) {
    return import.meta.env.VITE_TAHTI_API_URL.replace(/\/$/, '');
  }
  return '/tahti-api';
};

async function requestJson<T>(
  path: string,
): Promise<{ data: T; status: number }> {
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
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
  return { data: (await res.json()) as T, status: res.status };
}

function failMeta(err: unknown): FetchMeta {
  return {
    source: 'mock',
    reason: err instanceof Error ? err.message : 'fetch failed',
  };
}

export type InsightsPeriod = '7d' | '30d' | 'all';

export type InsightsKind = 'sound' | 'release-tracks';

export type TrackInsights = {
  title: string;
  period: InsightsPeriod;
  totalDownloads: number;
  totalPlays: number;
  daily: Array<{ date: string; downloads: number }>;
  countries: Array<{
    countryCode: string;
    displayName: string;
    count: number;
  }>;
};

function mockInsights(period: InsightsPeriod, title: string): TrackInsights {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const daily = Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (Math.min(days, 30) - 1 - i));
    return {
      date: d.toISOString().slice(0, 10),
      downloads: Math.round(Math.random() * 12),
    };
  });
  const totalDownloads = daily.reduce((sum, d) => sum + d.downloads, 0);
  return {
    title,
    period,
    totalDownloads,
    totalPlays: totalDownloads * 6 + 40,
    daily,
    countries: [
      { countryCode: 'FI', displayName: 'Finland', count: 24 },
      { countryCode: 'DE', displayName: 'Germany', count: 11 },
      { countryCode: 'US', displayName: 'United States', count: 9 },
      { countryCode: 'SE', displayName: 'Sweden', count: 6 },
    ],
  };
}

const KIND_PATH: Record<InsightsKind, string> = {
  sound: '/api/me/sound',
  'release-tracks': '/api/me/release-tracks',
};

export async function fetchTrackInsights(
  kind: InsightsKind,
  id: string,
  period: InsightsPeriod = '30d',
): Promise<{ data: TrackInsights | null; meta: FetchMeta }> {
  if (forceMock()) {
    return {
      data: mockInsights(period, 'Mock track'),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<TrackInsights>(
      `${KIND_PATH[kind]}/${encodeURIComponent(id)}/insights?period=${period}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}
