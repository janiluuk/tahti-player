// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as distribution from '../../api/distribution';
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
      data: {
        activeSubscribers: 0,
        thisMonthNetCents: 0,
        paidYtdNetCents: 0,
        pending: 0,
        failed: 0,
        paidLast30Days: 0,
        recent: [],
      },
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

  it('links Memberships and Store from Earnings instead of embedding tiers', async () => {
    await renderWithRouter(<StudioRevenueView />);
    expect(
      await screen.findByRole('link', { name: /membership|tier|open tiers/i }),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: /store/i })).toBeTruthy();
    expect(screen.queryByTestId('settings-moved-notice')).toBeNull();
    expect(screen.queryByTestId('fan-subs-empty-state')).toBeNull();
  });

  it('keeps Stripe when Connect is ready', async () => {
    await renderWithRouter(<StudioRevenueView />);
    expect(
      await screen.findByRole('link', { name: /stripe dashboard/i }),
    ).toBeTruthy();
  });
});
