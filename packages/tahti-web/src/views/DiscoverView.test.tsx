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

import type { AuthUser } from '../api/types';
import { allOrSpecific } from '../lib/allOrSpecific';
import { parseDiscoverSearch } from '../lib/discoverTabs';
import { useAuthStore } from '../stores/authStore';
import { DEFAULT_WIDGETS, useDiscoverStore } from '../stores/discoverStore';
import { DiscoverView } from './DiscoverView';

function createDiscoverRouter(initialEntry: string) {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  });
  const discoverRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/discover',
    validateSearch: parseDiscoverSearch,
    component: DiscoverView,
  });
  const registerRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/venues/register',
    component: () => null,
  });
  const myVenuesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/venues/mine',
    component: () => null,
  });
  const venueRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/v/$slug',
    component: () => null,
  });
  const artistRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/u/$username',
    component: () => null,
  });

  return createRouter({
    routeTree: rootRoute.addChildren([
      discoverRoute,
      registerRoute,
      myVenuesRoute,
      venueRoute,
      artistRoute,
    ]),
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });
}

async function renderDiscover(path: string): Promise<{
  container: HTMLDivElement;
  root: Root;
}> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const router = createDiscoverRouter(path);
  await act(async () => {
    root.render(<RouterProvider router={router} />);
  });
  // Drain the mock fetch chains (a macrotask outlasts any microtask chain) so
  // no state update lands outside act() once the test body has run.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return { container, root };
}

/** ScrollableArea (via ViewShell) observes its own size — jsdom has no
 * ResizeObserver, so stub one out for this render-heavy suite. */
class ResizeObserverStub {
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

describe('DiscoverView', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    stubMatchMedia();
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    localStorage.clear();
    useDiscoverStore.setState({
      enabledWidgets: [...DEFAULT_WIDGETS],
      genreFilter: [],
      contentTypeFilter: [],
      randomArtistRotationDays: 1,
    });
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('has no "Tracks I haven’t heard" filter', async () => {
    const { container } = await renderDiscover('/discover');
    expect(container.textContent).not.toContain('haven’t heard');
  });

  it('does not render the hero tile', async () => {
    const { container } = await renderDiscover('/discover');

    expect(container.textContent).not.toContain('Add a widget');
    expect(container.textContent).toContain('This week: most played');
    expect(
      container.querySelector('[data-testid="discover-tab-venues"]'),
    ).not.toBeNull();
  });

  it('hides the add-widget control on the venues tab and lists venues', async () => {
    const { container } = await renderDiscover('/discover?tab=venues');

    expect(
      container.querySelector('[data-testid="discover-add-widget"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="discover-filters"]'),
    ).toBeNull();
    expect(container.textContent).toContain('Kuudes Linja');
    expect(container.textContent).toContain('Register a venue');
  });

  it('links a signed-in visitor to their own venues', async () => {
    const { container } = await renderDiscover('/discover?tab=venues');
    expect(container.textContent).not.toContain('My venues');

    act(() => {
      useAuthStore.setState({
        user: { id: 'u1', username: 'venue-owner' } as AuthUser,
      });
    });
    const link = Array.from(container.querySelectorAll('a')).find(
      (a) => a.textContent === 'My venues',
    );
    expect(link?.getAttribute('href')).toBe('/venues/mine');
    act(() => {
      useAuthStore.setState({ user: null });
    });
  });

  it('keeps filters on artists browse and hides widget add control', async () => {
    const { container } = await renderDiscover('/discover?tab=artists');

    expect(
      container.querySelector('[data-testid="discover-add-widget"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="discover-filters"]'),
    ).toBeNull();
    expect(
      container.querySelector('[aria-label="Browse artists"]'),
    ).not.toBeNull();
  });

  describe('allOrSpecific', () => {
    it('picking All clears every specific choice', () => {
      expect(allOrSpecific(['Techno', '__all__'], ['Techno'])).toEqual([]);
    });
    it('picking a specific one leaves All', () => {
      expect(allOrSpecific(['__all__', 'House'], [])).toEqual(['House']);
    });
  });
});
