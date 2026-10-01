import { act, fireEvent, render, screen } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { startFanSubscriptionsPortal } from '../api/membership';
import { FanSubscriptionsBillingButton } from './FanSubscriptionsBillingButton';

vi.mock('../api/membership', () => ({
  startFanSubscriptionsPortal: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('FanSubscriptionsBillingButton', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('opens the Stripe portal the API returns', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });
    vi.mocked(startFanSubscriptionsPortal).mockResolvedValue({
      ok: true,
      portalUrl: 'https://billing.stripe.com/session/abc',
    });
    render(<FanSubscriptionsBillingButton />);
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: /Payment method and receipts/ }),
      );
    });
    expect(assign).toHaveBeenCalledWith(
      'https://billing.stripe.com/session/abc',
    );
  });

  it("shows the API's reason when the portal can't open", async () => {
    vi.mocked(startFanSubscriptionsPortal).mockResolvedValue({
      ok: false,
      error: 'No active fan subscriptions',
    });
    render(<FanSubscriptionsBillingButton />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(toast.error).toHaveBeenCalledWith('No active fan subscriptions');
    expect(
      screen.getByRole('button', { name: /Payment method and receipts/ }),
    ).toHaveProperty('disabled', false);
  });
});
