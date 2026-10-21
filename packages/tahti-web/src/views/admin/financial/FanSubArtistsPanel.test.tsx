// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../../api/admin';
import { FanSubArtistsPanel } from './FanSubArtistsPanel';

async function renderPanel() {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => <FanSubArtistsPanel /> }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

describe('FanSubArtistsPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists each artist with subscribers, revenue and Stripe status', async () => {
    vi.spyOn(admin, 'fetchFanSubArtists').mockResolvedValue({
      data: [
        {
          artistUserId: 'u1',
          displayName: 'DJ Moonlight',
          username: 'dj-moonlight',
          activeSubscriberCount: 12,
          mrrCents: 6000,
          totalPaidCents: 42600,
          stripeConnectChargesEnabled: true,
          stripeConnectAccountId: 'acct_1',
        },
        {
          artistUserId: 'u2',
          displayName: '',
          username: 'northern-lights',
          activeSubscriberCount: 3,
          mrrCents: 1500,
          totalPaidCents: 0,
          stripeConnectChargesEnabled: false,
          stripeConnectAccountId: null,
        },
      ],
      meta: { source: 'api' },
    });
    await renderPanel();
    const rows = within(screen.getByTestId('fansub-artists')).getAllByRole(
      'row',
    );
    expect(rows).toHaveLength(3);
    expect(rows[1]!.textContent).toContain('DJ Moonlight');
    expect(rows[1]!.textContent).toContain('12');
    expect(rows[1]!.textContent).toContain('Ready');
    expect(rows[2]!.textContent).toContain('northern-lights');
    expect(rows[2]!.textContent).toContain('Not connected');
  });

  it('shows an error state when the list fails to load', async () => {
    vi.spyOn(admin, 'fetchFanSubArtists').mockResolvedValue({
      data: null,
      meta: { source: 'api' },
    });
    await renderPanel();
    expect(screen.getByText("Couldn't load artists")).toBeTruthy();
  });
});
