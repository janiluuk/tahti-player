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
import { GovernanceView } from './GovernanceView';

function createGovernanceRouter() {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const governanceRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/governance',
    component: GovernanceView,
  });
  const otherRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/$slug',
    component: () => null,
  });
  return createRouter({
    routeTree: rootRoute.addChildren([governanceRoute, otherRoute]),
    history: createMemoryHistory({ initialEntries: ['/governance'] }),
  });
}

let container: HTMLDivElement;
let root: Root;

class StubResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/** jsdom has no matchMedia — useIsMobile/useIsCompactDesktop and
 * Tooltip's coarse-pointer check both call it, and this suite renders
 * the full component tree rather than mocking those hooks away. */
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
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  useAuthStore.setState({ user: null, hydrated: true, loading: false });
});

async function renderAsBoard() {
  useAuthStore.setState({
    user: {
      id: 'board-1',
      email: 'board@tahti.live',
      username: 'board-jani',
      displayName: 'Board Member',
      role: 'BOARD',
      isBoard: true,
      isMember: true,
    },
    hydrated: true,
    loading: false,
  });
  const router = createGovernanceRouter();
  await act(async () => {
    root.render(<RouterProvider router={router} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('GovernanceView', () => {
  it('shows a distinct DRAFT badge with circulation-period copy, not a bare state label', async () => {
    await renderAsBoard();
    expect(container.textContent).toContain('Discussion · 7-day circulation');
    expect(container.textContent).toContain(
      'after circulation period (bylaws §9)',
    );
  });

  it('lets a board member open a DRAFT motion for voting', async () => {
    await renderAsBoard();
    const buttons = Array.from(container.querySelectorAll('button'));
    const openButton = buttons.find((b) => b.textContent === 'Open voting');
    expect(openButton).toBeTruthy();
  });

  it('lets a board member close an OPEN motion', async () => {
    await renderAsBoard();
    const buttons = Array.from(container.querySelectorAll('button'));
    const closeButtons = buttons.filter(
      (b) => b.textContent === 'Close & publish result',
    );
    // Two OPEN motions in the mock fixture.
    expect(closeButtons.length).toBe(2);
  });

  it('shows turnout against the member directory count for open and closed motions', async () => {
    await renderAsBoard();
    expect(container.textContent).toMatch(/\d+ of \d+ members voted/);
    expect(container.textContent).toContain('tally revealed at close');
    expect(container.textContent).toMatch(/\d+% for/);
  });

  it('shows quorum status on published meetings', async () => {
    await renderAsBoard();
    expect(container.textContent).toMatch(/quorum (met|not met)/);
  });

  it('does not show motion-transition controls to a non-board member', async () => {
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
    const router = createGovernanceRouter();
    await act(async () => {
      root.render(<RouterProvider router={router} />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    const buttons = Array.from(container.querySelectorAll('button'));
    expect(buttons.some((b) => b.textContent === 'Open voting')).toBe(false);
    expect(
      buttons.some((b) => b.textContent === 'Close & publish result'),
    ).toBe(false);
  });
});
