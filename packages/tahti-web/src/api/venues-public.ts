import { getJson, requestJson } from './client-request';
import { apiBase } from './http';
import { mockVenueProfile, mockVenues } from './mock';
import { getMockSessionUser } from './mock-session';
import {
  allowMockFallback,
  isForceMock,
  withMockFallback,
  type FetchMeta,
} from './mode';
import type { VenueDirectoryItem, VenueProfile } from './types';

export async function fetchVenues(): Promise<{
  data: VenueDirectoryItem[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockVenues(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<VenueDirectoryItem[]>('/api/v1/venues');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(
      err,
      allowMockFallback() ? mockVenues : null,
      () => [],
    );
  }
}

export async function fetchVenueProfile(slug: string): Promise<{
  data: VenueProfile | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockVenueProfile(slug),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<VenueProfile>(
      `/api/v1/venues/${encodeURIComponent(slug)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(
      err,
      allowMockFallback() ? () => mockVenueProfile(slug) : null,
      () => null,
    );
  }
}

export function venueCalendarFeedUrl(
  slug: string,
  origin = typeof window === 'undefined' ? '' : window.location.origin,
): string {
  const path = `${apiBase()}/api/v1/venues/${encodeURIComponent(slug)}/calendar.ics`;
  return /^https?:\/\//.test(path) || !origin ? path : `${origin}${path}`;
}

export type RegisterVenueInput = {
  slug: string;
  name: string;
  address: string;
  city: string;
  countryCode?: string;
  capacity?: number;
  description?: string;
  imageUrl?: string;
  coverUrl?: string;
  pageUrl?: string;
};

export async function registerVenue(
  input: RegisterVenueInput,
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  if (isForceMock()) {
    if (!getMockSessionUser()) {
      return { ok: false, error: 'Log in first to register a venue.' };
    }
    if (input.slug.length < 2) {
      return { ok: false, error: 'Slug too short' };
    }
    if (input.slug === 'taken') {
      return { ok: false, error: 'Slug already taken' };
    }
    return { ok: true, slug: input.slug };
  }
  try {
    const { data } = await requestJson<{ slug: string }>('/api/v1/venues', {
      method: 'POST',
      body: JSON.stringify({
        slug: input.slug,
        name: input.name,
        address: input.address,
        city: input.city,
        countryCode: input.countryCode || 'FI',
        ...(input.capacity != null && Number.isFinite(input.capacity)
          ? { capacity: input.capacity }
          : {}),
        ...(input.description ? { description: input.description } : {}),
        ...(input.imageUrl || input.coverUrl
          ? { photos: [input.imageUrl ?? '', input.coverUrl ?? ''] }
          : {}),
        ...(input.pageUrl ? { externalLinks: { website: input.pageUrl } } : {}),
      }),
    });
    return { ok: true, slug: data.slug ?? input.slug };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Registration failed',
    };
  }
}
