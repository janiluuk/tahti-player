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
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as client from '../../../api/client';
import type { AuthUser } from '../../../api/types';
import { useAuthStore } from '../../../stores/authStore';
import { AccountPanel } from './AccountPanel';

vi.mock('sonner', async (importOriginal) => ({
  ...(await importOriginal<typeof import('sonner')>()),
  toast: { error: vi.fn(), success: vi.fn() },
}));

const END = '2026-11-01T00:00:00.000Z';

async function renderSubscriptionsTab(
  subscriptions: Awaited<
    ReturnType<typeof client.fetchMySubscriptions>
  >['data'],
  meta: Awaited<ReturnType<typeof client.fetchMySubscriptions>>['meta'] = {
    source: 'api',
  },
) {
  useAuthStore.setState({ user: { username: 'fan' } as AuthUser });
  vi.spyOn(client, 'fetchMembership').mockResolvedValue({
    data: null,
    meta: { source: 'api' },
  } as Awaited<ReturnType<typeof client.fetchMembership>>);
  vi.spyOn(client, 'fetchMyPurchases').mockResolvedValue({
    data: [],
    meta: { source: 'api' },
  });
  vi.spyOn(client, 'fetchMySubscriptions').mockResolvedValue({
    data: subscriptions,
    meta,
  });
  const router = createRouter({
    routeTree: createRootRoute({ component: () => <AccountPanel /> }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('tab', { name: /Membership & billing/ }));
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('tab', { name: /Your subs/ }));
  });
}

describe('AccountPanel fan subscriptions', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.mocked(toast.error).mockClear();
    useAuthStore.setState({ user: null });
  });

  it('shows an error toast and keeps the subscription when cancelling fails', async () => {
    await renderSubscriptionsTab([
      {
        id: 'sub-1',
        tierName: 'Backer',
        amountCents: 500,
        state: 'ACTIVE',
        currentPeriodEnd: END,
        canceledAt: null,
        artist: { username: 'aurora', displayName: 'Aurora' },
      },
    ]);
    const cancel = vi
      .spyOn(client, 'cancelMySubscription')
      .mockResolvedValue({ ok: false, error: 'Could not cancel with Stripe' });

    fireEvent.click(screen.getByRole('button', { name: 'Manage' }));
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Cancel subscription' }),
      );
    });

    expect(cancel).toHaveBeenCalledWith('sub-1');
    expect(toast.error).toHaveBeenCalledWith('Could not cancel with Stripe');
    expect(screen.queryByText(/Ends on/)).toBeNull();
  });

  it('shows the end date for a subscription canceled at period end', async () => {
    await renderSubscriptionsTab([
      {
        id: 'sub-2',
        tierName: 'Backer',
        amountCents: 500,
        state: 'CANCELED',
        currentPeriodEnd: END,
        canceledAt: '2026-10-01T00:00:00.000Z',
        artist: { username: 'aurora', displayName: 'Aurora' },
      },
    ]);

    expect(
      screen.getByText(
        new RegExp(`Ends on ${new Date(END).toLocaleDateString()}`),
      ),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Manage' })).toBeNull();
  });

  it('shows Retry instead of "No fan subscriptions" when the load fails', async () => {
    await renderSubscriptionsTab([], { source: 'api', reason: 'HTTP 502' });

    expect(
      screen.getByText('Could not load your fan subscriptions'),
    ).toBeTruthy();
    expect(
      screen.queryByText('No fan subscriptions on this account'),
    ).toBeNull();
    vi.mocked(client.fetchMySubscriptions).mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });
    expect(
      screen.getByText('No fan subscriptions on this account'),
    ).toBeTruthy();
  });
});
