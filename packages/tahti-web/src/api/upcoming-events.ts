import type { FetchMeta } from './client';
import { isForceMock } from './mode';
import { requestJson } from './request-json';

/** One row of `GET /api/v1/events/upcoming`: an artist event plus who
 * plays it. */
export type UpcomingEvent = {
  id: string;
  title: string;
  description: string | null;
  place: string;
  location: string;
  eventUrl: string | null;
  startAt: string;
  artistDisplayName: string;
  artistUsername: string;
  channelSlug: string | null;
  avatarUrl: string | null;
};

const DAY = 24 * 60 * 60 * 1000;

function mockUpcoming(): UpcomingEvent[] {
  const at = (days: number) => new Date(Date.now() + days * DAY).toISOString();
  return [
    {
      id: 'up-mock-1',
      title: 'Album release show',
      description: null,
      place: 'Kuudes Linja',
      location: 'Helsinki',
      eventUrl: null,
      startAt: at(3),
      artistDisplayName: 'Northern Lights',
      artistUsername: 'northern-lights',
      channelSlug: 'northern-lights',
      avatarUrl: null,
    },
    {
      id: 'up-mock-2',
      title: 'Late-night broadcast + open studio',
      description: null,
      place: 'Ääniwalli',
      location: 'Helsinki',
      eventUrl: null,
      startAt: at(8),
      artistDisplayName: 'Demo Artist',
      artistUsername: 'demo',
      channelSlug: 'demo',
      avatarUrl: null,
    },
  ];
}

/** Upcoming events across all artists, soonest first (front page). */
export async function fetchUpcomingEvents(limit = 12): Promise<{
  data: UpcomingEvent[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockUpcoming(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<UpcomingEvent[]>(
      `/api/v1/events/upcoming?limit=${limit}`,
    );
    return { data: Array.isArray(data) ? data : [], meta: { source: 'api' } };
  } catch (err) {
    return {
      data: [],
      meta: {
        source: 'api',
        reason: err instanceof Error ? err.message : 'fetch failed',
      },
    };
  }
}
