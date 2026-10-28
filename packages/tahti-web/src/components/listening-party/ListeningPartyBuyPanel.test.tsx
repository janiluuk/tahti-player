import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { checkoutPurchaseTier } from '../../api/purchase-tiers';
import { useAuthStore } from '../../stores/authStore';
import { testParty } from './__fixtures__/party';
import { ListeningPartyBuyPanel } from './ListeningPartyBuyPanel';

vi.mock('../../api/purchase-tiers', () => ({
  checkoutPurchaseTier: vi.fn(async () => ({ ok: true, activated: true })),
}));

const fan = {
  id: 'u2',
  email: 'fan@tahti.live',
  username: 'fan',
  displayName: 'Fan',
  role: 'LISTENER' as const,
  isMember: false,
};

describe('ListeningPartyBuyPanel', () => {
  afterEach(() => {
    cleanup();
    useAuthStore.setState({ user: null });
    vi.clearAllMocks();
  });

  it("checks out the host's tier through the artist checkout", async () => {
    useAuthStore.setState({ user: fan });
    render(<ListeningPartyBuyPanel party={testParty()} />);
    expect(screen.getByText('Digital album')).toBeTruthy();
    await userEvent.click(
      screen.getByRole('button', { name: 'Buy Digital album' }),
    );
    expect(checkoutPurchaseTier).toHaveBeenCalledWith('aino', 'tier1', {});
  });

  it('does not offer the host their own tiers', () => {
    useAuthStore.setState({ user: { ...fan, username: 'aino' } });
    render(<ListeningPartyBuyPanel party={testParty()} />);
    expect(screen.getByText('Digital album')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Buy/ })).toBeNull();
  });

  it('renders nothing without tiers', () => {
    render(<ListeningPartyBuyPanel party={testParty({ purchaseTiers: [] })} />);
    expect(screen.queryByRole('region', { name: 'Store' })).toBeNull();
  });
});
