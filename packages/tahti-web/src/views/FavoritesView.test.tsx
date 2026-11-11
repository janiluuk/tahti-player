import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as likes from '../api/likes';
import type { TahtiPlayable } from '../api/types';
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';
import { useSoundLikesStore } from '../stores/soundLikesStore';
import { FavoritesView } from './FavoritesView';

const TRACK: TahtiPlayable = {
  id: 'sound:one',
  kind: 'sound',
  title: 'Night Drive',
  artist: 'Aurora Drift',
  streamUrl: 'https://example.com/one.mp3',
  protocol: 'https',
};

const LIKED: likes.LikedTrack = {
  id: 'liked-1',
  title: 'Morning Fog',
  bannerUrl: null,
  audioUrl: 'https://example.com/fog.mp3',
  channelSlug: 'aurora',
  artistUsername: 'aurora',
  artistDisplayName: 'Aurora Drift',
  likedAt: '2026-11-01T10:00:00.000Z',
  url: '/t/liked-1',
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

  it('subtitles favorite channels with the @username, not the bare slug', async () => {
    useLibraryStore.setState({
      favoriteChannels: [
        { slug: 'aurora', displayName: 'Aurora Drift' },
        { slug: 'tahti-radio', username: 'tahti', displayName: 'Tahti Radio' },
      ],
    });
    renderFavorites();
    expect(await screen.findByText('@aurora')).toBeInTheDocument();
    expect(screen.getByText('@tahti')).toBeInTheDocument();
    expect(screen.queryByText('tahti-radio')).toBeNull();
  });

  it('asks a signed-out visitor to sign in for their liked tracks', async () => {
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
    renderFavorites();

    expect(
      await screen.findByText('Sign in to see the tracks you like'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(likes.fetchMyLikes).not.toHaveBeenCalled();
  });

  it('says where to find tracks when none are liked', async () => {
    renderFavorites();

    expect(await screen.findByText('No liked tracks')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Find music' })).toHaveAttribute(
      'href',
      '/discover',
    );
  });

  it('shows one liked tracks list from the account, not local favourites', async () => {
    useLibraryStore.setState({ favoriteTracks: [TRACK] });
    vi.spyOn(likes, 'fetchMyLikes').mockResolvedValue({
      data: [LIKED],
      meta: { source: 'api' },
    });
    renderFavorites();

    expect(await screen.findByText('Morning Fog')).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { name: 'Liked tracks' }),
    ).toHaveLength(1);
    expect(screen.queryByText('Night Drive')).not.toBeInTheDocument();
    expect(screen.queryByText('Liked on Tahti')).not.toBeInTheDocument();
    expect(screen.queryByText('No liked tracks')).not.toBeInTheDocument();
  });

  it('says the likes failed to load and retries', async () => {
    const fetch = vi.spyOn(likes, 'fetchMyLikes').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    renderFavorites();

    expect(
      await screen.findByText('Could not load your likes'),
    ).toBeInTheDocument();
    expect(screen.getByText('HTTP 502')).toBeInTheDocument();
    fetch.mockResolvedValue({ data: [LIKED], meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Morning Fog')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('loads the likes again after local favourites moved to the account', async () => {
    const fetch = vi.spyOn(likes, 'fetchMyLikes').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    renderFavorites();
    expect(await screen.findByText('No liked tracks')).toBeInTheDocument();

    fetch.mockResolvedValue({ data: [LIKED], meta: { source: 'api' } });
    act(() => useSoundLikesStore.getState().markImported());

    expect(await screen.findByText('Morning Fog')).toBeInTheDocument();
  });

  it('keeps favourite radio stations with the channels', async () => {
    useLibraryStore.setState({
      favoriteTracks: [
        {
          id: 'radio:groove',
          kind: 'radio',
          title: 'Groove Salad',
          artist: 'SomaFM',
          streamUrl: 'https://example.com/groove',
          protocol: 'https',
        },
      ],
    });
    renderFavorites();

    expect(await screen.findByRole('link', { name: 'SomaFM' })).toHaveAttribute(
      'href',
      '/radio',
    );
  });
});
