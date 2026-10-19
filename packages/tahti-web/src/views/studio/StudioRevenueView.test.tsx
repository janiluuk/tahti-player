// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as distribution from '../../api/distribution';
import * as fanTiers from '../../api/fan-tiers';
import * as revenue from '../../api/revenue';
import { useAuthStore } from '../../stores/authStore';
import { renderWithRouter } from '../../test/renderWithRouter';
import { StudioRevenueView } from './StudioRevenueView';

const meta = { source: 'api' as const };

describe('StudioRevenueView', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        email: 'artist@tahti.live',
        username: 'artist',
        displayName: 'An Artist',
        role: 'ARTIST',
        isBoard: false,
        isMember: true,
        channel: { slug: 'artist', state: 'OFFLINE' },
      },
      hydrated: true,
      loading: false,
      profileLoaded: true,
    });
    vi.spyOn(revenue, 'fetchFanConnectStatus').mockResolvedValue({
      data: { stripeConfigured: true, paymentsReady: true },
      meta,
    } as never);
    vi.spyOn(revenue, 'fetchFanPayoutStats').mockResolvedValue({
      data: { recent: [] },
      meta,
    } as never);
    vi.spyOn(revenue, 'fetchMyGrants').mockResolvedValue({
      data: [],
      meta,
    } as never);
    vi.spyOn(revenue, 'fetchGrantEstimate').mockResolvedValue({
      data: null,
      meta,
    } as never);
    vi.spyOn(distribution, 'fetchAllRoyalties').mockResolvedValue({
      data: [],
      meta,
    } as never);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
  });

  it('says the fan tiers failed to load instead of "No fan subscriptions yet"', async () => {
    const fetch = vi.spyOn(fanTiers, 'fetchMyFanTiers').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await renderWithRouter(<StudioRevenueView />);
    expect(
      await screen.findByText('Could not load your fan tiers'),
    ).toBeTruthy();
    expect(screen.queryByText('No fan subscriptions yet')).toBeNull();

    fetch.mockResolvedValue({ data: [], meta });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No fan subscriptions yet')).toBeTruthy();
  });
});
