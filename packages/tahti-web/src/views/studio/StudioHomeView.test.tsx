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

import { useAuthStore } from '../../stores/authStore';
import { StudioHomeView } from './StudioHomeView';

let mockSoundsCount = 0;
let mockReleasesCount = 0;

vi.mock('../../api/studio', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/studio')>();
  return {
    ...actual,
    fetchStudioSoundCount: async () => ({
      data: mockSoundsCount,
      meta: { source: 'mock' as const },
    }),
    fetchStudioCollectionCount: async () => ({
      data: 0,
      meta: { source: 'mock' as const },
    }),
    fetchStudioReleases: async () => ({
      data: {
        page: 1,
        limit: 100,
        total: mockReleasesCount,
        releases: Array.from({ length: mockReleasesCount }, (_, i) => ({
          id: `release-${i}`,
        })),
      },
      meta: { source: 'mock' as const },
    }),
  };
});

function createStudioRouter() {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const studioRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio',
    component: StudioHomeView,
  });
  const otherRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/$slug',
    component: () => null,
  });
  return createRouter({
    routeTree: rootRoute.addChildren([studioRoute, otherRoute]),
    history: createMemoryHistory({ initialEntries: ['/studio'] }),
  });
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubEnv('VITE_FORCE_MOCK', '1');
  mockSoundsCount = 0;
  mockReleasesCount = 0;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllEnvs();
  useAuthStore.setState({ user: null, hydrated: true, loading: false });
});

async function renderAsArtist() {
  useAuthStore.setState({
    user: {
      id: 'user-1',
      email: 'artist@tahti.live',
      username: 'artist',
      displayName: 'An Artist',
      role: 'ARTIST',
      isBoard: false,
      isMember: true,
      channel: { slug: 'artist', state: 'OFFLINE' },
    },
    hydrated: true,
    loading: false,
  });
  const router = createStudioRouter();
  await act(async () => {
    root.render(<RouterProvider router={router} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('StudioHomeView empty-discography CTAs', () => {
  it('shows "Add an album" and "Add a track" CTAs once an empty discography has loaded', async () => {
    mockSoundsCount = 0;
    mockReleasesCount = 0;
    await renderAsArtist();
    expect(container.textContent).toContain('Nothing in your discography yet');
    expect(container.textContent).toContain('Add an album');
    expect(container.textContent).toContain('Add a track');
  });

  it('does not show the CTAs once tracks exist', async () => {
    mockSoundsCount = 2;
    mockReleasesCount = 0;
    await renderAsArtist();
    expect(container.textContent).not.toContain(
      'Nothing in your discography yet',
    );
  });

  it('does not show the CTAs once releases exist', async () => {
    mockSoundsCount = 0;
    mockReleasesCount = 1;
    await renderAsArtist();
    expect(container.textContent).not.toContain(
      'Nothing in your discography yet',
    );
  });
});
