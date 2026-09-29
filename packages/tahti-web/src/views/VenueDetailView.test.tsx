// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import type { VenueProfile } from '../api/types';
import { VenueDetailView } from './VenueDetailView';

const VENUE: VenueProfile = {
  id: 'v1',
  slug: 'kaiku',
  name: 'Kaiku',
  city: 'Helsinki',
  countryCode: 'FI',
  capacity: 400,
  description: 'Club in Kallio.',
  photos: [],
  address: 'Kaikukatu 4, Helsinki',
  latitude: null,
  longitude: null,
  broadcasts: [
    {
      id: 'b1',
      startAt: '2026-10-03T20:00:00.000Z',
      endAt: '2026-10-03T23:00:00.000Z',
      description: 'Northern Signals live',
    },
  ],
};

async function renderVenue(slug = 'kaiku') {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <VenueDetailView slug={slug} />,
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

describe('venueCalendarFeedUrl', () => {
  it('builds an absolute feed URL for calendar apps', () => {
    expect(
      client.venueCalendarFeedUrl('kaiku', 'https://beta.tahti.live'),
    ).toBe(
      'https://beta.tahti.live/tahti-api/api/v1/venues/kaiku/calendar.ics',
    );
  });
});

describe('VenueDetailView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('loads just this venue and lists its upcoming shows with a calendar feed', async () => {
    const fetchProfile = vi
      .spyOn(client, 'fetchVenueProfile')
      .mockResolvedValue({ data: VENUE, meta: { source: 'api' } });
    const fetchDirectory = vi.spyOn(client, 'fetchVenues');

    await renderVenue();

    expect(fetchProfile).toHaveBeenCalledWith('kaiku');
    expect(fetchDirectory).not.toHaveBeenCalled();
    expect(screen.getByText('Kaikukatu 4, Helsinki')).toBeTruthy();
    expect(screen.getByText('Northern Signals live')).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'Add to calendar' })
        .getAttribute('href'),
    ).toMatch(/\/api\/v1\/venues\/kaiku\/calendar\.ics$/);
  });

  it('says when nothing is booked and when the venue is missing', async () => {
    vi.spyOn(client, 'fetchVenueProfile').mockResolvedValueOnce({
      data: { ...VENUE, broadcasts: [] },
      meta: { source: 'api' },
    });
    await renderVenue();
    expect(screen.getByText('No shows booked here yet.')).toBeTruthy();
    cleanup();

    vi.spyOn(client, 'fetchVenueProfile').mockResolvedValueOnce({
      data: null,
      meta: { source: 'api' },
    });
    await renderVenue('nope');
    expect(screen.getByText('Venue not found')).toBeTruthy();
  });
});
