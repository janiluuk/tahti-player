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

import * as client from '../api/client';
import type { FanSubscriptionRow } from '../api/types';
import type { FanCheckoutReturn } from '../lib/fanCheckoutReturn';
import { useAuthStore, type AuthUser } from '../stores/authStore';
import { useSettingsModalStore } from '../stores/settingsModalStore';
import { SubscribeView } from './SubscribeView';

type TiersResult = Awaited<ReturnType<typeof client.fetchFanTiers>>;

const activeSub: FanSubscriptionRow = {
  id: 'sub-1',
  tierName: 'Supporter',
  amountCents: 500,
  state: 'ACTIVE',
  currentPeriodEnd: '2026-11-01T00:00:00.000Z',
  canceledAt: null,
  artist: { username: 'aurora', displayName: 'Aurora' },
};

async function renderSubscribe({
  subscriptions = [],
  checkoutReturn = null,
  paymentsReady = true,
  tiers,
}: {
  subscriptions?: FanSubscriptionRow[];
  checkoutReturn?: FanCheckoutReturn;
  paymentsReady?: boolean;
  tiers?: Promise<TiersResult>;
} = {}) {
  const fetchTiers = vi.spyOn(client, 'fetchFanTiers');
  if (tiers) {
    fetchTiers.mockReturnValue(tiers);
  } else {
    fetchTiers.mockResolvedValue({
      data: {
        artist: {
          id: 'a1',
          username: 'aurora',
          displayName: 'Aurora',
          bio: null,
          avatarUrl: null,
        },
        tiers: [{ id: 't1', name: 'Supporter', amountCents: 500 }],
        paymentsReady,
      } as never,
      meta: { source: 'api' },
    });
  }
  const mine = vi
    .spyOn(client, 'fetchMySubscriptions')
    .mockResolvedValue({ data: subscriptions, meta: { source: 'api' } });
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => (
        <SubscribeView username="aurora" checkoutReturn={checkoutReturn} />
      ),
    }),
    history: createMemoryHistory({ initialEntries: ['/subscribe/aurora'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return { mine };
}

function signIn() {
  useAuthStore.setState({
    user: { id: 'u1', username: 'fan', displayName: 'Fan' } as AuthUser,
  });
}

describe('SubscribeView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null });
    useSettingsModalStore.setState({ isOpen: false, accountSection: null });
  });

  it('confirms a completed checkout', async () => {
    signIn();
    await renderSubscribe({ checkoutReturn: 'subscribed' });
    expect(screen.getByText('Thanks for subscribing!')).toBeTruthy();
  });

  it('names the artist by their display name in the tab title', async () => {
    await renderSubscribe();
    expect(document.title).toBe('Subscribe to Aurora · Tahti');
  });

  it('tells the viewer a cancelled checkout did not charge them', async () => {
    signIn();
    await renderSubscribe({ checkoutReturn: 'canceled' });
    expect(screen.getByText('Checkout cancelled')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeTruthy();
  });

  it('shows the current subscription instead of the tier buttons', async () => {
    signIn();
    await renderSubscribe({ subscriptions: [activeSub] });
    expect(screen.getByTestId('current-fan-subscription').textContent).toMatch(
      /You're subscribed: Supporter/,
    );
    expect(screen.queryByRole('button', { name: 'Subscribe' })).toBeNull();

    fireEvent.click(
      screen.getByRole('button', { name: 'Manage subscription' }),
    );
    const settings = useSettingsModalStore.getState();
    expect(settings.isOpen).toBe(true);
    expect(settings.activeTab).toBe('account');
    expect(settings.accountSection).toBe('subscriptions');
  });

  it('keeps the tier buttons when the subscription is to another artist or ended', async () => {
    signIn();
    await renderSubscribe({
      subscriptions: [
        { ...activeSub, artist: { username: 'other', displayName: 'Other' } },
        { ...activeSub, id: 'sub-2', state: 'CANCELED' },
      ],
    });
    expect(screen.queryByTestId('current-fan-subscription')).toBeNull();
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeTruthy();
  });

  it('does not look up subscriptions when signed out', async () => {
    const { mine } = await renderSubscribe();
    expect(mine).not.toHaveBeenCalled();
    expect(screen.getByText('Log in or join Tahti to subscribe.')).toBeTruthy();
  });

  it('explains unready payments without developer jargon', async () => {
    signIn();
    await renderSubscribe({ paymentsReady: false });
    expect(screen.queryByText(/503|Connect/)).toBeNull();
    expect(screen.getByText(/isn't set up to take payments yet/)).toBeTruthy();
  });

  it('shows the saved tiers at once but waits for the refresh before checkout', async () => {
    signIn();
    await renderSubscribe();
    expect(screen.getByText('Supporter')).toBeTruthy();
    cleanup();

    let resolve: (value: TiersResult) => void = () => undefined;
    await renderSubscribe({ tiers: new Promise((r) => (resolve = r)) });
    expect(screen.getByText('Supporter')).toBeTruthy();
    expect(screen.queryByText('Loading tiers…')).toBeNull();
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeDisabled();

    await act(async () =>
      resolve({
        data: {
          artist: {
            id: 'a1',
            username: 'aurora',
            displayName: 'Aurora',
            bio: null,
            avatarUrl: null,
          },
          tiers: [{ id: 't2', name: 'Patron', amountCents: 1000 }],
          paymentsReady: true,
        } as never,
        meta: { source: 'api' },
      }),
    );
    expect(screen.getByText('Patron')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeEnabled();
  });

  it('shows the error instead of saved tiers when the refresh fails', async () => {
    await renderSubscribe();
    expect(screen.getByText('Supporter')).toBeTruthy();
    cleanup();

    await renderSubscribe({
      tiers: Promise.resolve({
        data: null,
        meta: { source: 'api', reason: 'HTTP 503' },
      } as never),
    });
    expect(
      await screen.findByText('Could not load subscription tiers'),
    ).toBeTruthy();
    expect(screen.queryByText('Supporter')).toBeNull();
  });
});
