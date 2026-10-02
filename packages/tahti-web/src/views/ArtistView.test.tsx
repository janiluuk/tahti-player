// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import * as follows from '../api/follows';
import { useAuthStore } from '../stores/authStore';
import {
  rehydrateLibraryForUser,
  useLibraryStore,
} from '../stores/libraryStore';
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

  it('shows the nameplate pill next to the display name', async () => {
    const original = client.fetchProfile;
    vi.spyOn(client, 'fetchProfile').mockImplementation(async (name) => {
      const result = await original(name);
      return {
        ...result,
        data: {
          ...result.data,
          artist: {
            ...result.data.artist,
            nameplateText: 'Resident DJ',
            nameplateColor: '#ff0055',
          },
        },
      };
    });
    const { container } = await renderArtist('northern-lights');
    const pill = container.querySelector<HTMLElement>(
      '[data-testid="artist-social-header"] [data-testid="nameplate"]',
    );
    expect(pill?.textContent).toBe('Resident DJ');
    expect(pill?.style.backgroundColor).toBe('rgb(255, 0, 85)');
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

  describe('follow', () => {
    beforeEach(async () => {
      localStorage.clear();
      await rehydrateLibraryForUser('user-listener');
      useAuthStore.setState({
        user: {
          id: 'user-listener',
          email: 'listener@tahti.live',
          username: 'listener',
          displayName: 'Listener',
          role: 'LISTENER',
          isBoard: false,
          isMember: false,
        },
        hydrated: true,
        loading: false,
      });
    });
    afterEach(async () => {
      useAuthStore.setState({ user: null, hydrated: true, loading: false });
      await rehydrateLibraryForUser(null);
    });

    const button = (container: HTMLElement) =>
      container.querySelector<HTMLButtonElement>(
        '[data-testid="artist-favorite-button"]',
      );

    it('shows a follow made elsewhere, from the server', async () => {
      vi.spyOn(follows, 'fetchFollowStatus').mockResolvedValue({
        following: true,
        followerCount: 42,
      });
      const { container } = await renderArtist('northern-lights');
      expect(button(container)?.getAttribute('aria-label')).toBe(
        'Unfollow Northern Lights',
      );
      expect(useLibraryStore.getState().favoriteChannels).toHaveLength(1);
    });

    it('unfollows and puts the follow back when the server refuses', async () => {
      vi.spyOn(follows, 'fetchFollowStatus').mockResolvedValue({
        following: true,
        followerCount: 42,
      });
      vi.spyOn(follows, 'unfollowArtist').mockResolvedValue({
        ok: false,
        error: 'offline',
      });
      const { container } = await renderArtist('northern-lights');
      await act(async () => {
        button(container)?.click();
      });
      expect(follows.unfollowArtist).toHaveBeenCalledWith('northern-lights');
      expect(toast.error).toHaveBeenCalledWith(
        "Couldn't unfollow Northern Lights: offline",
      );
      expect(button(container)?.getAttribute('aria-label')).toBe(
        'Unfollow Northern Lights',
      );
    });

    it('follows and shows the new follower count', async () => {
      vi.spyOn(follows, 'fetchFollowStatus').mockResolvedValue({
        following: false,
        followerCount: 41,
      });
      vi.spyOn(follows, 'followArtist').mockResolvedValue({
        ok: true,
        followerCount: 42,
      });
      const { container } = await renderArtist('northern-lights');
      await act(async () => {
        button(container)?.click();
      });
      expect(button(container)?.getAttribute('aria-label')).toBe(
        'Unfollow Northern Lights',
      );
      expect(
        container.querySelector('[data-testid="artist-social-header"]')
          ?.textContent,
      ).toContain('42');
    });
  });

  describe('follower lists', () => {
    it('opens the followers list from the header and pages through it', async () => {
      const list = vi
        .spyOn(follows, 'fetchFollowList')
        .mockResolvedValueOnce({
          users: [
            { username: 'fan-one', displayName: 'Fan One', avatarUrl: null },
          ],
          hasMore: true,
        })
        .mockResolvedValueOnce({
          users: [
            { username: 'fan-two', displayName: 'Fan Two', avatarUrl: null },
          ],
          hasMore: false,
        });
      const { container } = await renderArtist('northern-lights');
      await act(async () => {
        container
          .querySelector<HTMLButtonElement>('[data-testid="stat-followers"]')
          ?.click();
      });
      expect(list).toHaveBeenCalledWith('northern-lights', 'followers', 0);
      const dialog = () =>
        document.querySelector('[data-testid="follow-list"]');
      expect(dialog()?.textContent).toContain('Fan One');
      const more = [...document.querySelectorAll('button')].find(
        (b) => b.textContent === 'Show more',
      );
      await act(async () => {
        more?.click();
      });
      expect(list).toHaveBeenLastCalledWith('northern-lights', 'followers', 1);
      expect(dialog()?.textContent).toContain('Fan Two');
      expect(
        [...document.querySelectorAll('button')].some(
          (b) => b.textContent === 'Show more',
        ),
      ).toBe(false);
    });
  });
});
