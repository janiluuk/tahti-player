import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { UserMenu } from './UserMenu';
import { type TopNavState } from './useTopNavState';

function navState(overrides: Partial<TopNavState> = {}): TopNavState {
  return {
    isMobile: true,
    user: { id: 'u1', username: 'demo', displayName: 'Demo' },
    logout: vi.fn(),
    openSettings: vi.fn(),
    open: true,
    setOpen: vi.fn(),
    setMessagesOpen: vi.fn(),
    setNotificationsOpen: vi.fn(),
    menuRef: { current: null },
    hasChannel: false,
    isLive: false,
    displayName: 'Demo',
    initial: 'D',
    unreadNotificationCount: 3,
    unreadMessagesCount: 0,
    ...overrides,
  } as unknown as TopNavState;
}

function renderMenu(nav: TopNavState) {
  const rootRoute = createRootRoute();
  const index = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <UserMenu nav={nav} />,
  });
  const notifications = createRoute({
    getParentRoute: () => rootRoute,
    path: '/notifications',
    component: () => <p>Notifications page</p>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([index, notifications]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe('UserMenu on a phone', () => {
  it('opens the notifications page, with the unread count', async () => {
    const nav = navState();
    const router = renderMenu(nav);
    const item = await screen.findByRole('menuitem', { name: /Notifications/ });
    expect(item.getAttribute('href')).toBe('/notifications');
    expect(item.textContent).toContain('3');

    fireEvent.click(item);
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/notifications'),
    );
    expect(nav.setOpen).toHaveBeenCalledWith(false);
    expect(nav.setNotificationsOpen).toHaveBeenCalledWith(false);
  });
});
