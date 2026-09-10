// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../stores/authStore';
import { GovernanceMembersView } from './GovernanceMembersView';

function createMembersRouter() {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const membersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/governance/members',
    component: GovernanceMembersView,
  });
  const governanceRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/governance',
    component: () => null,
  });
  const channelRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/channel/$slug',
    component: () => null,
  });
  return createRouter({
    routeTree: rootRoute.addChildren([
      membersRoute,
      governanceRoute,
      channelRoute,
    ]),
    history: createMemoryHistory({ initialEntries: ['/governance/members'] }),
  });
}

let container: HTMLDivElement;
let root: Root;

class StubResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function stubMatchMedia() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

beforeEach(() => {
  vi.stubEnv('VITE_FORCE_MOCK', '1');
  vi.stubGlobal('ResizeObserver', StubResizeObserver);
  stubMatchMedia();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  useAuthStore.setState({
    user: {
      id: 'listener-1',
      email: 'listener@tahti.live',
      username: 'listener-liina',
      displayName: 'Liina',
      role: 'LISTENER',
      isMember: true,
    },
    hydrated: true,
    loading: false,
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  useAuthStore.setState({ user: null, hydrated: true, loading: false });
});

describe('GovernanceMembersView', () => {
  it('lists members with board badges and lets the user search', async () => {
    const router = createMembersRouter();
    await act(async () => {
      root.render(<RouterProvider router={router} />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(container.textContent).toContain('Mart Saar');
    expect(container.textContent).toContain('Demo Member');
    expect(container.textContent).toContain('Board');

    const search = container.querySelector('input') as HTMLInputElement;
    expect(search).toBeTruthy();
  });

  it('prompts signed-out visitors to sign in instead of showing the list', async () => {
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
    const router = createMembersRouter();
    await act(async () => {
      root.render(<RouterProvider router={router} />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(container.textContent).toContain('Sign in');
    expect(container.textContent).not.toContain('Mart Saar');
  });
});
