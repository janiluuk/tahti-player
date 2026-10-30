import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as likes from '../api/likes';
import type { TahtiPlayable } from '../api/types';
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';
import { FavoritesView } from './FavoritesView';

const TRACK: TahtiPlayable = {
  id: 'sound:one',
  kind: 'sound',
  title: 'Night Drive',
  artist: 'Aurora Drift',
  streamUrl: 'https://example.com/one.mp3',
  protocol: 'https',
};

function renderFavorites() {
  const rootRoute = createRootRoute({ component: () => <FavoritesView /> });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return render(<RouterProvider router={router} />);
}

describe('FavoritesView', () => {
  beforeEach(() => {
    vi.spyOn(likes, 'fetchMyLikes').mockResolvedValue({
      data: [],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    });
    useAuthStore.setState({
      user: {
        id: 'user-1',
        email: 'demo@tahti.live',
        username: 'demo',
        displayName: 'Demo',
        role: 'LISTENER',
        isBoard: false,
        isMember: true,
      },
      hydrated: true,
      loading: false,
    });
    useLibraryStore.setState({ favoriteChannels: [], favoriteTracks: [] });
  });
  afterEach(() => {
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
    useLibraryStore.setState({ favoriteChannels: [], favoriteTracks: [] });
    vi.restoreAllMocks();
  });

  it('shows favorite channels as neutral cards like Listen', async () => {
    useLibraryStore.setState({
      favoriteChannels: [{ slug: 'aurora', displayName: 'Aurora Drift' }],
    });
    renderFavorites();
    const link = await screen.findByRole('link', { name: 'Aurora Drift' });
    expect(link).toHaveAttribute('href', '/channel/aurora');
    expect(link.closest('[data-testid="card"]')).toHaveAttribute(
      'data-surface',
      'neutral',
    );
  });

  it('shows the empty favorites to a signed-out visitor', async () => {
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
    renderFavorites();

    expect(await screen.findByText('No favorite tracks')).toBeInTheDocument();
    expect(
      screen.queryByText('Sign in to see favorites'),
    ).not.toBeInTheDocument();
    expect(likes.fetchMyLikes).not.toHaveBeenCalled();
  });

  it('says where to find tracks when none are favorited', async () => {
    renderFavorites();

    expect(await screen.findByText('No favorite tracks')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Find music' })).toHaveAttribute(
      'href',
      '/discover',
    );
  });

  it('lists favorite tracks instead of the empty state', async () => {
    useLibraryStore.setState({ favoriteTracks: [TRACK] });
    renderFavorites();

    expect(await screen.findByText('Night Drive')).toBeInTheDocument();
    expect(screen.queryByText('No favorite tracks')).not.toBeInTheDocument();
  });

  it('says the likes failed to load instead of hiding them', async () => {
    const fetch = vi.spyOn(likes, 'fetchMyLikes').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    renderFavorites();

    expect(
      await screen.findByText('Could not load your likes'),
    ).toBeInTheDocument();
    fetch.mockResolvedValue({ data: [], meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() =>
      expect(screen.queryByText('Liked on Tahti')).not.toBeInTheDocument(),
    );
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('keeps the likes error banner next to favorite tracks', async () => {
    useLibraryStore.setState({ favoriteTracks: [TRACK] });
    vi.spyOn(likes, 'fetchMyLikes').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 500' },
    });
    renderFavorites();

    expect(await screen.findByText('Night Drive')).toBeInTheDocument();
    expect(
      await screen.findByText('Could not load your likes'),
    ).toBeInTheDocument();
    expect(screen.getByText('HTTP 500')).toBeInTheDocument();
  });
});
