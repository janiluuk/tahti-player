import type { FetchMeta } from '../client';
import { isForceMock } from '../mode';
import { requestJson } from '../request-json';

export type RecentSound = {
  id: string;
  title: string;
  durationSec: number | null;
  createdAt: string;
};

const failMeta = (err: unknown): FetchMeta => ({
  source: 'api',
  reason: err instanceof Error ? err.message : 'fetch failed',
});

/** The artist's newest uploads (`GET /api/me/sound/recent`, two rows). */
export async function fetchRecentSounds(): Promise<{
  data: RecentSound[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [
        {
          id: 'arch-1',
          title: 'Midnight Broadcast',
          durationSec: 3600,
          createdAt: '2026-10-18T20:00:00.000Z',
        },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<RecentSound[]>('/api/me/sound/recent');
    return { data: Array.isArray(data) ? data : [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

/** Fan-subscription income paid out this month
 * (`GET /api/me/fan-sub-payouts/summary`, the dashboard's slim read). */
export async function fetchFanPayoutSummary(): Promise<{
  data: { thisMonthNetCents: number } | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: { thisMonthNetCents: 1240 },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ thisMonthNetCents?: number }>(
      '/api/me/fan-sub-payouts/summary',
    );
    return {
      data: { thisMonthNetCents: data.thisMonthNetCents ?? 0 },
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}
