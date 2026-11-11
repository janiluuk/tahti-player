import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Track } from '@tahti-player/model';

import * as likes from '../api/likes';
import * as engagement from '../api/sound-engagement';
import * as studio from '../api/studio';
import type { TahtiPlayable } from '../api/types';
import { playableToTrack } from '../lib/playableToTrack';
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';
import { useSoundLikesStore } from '../stores/soundLikesStore';
import {
  PlayableTrackContextMenu,
  PlayableTrackResolverContext,
} from './PlayableTrackContextMenu';

const PLAYABLE: TahtiPlayable = {
  id: 'sound:s1',
  kind: 'sound',
  title: 'Night Drive',
  artist: 'Aurora Drift',
  streamUrl: 'https://example.com/s1.mp3',
  protocol: 'https',
  channelSlug: 'aurora',
};
const TRACK = playableToTrack(PLAYABLE);

function renderMenu(track: Track = TRACK) {
  const rootRoute = createRootRoute({
    component: () => (
      <PlayableTrackResolverContext.Provider
        value={(row) => (row.source.id === PLAYABLE.id ? PLAYABLE : null)}
      >
        <PlayableTrackContextMenu track={track}>
          <button type="button">Open</button>
        </PlayableTrackContextMenu>
      </PlayableTrackResolverContext.Provider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return render(<RouterProvider router={router} />);
}

async function openMenu() {
  await userEvent.click(await screen.findByRole('button', { name: 'Open' }));
}

describe('PlayableTrackContextMenu likes', () => {
  beforeEach(() => {
    vi.spyOn(studio, 'fetchStudioCollections').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    } as Awaited<ReturnType<typeof studio.fetchStudioCollections>>);
    vi.spyOn(likes, 'fetchMyLikes').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    useAuthStore.setState({
      user: {
        id: 'user-1',
        email: '',
        username: 'demo',
        displayName: 'Demo',
        role: 'LISTENER',
        isBoard: false,
        isMember: true,
      },
      hydrated: true,
      loading: false,
    });
  });
  afterEach(() => {
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
    useSoundLikesStore.getState().reset();
    vi.restoreAllMocks();
  });

  it('likes the track on the account instead of saving it locally', async () => {
    const like = vi
      .spyOn(engagement, 'setSoundEngagement')
      .mockResolvedValue({ ok: true, data: { active: true, count: 1 } });
    renderMenu();
    await openMenu();

    await userEvent.click(await screen.findByText('Like'));

    await waitFor(() =>
      expect(like).toHaveBeenCalledWith('like', 'aurora', 's1', true),
    );
    expect(useSoundLikesStore.getState().liked.has('s1')).toBe(true);
    expect(useLibraryStore.getState().favoriteTracks).toEqual([]);
    expect(screen.queryByText('Add to favorites')).not.toBeInTheDocument();
  });

  it('offers Unlike for a liked track and unlikes it', async () => {
    vi.spyOn(likes, 'fetchMyLikes').mockResolvedValue({
      data: [{ id: 's1' } as likes.LikedTrack],
      meta: { source: 'api' },
    });
    const unlike = vi
      .spyOn(engagement, 'setSoundEngagement')
      .mockResolvedValue({ ok: true, data: { active: false, count: 0 } });
    renderMenu();
    await waitFor(() =>
      expect(useSoundLikesStore.getState().liked.has('s1')).toBe(true),
    );
    await openMenu();

    await userEvent.click(await screen.findByText('Unlike'));

    await waitFor(() =>
      expect(unlike).toHaveBeenCalledWith('like', 'aurora', 's1', false),
    );
    expect(useSoundLikesStore.getState().liked.has('s1')).toBe(false);
  });

  it('has no like item when signed out', async () => {
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
    renderMenu();
    await openMenu();
    expect(await screen.findByText('Play now')).toBeInTheDocument();
    expect(screen.queryByText('Like')).not.toBeInTheDocument();
  });
});
