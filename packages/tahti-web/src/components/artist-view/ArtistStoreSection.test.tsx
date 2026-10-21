// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as purchaseTiers from '../../api/purchase-tiers';
import { useAuthStore } from '../../stores/authStore';
import { ArtistStoreSection } from './ArtistStoreSection';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const tiers: purchaseTiers.PublicStoreTier[] = [
  {
    id: 'tier-1',
    name: 'Album download',
    description: 'All tracks in FLAC',
    priceCents: 800,
    priceOptional: false,
  },
  {
    id: 'tier-2',
    name: 'Single',
    description: null,
    priceCents: 200,
    priceOptional: true,
  },
];

describe('ArtistStoreSection', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { username: 'fan', displayName: 'Fan' },
    } as never);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null } as never);
  });

  it('lists the active tiers with their prices', () => {
    render(
      <ArtistStoreSection
        username="aino"
        tiers={tiers}
        paymentsReady
        isOwner={false}
      />,
    );
    expect(screen.getByText('€8')).toBeTruthy();
    expect(screen.getByText('pay what you want (suggested €2)')).toBeTruthy();
    expect(screen.getByText('All tracks in FLAC')).toBeTruthy();
  });

  it('buys a pay-what-you-want tier at the amount typed', async () => {
    const checkout = vi
      .spyOn(purchaseTiers, 'checkoutPurchaseTier')
      .mockResolvedValue({ ok: true, activated: true });
    render(
      <ArtistStoreSection
        username="aino"
        tiers={tiers}
        paymentsReady
        isOwner={false}
      />,
    );
    fireEvent.change(screen.getByLabelText('Amount in euros for Single'), {
      target: { value: '3,50' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Buy Single' }));
    await vi.waitFor(() =>
      expect(checkout).toHaveBeenCalledWith('aino', 'tier-2', {
        amountCents: 350,
      }),
    );
  });

  it('hides the buy buttons until payouts are set up', () => {
    render(
      <ArtistStoreSection
        username="aino"
        tiers={tiers}
        paymentsReady={false}
        isOwner={false}
      />,
    );
    expect(screen.queryByRole('button', { name: /Buy/ })).toBeNull();
    expect(
      screen.getByText(
        'Purchases open once this artist finishes payouts setup.',
      ),
    ).toBeTruthy();
  });

  it('does not offer the owner their own tiers', () => {
    render(
      <ArtistStoreSection
        username="aino"
        tiers={tiers}
        paymentsReady
        isOwner
      />,
    );
    expect(screen.queryByRole('button', { name: /Buy/ })).toBeNull();
  });
});
