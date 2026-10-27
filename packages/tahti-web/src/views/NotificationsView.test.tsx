import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/notifications';
import type { TahtiNotification } from '../api/notifications';
import { useAuthStore } from '../stores/authStore';
import { NotificationsView } from './NotificationsView';

function note(
  id: string,
  extra: Partial<TahtiNotification> = {},
): TahtiNotification {
  return {
    id,
    type: 'NEW_FOLLOWER',
    actor: null,
    title: `Title ${id}`,
    body: null,
    url: null,
    readAt: null,
    sticky: false,
    createdAt: '2026-10-27T10:00:00.000Z',
    ...extra,
  };
}

function renderView() {
  const rootRoute = createRootRoute({ component: () => <NotificationsView /> });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return render(<RouterProvider router={router} />);
}

const signedIn = {
  id: 'user-1',
  email: 'demo@tahti.live',
  username: 'demo',
  displayName: 'Demo',
  role: 'LISTENER',
  isBoard: false,
  isMember: true,
} as const;

describe('NotificationsView', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: signedIn, hydrated: true, loading: false });
  });
  afterEach(() => {
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
    vi.restoreAllMocks();
  });

  it('lists notifications, pages older ones and marks one read', async () => {
    const fetch = vi
      .spyOn(api, 'fetchNotifications')
      .mockResolvedValueOnce({
        data: [note('a'), note('b', { readAt: '2026-10-26T10:00:00.000Z' })],
        unreadCount: 1,
        hasMore: true,
        meta: { source: 'api' },
      })
      .mockResolvedValueOnce({
        data: [note('c', { readAt: '2026-10-25T10:00:00.000Z' })],
        unreadCount: 1,
        hasMore: false,
        meta: { source: 'api' },
      });
    const dismiss = vi
      .spyOn(api, 'dismissNotification')
      .mockResolvedValue(undefined);
    renderView();

    expect(await screen.findByText('Title a')).toBeTruthy();
    expect(screen.getByText('1 unread')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Show older' }));
    expect(await screen.findByText('Title c')).toBeTruthy();
    expect(fetch).toHaveBeenLastCalledWith('b');
    expect(screen.queryByRole('button', { name: 'Show older' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Mark read: Title a' }));
    await waitFor(() => expect(dismiss).toHaveBeenCalledWith('a'));
    expect(await screen.findByText('All caught up')).toBeTruthy();
  });

  it('keeps sticky notices unread on Mark all read', async () => {
    vi.spyOn(api, 'fetchNotifications').mockResolvedValue({
      data: [note('policy', { sticky: true }), note('plain')],
      unreadCount: 2,
      hasMore: false,
      meta: { source: 'api' },
    });
    const all = vi
      .spyOn(api, 'markAllNotificationsRead')
      .mockResolvedValue(undefined);
    renderView();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Mark all read' }),
    );
    await waitFor(() => expect(all).toHaveBeenCalled());
    expect(await screen.findByText('1 unread')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Acknowledge' })).toBeTruthy();
  });

  it('removes a read notification and clears every read one', async () => {
    vi.spyOn(api, 'fetchNotifications').mockResolvedValue({
      data: [
        note('new'),
        note('old1', { readAt: '2026-10-26T10:00:00.000Z' }),
        note('old2', { readAt: '2026-10-25T10:00:00.000Z' }),
      ],
      unreadCount: 1,
      hasMore: false,
      meta: { source: 'api' },
    });
    const remove = vi
      .spyOn(api, 'removeNotification')
      .mockResolvedValue(undefined);
    const clear = vi.spyOn(api, 'clearReadNotifications').mockResolvedValue(1);
    renderView();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Remove: Title old1' }),
    );
    await waitFor(() => expect(remove).toHaveBeenCalledWith('old1'));
    await waitFor(() => expect(screen.queryByText('Title old1')).toBeNull());
    expect(
      screen.queryByRole('button', { name: 'Remove: Title new' }),
    ).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Clear read' }));
    await waitFor(() => expect(clear).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('Title old2')).toBeNull());
    expect(screen.getByText('Title new')).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: 'Clear read' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it('shows a retry when the inbox fails to load', async () => {
    vi.spyOn(api, 'fetchNotifications').mockResolvedValue({
      data: [],
      unreadCount: 0,
      hasMore: false,
      meta: { source: 'api', reason: 'HTTP 500' },
    });
    renderView();
    expect(
      await screen.findByText('Could not load notifications'),
    ).toBeTruthy();
  });

  it('asks a signed-out visitor to sign in', async () => {
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
    renderView();
    expect(
      await screen.findByText('Sign in to see your notifications'),
    ).toBeTruthy();
  });
});
