// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as client from '../../../api/client';
import type { FanSubscriptionRow, PurchaseRow } from '../../../api/types';
import {
  AccountBillingPanel,
  activeSubscriptions,
} from './AccountBillingPanel';

const artist = { username: 'aurora', displayName: 'Aurora Drift' };

const subscriptions: FanSubscriptionRow[] = [
  {
    id: 's1',
    tierName: 'Supporter',
    amountCents: 500,
    state: 'ACTIVE',
    artist,
  },
  {
    id: 's2',
    tierName: 'Backstage',
    amountCents: 1200,
    state: 'ACTIVE',
    canceledAt: '2026-11-01T00:00:00.000Z',
    currentPeriodEnd: '2026-12-01T00:00:00.000Z',
    artist,
  },
];

const purchases: PurchaseRow[] = [
  {
    id: 'p1',
    tierName: 'Single',
    amountCents: 300,
    createdAt: '2026-10-01T00:00:00.000Z',
    artist,
    tracks: [{ id: 't1', title: 'Night Swim' }],
  },
  {
    id: 'p2',
    tierName: 'Album',
    amountCents: 950,
    createdAt: '2026-10-02T00:00:00.000Z',
    artist,
    tracks: [],
  },
];

async function renderPanel() {
  vi.spyOn(client, 'fetchMySubscriptions').mockResolvedValue({
    data: subscriptions,
    meta: { source: 'api' },
  });
  vi.spyOn(client, 'fetchMyPurchases').mockResolvedValue({
    data: purchases,
    meta: { source: 'api' },
  });
  const router = createRouter({
    routeTree: createRootRoute({ component: () => <AccountBillingPanel /> }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('AccountBillingPanel', () => {
  it('sums active subscriptions and purchases in the summary tiles', async () => {
    await renderPanel();

    const summary = await screen.findByTestId('account-billing-summary');
    expect(summary).toHaveTextContent('Active subs1');
    expect(summary).toHaveTextContent('Monthly€5');
    expect(summary).toHaveTextContent('Purchases2');
    expect(summary).toHaveTextContent('Spent€12.50');
  });

  it('lists subscriptions with status pills and purchases on one page', async () => {
    await renderPanel();

    const subs = await screen.findAllByTestId('account-subscription');
    expect(subs).toHaveLength(2);
    expect(within(subs[0]!).getByText('ACTIVE')).toBeInTheDocument();
    expect(within(subs[0]!).getByText('Supporter · €5/mo')).toBeInTheDocument();
    const bought = screen.getAllByTestId('account-purchase');
    expect(bought).toHaveLength(2);
    expect(within(bought[0]!).getByText('Night Swim')).toBeInTheDocument();
    expect(within(bought[1]!).getByText('Album')).toBeInTheDocument();
    expect(within(bought[1]!).getByText('€9.50')).toBeInTheDocument();
  });
});

describe('activeSubscriptions', () => {
  it('leaves out subscriptions cancelled at period end', () => {
    expect(activeSubscriptions(subscriptions).map((row) => row.id)).toEqual([
      's1',
    ]);
  });
});
