import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchUserLikes, type LikedTrack } from '../../api/likes';
import { ArtistLikes } from './ArtistLikes';

vi.mock('../../api/likes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/likes')>()),
  fetchUserLikes: vi.fn(),
}));

const liked = (overrides: Partial<LikedTrack> = {}): LikedTrack => ({
  id: 's1',
  title: 'Northern Lights',
  bannerUrl: null,
  audioUrl: 'https://cdn.example/s1.mp3',
  channelSlug: 'aino',
  artistUsername: 'aino',
  artistDisplayName: 'Aino',
  likedAt: '2026-10-01T12:00:00.000Z',
  url: '/c/aino#sound-item-s1',
  ...overrides,
});

async function renderLikes(result: Awaited<ReturnType<typeof fetchUserLikes>>) {
  vi.mocked(fetchUserLikes).mockResolvedValue(result);
  await act(async () => {
    render(
      <RouterProvider
        router={createRouter({
          routeTree: createRootRoute({
            component: () => <ArtistLikes username="selector" />,
          }),
          history: createMemoryHistory({ initialEntries: ['/'] }),
        })}
      />,
    );
  });
}

describe('ArtistLikes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("lists the user's playable liked tracks", async () => {
    await renderLikes({
      showLikes: true,
      data: [liked(), liked({ id: 's2', title: 'Gated', audioUrl: null })],
      meta: { source: 'api' },
    });
    expect(fetchUserLikes).toHaveBeenCalledWith('selector');
    expect(
      await screen.findByRole('region', { name: 'Liked tracks' }),
    ).toBeTruthy();
    expect(screen.getAllByText('Northern Lights').length).toBeGreaterThan(0);
    expect(screen.queryByText('Gated')).toBeNull();
  });

  it('renders nothing when the user hides their likes', async () => {
    await renderLikes({
      showLikes: false,
      data: [liked()],
      meta: { source: 'api' },
    });
    expect(screen.queryByText('Liked tracks')).toBeNull();
  });

  it('renders nothing without likes', async () => {
    await renderLikes({ showLikes: true, data: [], meta: { source: 'api' } });
    expect(screen.queryByText('Liked tracks')).toBeNull();
  });
});
