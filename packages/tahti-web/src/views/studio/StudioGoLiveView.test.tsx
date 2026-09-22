// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { act, fireEvent, screen } from '@testing-library/react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../../stores/authStore';
import { StudioGoLiveView } from './StudioGoLiveView';

const postGoLive = vi.fn();

vi.mock('../../api/broadcast', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/broadcast')>();
  return {
    ...actual,
    fetchStreamSettings: async () => ({
      data: {
        rtmp: { server: 'rtmp://x', streamKey: 'k' },
        icecast: { server: 'icecast://x', mount: '/m', password: 'p' },
        hlsUrl: 'https://x/live.m3u8',
      },
      meta: { source: 'mock' as const },
    }),
    fetchBroadcastUsage: async () => ({
      data: {
        unlimited: true,
        secondsUsed: 0,
        secondsRemaining: null,
        weeklyCapSeconds: 0,
        blocked: false,
      },
      meta: { source: 'mock' as const },
    }),
    fetchRtmpTargets: async () => ({
      data: [],
      meta: { source: 'mock' as const },
    }),
    fetchBroadcastPreflight: async () => ({
      data: null,
      meta: { source: 'mock' as const },
    }),
    fetchSignalStatus: async () => ({
      data: {
        connected: true,
        codec: 'aac',
        bitrateKbps: 192,
        listeners: 0,
      },
      meta: { source: 'mock' as const },
    }),
    postGoLive: (...args: unknown[]) => postGoLive(...args),
  };
});

function createRouterFor() {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const route = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/go-live',
    component: StudioGoLiveView,
  });
  return createRouter({
    routeTree: rootRoute.addChildren([route]),
    history: createMemoryHistory({ initialEntries: ['/studio/go-live'] }),
  });
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubEnv('VITE_FORCE_MOCK', '1');
  postGoLive.mockResolvedValue({ ok: true });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  useAuthStore.setState({ user: null, hydrated: true, loading: false });
});

async function renderView() {
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
  const router = createRouterFor();
  await act(async () => {
    root.render(<RouterProvider router={router} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('StudioGoLiveView go-live confirmation', () => {
  it('confirms before handing the rotation to the broadcast', async () => {
    await renderView();

    const goLiveButton = screen.getByRole('button', { name: /Go Live/ });
    await act(async () => fireEvent.click(goLiveButton));

    expect(postGoLive).not.toHaveBeenCalled();
    expect(screen.getByText('Go live now?')).toBeInTheDocument();

    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Go live' })),
    );

    expect(postGoLive).toHaveBeenCalledTimes(1);
  });

  it('does not go live when the confirmation is cancelled', async () => {
    await renderView();

    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: /Go Live/ })),
    );
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' })),
    );

    expect(postGoLive).not.toHaveBeenCalled();
  });
});
