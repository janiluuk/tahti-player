// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../../api/admin';
import { FanSubPayoutQueue } from './FanSubPayoutQueue';

const PAYOUT: admin.AdminFanSubPayout = {
  id: 'p1',
  state: 'FAILED',
  artistUserId: 'u1',
  artistDisplayName: 'DJ Moonlight',
  artistUsername: 'dj-moonlight',
  subscriberDisplayName: 'Listener One',
  subscriberUsername: 'listener-one',
  netToArtistCents: 4200,
  grossCents: 5000,
  forPeriodStart: '2026-08-01T00:00:00.000Z',
  forPeriodEnd: '2026-09-01T00:00:00.000Z',
  stripeTransferId: null,
  paidAt: null,
  createdAt: '2026-09-01T06:00:00.000Z',
};

async function renderQueue(onChanged = vi.fn()) {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <FanSubPayoutQueue onChanged={onChanged} />,
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return onChanged;
}

describe('FanSubPayoutQueue', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('retries a failed payout and refreshes the queue and the totals', async () => {
    const fetch = vi.spyOn(admin, 'fetchFanSubPayouts').mockResolvedValue({
      data: { payouts: [PAYOUT], total: 1 },
      meta: { source: 'api' },
    });
    const retry = vi
      .spyOn(admin, 'retryFanSubPayout')
      .mockResolvedValue({ ok: true });
    const onChanged = await renderQueue();

    expect(await screen.findByText('DJ Moonlight')).toBeTruthy();
    expect(screen.getByText('Failed')).toBeTruthy();
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Retry payout to DJ Moonlight' }),
      );
    });
    expect(retry).toHaveBeenCalledWith('p1');
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(onChanged).toHaveBeenCalled();
  });

  it('offers no retry for a pending payout and shows a refusal', async () => {
    vi.spyOn(admin, 'fetchFanSubPayouts').mockResolvedValue({
      data: {
        payouts: [PAYOUT, { ...PAYOUT, id: 'p2', state: 'PENDING' }],
        total: 2,
      },
      meta: { source: 'api' },
    });
    vi.spyOn(admin, 'retryFanSubPayout').mockResolvedValue({
      ok: false,
      error: 'Only FAILED payouts can be retried',
    });
    await renderQueue();

    expect(await screen.findByText('Pending')).toBeTruthy();
    expect(
      screen.getAllByRole('button', { name: /Retry payout/ }),
    ).toHaveLength(1);
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Retry payout to DJ Moonlight' }),
      );
    });
    expect(screen.getByRole('alert').textContent).toBe(
      'Only FAILED payouts can be retried',
    );
  });
});
