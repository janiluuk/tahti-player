import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchProfile } from '../../api/client';
import type { PublicProfile } from '../../api/types';
import { ChannelCatalogSections } from './ChannelCatalogSections';

vi.mock('../../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/client')>();
  return { ...actual, fetchProfile: vi.fn() };
});

function profile(
  releases: PublicProfile['releases'],
  collections: PublicProfile['collections'],
): PublicProfile {
  return {
    artist: {
      displayName: 'Northern Lights',
      username: 'northern-lights',
    },
    channel: { slug: 'northern-lights', state: 'OFFLINE' },
    releases,
    tracks: [],
    collections,
    fanTiers: [],
    links: {
      channel: null,
      subscribe: '/subscribe/northern-lights',
      feeds: { sound: null },
      presskit: '/u/northern-lights',
    },
  } as PublicProfile;
}

function renderSections() {
  const rootRoute = createRootRoute({
    component: () => (
      <ChannelCatalogSections
        username="northern-lights"
        displayName="Northern Lights"
        channelSlug="northern-lights"
      />
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return render(<RouterProvider router={router} />);
}

describe('ChannelCatalogSections', () => {
  beforeEach(() => {
    vi.mocked(fetchProfile).mockReset();
  });

  it('shows a loading section before the profile arrives', async () => {
    vi.mocked(fetchProfile).mockReturnValue(new Promise(() => undefined));
    renderSections();
    expect(await screen.findByText('Loading releases…')).toBeInTheDocument();
  });

  it('retries when the profile fails', async () => {
    vi.mocked(fetchProfile).mockRejectedValueOnce(new Error('down'));
    renderSections();
    expect(
      await screen.findByText("Releases couldn't load"),
    ).toBeInTheDocument();
    vi.mocked(fetchProfile).mockResolvedValue({
      data: profile([], []),
      meta: { source: 'mock' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No releases yet.')).toBeInTheDocument();
    expect(screen.getByText('No playlists yet.')).toBeInTheDocument();
  });

  it('lists the profile releases and playlists', async () => {
    vi.mocked(fetchProfile).mockResolvedValue({
      data: profile(
        [{ id: 'rel-1', title: 'First Light', type: 'Album', tracks: [] }],
        [
          {
            slug: 'night-drive',
            name: 'Night drive',
            type: 'PLAYLIST',
            style: 'ambient',
            description: null,
            coverUrl: null,
            isFeatured: false,
            itemCount: 3,
            url: '/u/northern-lights/c/night-drive',
            rssUrl: '/feed',
          },
        ],
      ),
      meta: { source: 'mock' },
    });
    renderSections();
    expect(await screen.findByText('First Light')).toBeInTheDocument();
    expect(screen.getByText('Night drive')).toBeInTheDocument();
  });
});
