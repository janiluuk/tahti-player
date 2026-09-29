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
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as purchaseTiers from '../api/purchase-tiers';
import { PurchaseOrdersList } from './PurchaseOrdersList';

function order(index: number): purchaseTiers.PurchaseOrderRow {
  return {
    id: `o${index}`,
    amountCents: 500,
    createdAt: '2026-09-20T10:00:00.000Z',
    tier: { id: 't1', name: `Track ${index}` },
    buyer: {
      username: `fan-${index}`,
      displayName: index === 0 ? '' : `Fan ${index}`,
      avatarUrl: null,
    },
  };
}

async function renderList() {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => <PurchaseOrdersList /> }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

describe('PurchaseOrdersList', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists sales with a total and shows the rest on request', async () => {
    vi.spyOn(purchaseTiers, 'fetchMyPurchaseOrders').mockResolvedValue({
      data: Array.from({ length: 22 }, (_, index) => order(index)),
      meta: { source: 'api' },
    });
    await renderList();
    expect(screen.getByText('22 sales, €110 before fees.')).toBeTruthy();
    const list = screen.getByTestId('purchase-orders');
    expect(within(list).getAllByRole('listitem')).toHaveLength(20);
    expect(within(list).getByText('fan-0')).toBeTruthy();
    expect(within(list).getByText('Fan 1')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Show all 22' }));
    expect(within(list).getAllByRole('listitem')).toHaveLength(22);
  });

  it('shows an empty state without sales', async () => {
    vi.spyOn(purchaseTiers, 'fetchMyPurchaseOrders').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    await renderList();
    expect(screen.getByText('No track sales yet')).toBeTruthy();
  });

  it('offers a retry when loading fails', async () => {
    const fetch = vi
      .spyOn(purchaseTiers, 'fetchMyPurchaseOrders')
      .mockResolvedValue({ data: null, meta: { source: 'api' } });
    await renderList();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Retry|Try again/ }));
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
