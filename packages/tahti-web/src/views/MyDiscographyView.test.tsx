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

import type { StudioSound } from '../api/studio-types';
import { useAuthStore } from '../stores/authStore';
import { MyDiscographyView } from './MyDiscographyView';

const mockSound: StudioSound = {
  id: 'sound-1',
  title: 'Test Track',
  status: 'READY',
  isPublic: true,
  artistName: 'A User',
  bannerUrl: null,
  genre: null,
  createdAt: new Date().toISOString(),
  peaks: null,
} as StudioSound;

let fetchedSounds: StudioSound[] = [];
let fetchedMeta: { source: 'api' | 'mock'; reason?: string } = {
  source: 'mock',
};

vi.mock('../api/studio', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/studio')>();
  return {
    ...actual,
    fetchStudioSounds: async () => ({
      data: fetchedSounds,
      meta: fetchedMeta,
    }),
  };
});

function createLibraryRouter() {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const libraryRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/library/sounds',
    component: MyDiscographyView,
  });
  const otherRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/$slug',
    component: () => null,
  });
  return createRouter({
    routeTree: rootRoute.addChildren([libraryRoute, otherRoute]),
    history: createMemoryHistory({ initialEntries: ['/library/sounds'] }),
  });
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubEnv('VITE_FORCE_MOCK', '1');
  fetchedSounds = [];
  fetchedMeta = { source: 'mock' };
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

async function renderAsUser(channel: null | { slug: string; state: string }) {
  useAuthStore.setState({
    user: {
      id: 'user-1',
      email: 'user@tahti.live',
      username: 'user',
      displayName: 'A User',
      role: 'ARTIST',
      isBoard: false,
      isMember: true,
      channel,
    },
    hydrated: true,
    loading: false,
  });
  const router = createLibraryRouter();
  await act(async () => {
    root.render(<RouterProvider router={router} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('MyDiscographyView', () => {
  it('shows fetched sounds even when the account has no channel on record', async () => {
    // Regression: a user whose `channel` field is falsy (stale
    // hydration, a backend response gap, etc.) must still see sounds a
    // successful fetch actually returned — the "no channel" empty state
    // must never override real fetched data.
    fetchedSounds = [mockSound];
    await renderAsUser(null);
    expect(container.textContent).not.toContain('No sounds yet');
    expect(container.textContent).toContain('Test Track');
  });

  it('shows the "go live" empty state when there is genuinely nothing and no channel', async () => {
    fetchedSounds = [];
    await renderAsUser(null);
    expect(container.textContent).toContain('No sounds yet');
    expect(container.textContent).toContain('Go live or upload music');
  });

  it('shows sounds normally for a user with a channel', async () => {
    fetchedSounds = [mockSound];
    await renderAsUser({ slug: 'user', state: 'OFFLINE' });
    expect(container.textContent).toContain('Test Track');
  });

  it('shows a retryable error when the API returns empty with an error reason', async () => {
    fetchedSounds = [];
    fetchedMeta = { source: 'api', reason: 'Not Found' };
    await renderAsUser({ slug: 'user', state: 'OFFLINE' });
    expect(container.textContent).toContain('Could not load sounds');
    expect(container.textContent).toContain('Not Found');
    expect(container.textContent).not.toContain('No sounds yet');
  });
});
