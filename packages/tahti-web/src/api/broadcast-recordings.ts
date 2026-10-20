import type { FetchMeta } from './client';
import {
  allowMockFallback,
  apiErrorMeta,
  isForceMock,
  mockFallbackMeta,
} from './mode';
import { requestJson } from './request-json';

export type RecentBroadcast = {
  id: string;
  title?: string | null;
  source?: string;
  startedAt: string;
  endedAt?: string | null;
  soundId: string | null;
  soundTitle?: string;
  soundStatus?: string;
  durationSec?: number;
};

const mockRecordings: RecentBroadcast[] = [
  {
    id: 'rec-1',
    title: 'Friday night set',
    source: 'RTMP',
    startedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    endedAt: new Date(Date.now() - 2 * 86_400_000 + 3600_000).toISOString(),
    soundId: 'arc-1',
    soundTitle: 'Friday night set',
    soundStatus: 'READY',
    durationSec: 3600,
  },
  {
    id: 'rec-2',
    title: null,
    source: 'BROWSER',
    startedAt: new Date(Date.now() - 6 * 86_400_000).toISOString(),
    endedAt: new Date(Date.now() - 6 * 86_400_000 + 1800_000).toISOString(),
    soundId: null,
    durationSec: 1800,
  },
];

export async function fetchRecentBroadcasts(
  limit = 50,
): Promise<{ data: RecentBroadcast[]; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: mockRecordings,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ broadcasts?: RecentBroadcast[] }>(
      `/api/me/broadcasts/recent?limit=${limit}`,
    );
    return { data: data.broadcasts ?? [], meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockRecordings, meta: mockFallbackMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}
