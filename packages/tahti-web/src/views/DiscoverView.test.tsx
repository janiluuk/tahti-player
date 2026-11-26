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

import * as discoverApi from '../api/discover';
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
  const eventRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/events/$eventId',
    component: () => null,
  });

  return createRouter({
    routeTree: rootRoute.addChildren([
      discoverRoute,
      registerRoute,
      myVenuesRoute,
      venueRoute,
      artistRoute,
      eventRoute,
    ]),
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });
}

const mountedRoots: Root[] = [];

async function renderDiscover(path: string): Promise<{
  container: HTMLDivElement;
  root: Root;
}> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  mountedRoots.push(root);
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
    for (const root of mountedRoots.splice(0)) {
      act(() => root.unmount());
    }
    document.body.replaceChildren();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('has no "Tracks I haven’t heard" filter', async () => {
    const { container } = await renderDiscover('/discover');
    expect(container.textContent).not.toContain('haven’t heard');
  });

  it('shows listening parties as a tile in the widget masonry', async () => {
    const { container } = await renderDiscover('/discover');
    const tile = container.querySelector(
      '[data-testid="discover-parties-widget"]',
    );
    expect(tile).not.toBeNull();
    expect(
      tile!.querySelector('[data-testid="discover-parties-row"]'),
    ).not.toBeNull();
    expect(
      tile!.closest('[data-testid="discover-widget-columns"]'),
    ).not.toBeNull();
  });

  it('does not render the hero tile', async () => {
    const { container } = await renderDiscover('/discover');

    expect(container.textContent).not.toContain('Add widget to Discover');
    expect(container.textContent).toContain('This week: most played');
    expect(
      container.querySelector('[data-testid="discover-tab-venues"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="discover-tab-events"]'),
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

  it('lists upcoming events on the events tab without the widget controls', async () => {
    const { container } = await renderDiscover('/discover?tab=events');

    expect(
      container.querySelector('[data-testid="discover-events"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="discover-add-widget"]'),
    ).toBeNull();
    expect(container.textContent).toContain('Aurora Drift b2b Northern Lights');
    expect(container.textContent).toContain('Post event');
  });

  it('keeps the section tabs on one scrollable row instead of wrapping', async () => {
    const { container } = await renderDiscover('/discover?tab=venues');
    const tablist = container.querySelector('[role="tablist"]');
    expect(tablist?.className).toContain('flex-nowrap');
    expect(tablist?.className).toContain('overflow-x-auto');
  });

  it('shows Register a venue as a button link', async () => {
    const { container } = await renderDiscover('/discover?tab=venues');
    const register = Array.from(container.querySelectorAll('a')).find(
      (a) => a.textContent === 'Register a venue',
    );
    expect(register?.getAttribute('href')).toBe('/venues/register');
    expect(register?.className).toContain('h-9');
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

  describe('widget snapshots', () => {
    const widgetText = (container: HTMLElement) =>
      container.querySelector('[data-widget-id="latest-tracks"]')
        ?.textContent ?? '';

    beforeEach(() => {
      useDiscoverStore.setState({ enabledWidgets: ['latest-tracks'] });
    });

    it('shows the last loaded widget at once on a revisit', async () => {
      const first = await renderDiscover('/discover');
      const loaded = widgetText(first.container);
      act(() => first.root.unmount());
      mountedRoots.splice(mountedRoots.indexOf(first.root), 1);

      vi.spyOn(discoverApi, 'fetchLatestTracks').mockReturnValue(
        new Promise(() => {}),
      );
      const second = await renderDiscover('/discover');

      expect(widgetText(second.container)).toBe(loaded);
      expect(
        second.container.querySelector(
          '[data-widget-id="latest-tracks"] [role="status"]',
        ),
      ).toBeNull();
    });

    it('keeps the saved widget and flags a failed refresh', async () => {
      const first = await renderDiscover('/discover');
      const loaded = widgetText(first.container);
      act(() => first.root.unmount());
      mountedRoots.splice(mountedRoots.indexOf(first.root), 1);

      vi.spyOn(discoverApi, 'fetchLatestTracks').mockResolvedValue({
        data: [],
        meta: { source: 'api', reason: 'HTTP 503' },
      });
      const second = await renderDiscover('/discover');

      expect(widgetText(second.container)).toBe(loaded);
      expect(second.container.textContent).toContain(
        'Could not refresh; showing the last loaded version.',
      );
      expect(second.container.textContent).toContain('HTTP 503');
    });

    it('shows the widget error when nothing was saved', async () => {
      vi.spyOn(discoverApi, 'fetchLatestTracks').mockResolvedValue({
        data: [],
        meta: { source: 'api', reason: 'HTTP 503' },
      });
      const { container } = await renderDiscover('/discover');

      expect(widgetText(container)).toContain('HTTP 503');
      expect(container.textContent).not.toContain(
        'Could not refresh; showing the last loaded version.',
      );
    });
  });

  it.each([
    ['/discover', 'Discover'],
    ['/discover?tab=artists', 'Artists'],
    ['/discover?tab=venues', 'Venues'],
    ['/discover?tab=groups', 'Groups'],
  ])('titles %s with its own heading', async (path, heading) => {
    const { container } = await renderDiscover(path);

    expect(container.querySelector('h1')?.textContent).toBe(heading);
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
