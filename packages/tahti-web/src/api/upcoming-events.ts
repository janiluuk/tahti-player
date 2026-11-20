import type { FetchMeta } from './client';
import { fetchEventCalendar } from './event-calendar';
import {
  normalizeEventGallery,
  type ArtistEventGalleryImage,
  type ArtistEventVenue,
} from './events';
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
  endAt?: string | null;
  timezone?: string | null;
  imageUrl?: string | null;
  venue?: ArtistEventVenue | null;
  gallery: ArtistEventGalleryImage[];
  artistDisplayName: string;
  artistUsername: string;
  channelSlug: string | null;
  avatarUrl: string | null;
};

const MOCK_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

async function mockUpcoming(limit: number): Promise<UpcomingEvent[]> {
  const now = new Date();
  const { data } = await fetchEventCalendar({
    from: now,
    to: new Date(now.getTime() + MOCK_WINDOW_MS),
  });
  return data
    .filter(
      (event) => event.status === 'PUBLISHED' && event.visibility === 'PUBLIC',
    )
    .slice(0, limit);
}

/** Upcoming events across all artists, soonest first (front page). */
export async function fetchUpcomingEvents(limit = 12): Promise<{
  data: UpcomingEvent[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: await mockUpcoming(limit),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<UpcomingEvent[]>(
      `/api/v1/events/upcoming?limit=${limit}`,
    );
    return {
      data: Array.isArray(data)
        ? data.map((row) => ({
            ...row,
            gallery: normalizeEventGallery(row.gallery),
          }))
        : [],
      meta: { source: 'api' },
    };
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
