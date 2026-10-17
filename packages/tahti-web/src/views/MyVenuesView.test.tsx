import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthUser } from '../api/types';
import * as venuesManage from '../api/venues-manage';
import { useAuthStore } from '../stores/authStore';
import { renderWithRouter } from '../test/renderWithRouter';
import { MyVenuesView } from './MyVenuesView';

const owner = { id: 'u1', username: 'venue-owner' } as AuthUser;

const venue: venuesManage.MyVenue = {
  id: 'v1',
  slug: 'kuudes-linja',
  name: 'Kuudes Linja',
  address: 'Hämeentie 13',
  city: 'Helsinki',
  countryCode: 'FI',
  description: null,
  capacity: 300,
  latitude: null,
  longitude: null,
  externalLinks: null,
  photos: [],
  verifiedAt: '2026-06-01T00:00:00.000Z',
  broadcasts: [],
};

describe('MyVenuesView', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: owner });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('lists verified and waiting venues', async () => {
    vi.spyOn(venuesManage, 'fetchMyVenues').mockResolvedValue({
      data: [
        venue,
        {
          ...venue,
          id: 'v2',
          slug: 'new-club',
          name: 'New Club',
          verifiedAt: null,
        },
      ],
      meta: { source: 'api' },
    });
    await renderWithRouter(<MyVenuesView />);
    expect(await screen.findByText('Kuudes Linja')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Public page' })).toHaveAttribute(
      'href',
      '/v/kuudes-linja',
    );
    expect(
      screen.getByText('Waiting for board verification'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'It appears in the venue directory once the board has verified it.',
      ),
    ).toBeInTheDocument();
  });

  it('offers to register a venue when there are none', async () => {
    vi.spyOn(venuesManage, 'fetchMyVenues').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    await renderWithRouter(<MyVenuesView />);
    expect(await screen.findByText('No venues yet')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Register a venue' }),
    ).toHaveAttribute('href', '/venues/register');
  });

  it('says when the venues could not be loaded', async () => {
    vi.spyOn(venuesManage, 'fetchMyVenues').mockResolvedValue({
      data: [],
      meta: { source: 'mock', reason: 'HTTP 500' },
    });
    await renderWithRouter(<MyVenuesView />);
    expect(
      await screen.findByText('Could not load your venues'),
    ).toBeInTheDocument();
  });

  it('asks a visitor to sign in', async () => {
    useAuthStore.setState({ user: null });
    const fetchMine = vi.spyOn(venuesManage, 'fetchMyVenues');
    await renderWithRouter(<MyVenuesView />);
    expect(
      screen.getByText('Sign in to manage your venues'),
    ).toBeInTheDocument();
    expect(fetchMine).not.toHaveBeenCalled();
  });
});
