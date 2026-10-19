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

import * as client from '../../../api/client';
import type { AuthUser } from '../../../api/types';
import { useAuthStore } from '../../../stores/authStore';
import { AccountPanel } from './AccountPanel';

describe('AccountPanel membership', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('offers Retry when the membership fails to load', async () => {
    useAuthStore.setState({ user: { username: 'fan' } as AuthUser });
    const fetch = vi.spyOn(client, 'fetchMembership').mockResolvedValue({
      data: null,
      meta: { source: 'api', reason: 'HTTP 502' },
    } as Awaited<ReturnType<typeof client.fetchMembership>>);
    vi.spyOn(client, 'fetchMyPurchases').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    vi.spyOn(client, 'fetchMySubscriptions').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    const router = createRouter({
      routeTree: createRootRoute({ component: () => <AccountPanel /> }),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    await act(async () => {
      render(<RouterProvider router={router} />);
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole('tab', { name: /Membership & billing/ }),
      );
    });
    expect(screen.getByText('Could not load your membership')).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
