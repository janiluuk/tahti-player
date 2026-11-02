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
  it('opens the notifications page, with a dot instead of a count', async () => {
    const nav = navState();
    const router = renderMenu(nav);
    const item = await screen.findByRole('menuitem', { name: /Notifications/ });
    expect(item.getAttribute('href')).toBe('/notifications');
    expect(item.textContent).not.toContain('3');
    expect(item.querySelector('.bg-accent-red')).toBeTruthy();

    fireEvent.click(item);
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/notifications'),
    );
    expect(nav.setOpen).toHaveBeenCalledWith(false);
    expect(nav.setNotificationsOpen).toHaveBeenCalledWith(false);
  });
});

describe('UserMenu on desktop', () => {
  it('opens the notifications and messages quick views', async () => {
    const nav = navState({ isMobile: false });
    renderMenu(nav);
    fireEvent.click(
      await screen.findByRole('menuitem', { name: /Notifications/ }),
    );
    expect(nav.setNotificationsOpen).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByRole('menuitem', { name: /Messages/ }));
    expect(nav.setMessagesOpen).toHaveBeenCalledWith(true);
  });

  it('shows one pill colour per unread kind, never a count', async () => {
    renderMenu(
      navState({
        isMobile: false,
        open: false,
        unreadNotificationCount: 4,
        unreadMessagesCount: 2,
      }),
    );
    const trigger = await screen.findByRole('button', {
      name: 'Signed in as Demo, unread notifications and messages',
    });
    const pill = screen.getByTestId('account-unread-pill');
    expect(pill.querySelector('.bg-accent-red')).toBeTruthy();
    expect(pill.querySelector('.bg-accent-cyan')).toBeTruthy();
    expect(trigger.textContent).not.toMatch(/[0-9]/);
  });

  it('shows only the messages colour when only messages are unread', async () => {
    renderMenu(
      navState({
        isMobile: false,
        open: false,
        unreadNotificationCount: 0,
        unreadMessagesCount: 1,
      }),
    );
    await screen.findByRole('button', {
      name: 'Signed in as Demo, unread messages',
    });
    const pill = screen.getByTestId('account-unread-pill');
    expect(pill.querySelector('.bg-accent-red')).toBeNull();
    expect(pill.querySelector('.bg-accent-cyan')).toBeTruthy();
  });

  it('shows no pill when nothing is unread', async () => {
    renderMenu(
      navState({ isMobile: false, open: false, unreadNotificationCount: 0 }),
    );
    await screen.findByRole('button', { name: 'Signed in as Demo' });
    expect(screen.queryByTestId('account-unread-pill')).toBeNull();
  });
});
