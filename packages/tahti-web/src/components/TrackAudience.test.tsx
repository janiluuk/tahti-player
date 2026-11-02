// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TrackAudience } from './TrackAudience';

const fetchSoundAudience = vi.hoisted(() => vi.fn());
vi.mock('../api/sound-audience', () => ({ fetchSoundAudience }));

async function renderAudience() {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <TrackAudience channelSlug="demo" soundId="s1" />,
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

const person = {
  username: 'liina',
  displayName: 'Liina',
  avatarUrl: null,
  at: new Date().toISOString(),
};

describe('TrackAudience', () => {
  afterEach(() => {
    cleanup();
    fetchSoundAudience.mockReset();
  });

  it('shows the four tabs with totals and links collections to their page', async () => {
    fetchSoundAudience.mockResolvedValue({
      data: {
        collections: {
          total: 1,
          items: [
            {
              slug: 'night',
              name: 'Night drives',
              coverUrl: null,
              ownerUsername: 'liina',
              ownerName: 'Liina',
              itemCount: 2,
            },
          ],
        },
        likes: { total: 5, items: [person] },
        reposts: { total: 0, items: [] },
        plays: { total: 1, items: [{ ...person, plays: 3 }] },
      },
      meta: { source: 'api' },
    });
    await renderAudience();
    expect(fetchSoundAudience).toHaveBeenCalledWith('demo', 's1');
    const tabs = (await screen.findAllByRole('tab')).map(
      (tab) => tab.textContent,
    );
    expect(tabs).toEqual(['Collections1', 'Liked5', 'Reposted0', 'Played by1']);
    expect(
      screen.getByText('Night drives').closest('a')?.getAttribute('href'),
    ).toBe('/u/liina/c/night');
    expect(screen.getByText('by Liina · 2 tracks')).toBeTruthy();
  });

  it('offers a retry when the API fails', async () => {
    fetchSoundAudience.mockResolvedValue({
      data: {
        collections: { total: 0, items: [] },
        likes: { total: 0, items: [] },
        reposts: { total: 0, items: [] },
        plays: { total: 0, items: [] },
      },
      meta: { source: 'api', reason: 'HTTP 500' },
    });
    await renderAudience();
    expect(await screen.findByText('Could not load who listened')).toBeTruthy();
  });

  it('loads the next page of one tab with Show more', async () => {
    fetchSoundAudience
      .mockResolvedValueOnce({
        data: {
          collections: { total: 0, items: [] },
          likes: { total: 2, items: [person] },
          reposts: { total: 0, items: [] },
          plays: { total: 0, items: [] },
        },
        meta: { source: 'api' },
      })
      .mockResolvedValueOnce({
        data: {
          collections: { total: 0, items: [] },
          likes: {
            total: 0,
            items: [{ ...person, username: 'mart', displayName: 'Mart' }],
          },
          reposts: { total: 0, items: [] },
          plays: { total: 0, items: [] },
        },
        meta: { source: 'api' },
      });
    await renderAudience();
    fireEvent.click(await screen.findByRole('tab', { name: /Liked/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Show more' }));
    expect(fetchSoundAudience).toHaveBeenLastCalledWith('demo', 's1', {
      tab: 'likes',
      offset: 1,
    });
    expect(await screen.findByText('Mart')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Show more' })).toBeNull();
  });
});
