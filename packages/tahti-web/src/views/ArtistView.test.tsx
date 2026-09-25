// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import { ArtistView } from './ArtistView';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
  Toaster: () => null,
}));
vi.mock('../components/ChannelVisualizer', () => ({
  ChannelVisualizer: () => null,
}));
vi.mock('../components/ChannelDesigner', () => ({
  ChannelDesigner: () => <div data-testid="designer" />,
}));

async function renderArtist(username: string) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <ArtistView username={username} />,
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    root.render(<RouterProvider router={router} />);
  });
  for (let i = 0; i < 6; i += 1) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
  return { container, root };
}

describe('ArtistView', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }));
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders the artist header from the profile', async () => {
    const { container } = await renderArtist('northern-lights');
    expect(
      container.querySelector('[data-testid="artist-social-header"]'),
    ).not.toBeNull();
  });

  it('lays out popular tracks, related artists, releases and playlists in reference order', async () => {
    const { container } = await renderArtist('northern-lights');
    const order = [
      ...container.querySelectorAll('[data-testid^="artist-"]'),
    ].map((el) => el.getAttribute('data-testid'));
    expect(order).toEqual([
      'artist-social-header',
      'artist-popular',
      'artist-related',
      'artist-releases',
      'artist-playlists',
    ]);
    expect(
      container.querySelector('[data-testid="artist-related"]')?.textContent,
    ).toContain('Midnight Cartography');
  });

  it('shows "Artist not found" instead of spinning forever when the profile fetch fails', async () => {
    vi.spyOn(client, 'fetchProfile').mockRejectedValue(new Error('offline'));
    const { container } = await renderArtist('northern-lights');
    expect(container.textContent).toContain('Artist not found');
    expect(container.textContent).not.toContain('Loading artist');
  });

  it('survives failing side requests (look, posts, mentions) and still renders', async () => {
    vi.spyOn(client, 'fetchChannel').mockRejectedValue(new Error('boom'));
    const { container } = await renderArtist('northern-lights');
    expect(
      container.querySelector('[data-testid="artist-social-header"]'),
    ).not.toBeNull();
  });
});
