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

import { parseDiscoverSearch } from '../lib/discoverTabs';
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
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
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
      unheardOnly: false,
      randomArtistRotationDays: 1,
    });
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('puts add-widget in the header and does not render the hero tile', async () => {
    const { container } = await renderDiscover('/discover');

    expect(
      container.querySelector('header [data-testid="discover-add-widget"]'),
    ).not.toBeNull();
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
});
