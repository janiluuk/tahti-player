import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as likes from '../api/likes';
import type { TahtiPlayable } from '../api/types';
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
    useLibraryStore.setState({ favoriteChannels: [], favoriteTracks: [] });
  });
  afterEach(() => {
    useLibraryStore.setState({ favoriteChannels: [], favoriteTracks: [] });
    vi.restoreAllMocks();
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
});
