import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchUserReposts } from '../../api/user-reposts';
import { ArtistReposts } from './ArtistReposts';

vi.mock('../../api/user-reposts', () => ({ fetchUserReposts: vi.fn() }));

async function renderReposts(
  items: Awaited<ReturnType<typeof fetchUserReposts>>['data'],
) {
  vi.mocked(fetchUserReposts).mockResolvedValue({
    data: items,
    meta: { source: 'api' },
  });
  let result: ReturnType<typeof render> | undefined;
  await act(async () => {
    result = render(
      <RouterProvider
        router={createRouter({
          routeTree: createRootRoute({
            component: () => <ArtistReposts username="selector" />,
          }),
          history: createMemoryHistory({ initialEntries: ['/'] }),
        })}
      />,
    );
  });
  return result!;
}

describe('ArtistReposts', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('links each repost to its track and the original artist', async () => {
    await renderReposts([
      {
        id: 's1',
        title: 'Borrowed Light',
        bannerUrl: null,
        channelSlug: 'night-drive',
        artistUsername: 'nightdrive',
        artistDisplayName: 'Night Drive',
        repostedAt: '2026-09-30T12:00:00.000Z',
        url: '/c/night-drive#sound-item-s1',
      },
    ]);
    expect(fetchUserReposts).toHaveBeenCalledWith('selector');
    expect(
      (
        await screen.findByRole('link', { name: 'Borrowed Light' })
      ).getAttribute('href'),
    ).toBe('/t/s1');
    expect(
      screen.getByRole('link', { name: 'Night Drive' }).getAttribute('href'),
    ).toBe('/u/nightdrive');
  });

  it('renders nothing without reposts', async () => {
    await renderReposts([]);
    expect(screen.queryByText('Reposts')).toBeNull();
  });
});
