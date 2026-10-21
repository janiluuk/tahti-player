import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchLiveTracklist } from '../../api/live-tracklist';
import { ChannelLiveTracklist } from './ChannelLiveTracklist';

vi.mock('../../api/live-tracklist', () => ({ fetchLiveTracklist: vi.fn() }));

async function renderTracklist(
  entries: Awaited<ReturnType<typeof fetchLiveTracklist>>,
) {
  vi.mocked(fetchLiveTracklist).mockResolvedValue(entries);
  let result: ReturnType<typeof render> | undefined;
  await act(async () => {
    result = render(
      <RouterProvider
        router={createRouter({
          routeTree: createRootRoute({
            component: () => <ChannelLiveTracklist slug="night-drive" />,
          }),
          history: createMemoryHistory({ initialEntries: ['/'] }),
        })}
      />,
    );
  });
  return result!;
}

describe('ChannelLiveTracklist', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('lists the tracks identified so far with their offset', async () => {
    await renderTracklist([
      { startSec: 0, title: 'Opening drone', artist: 'Guest' },
      { startSec: 412, title: 'Borrowed Light', artistUsername: 'nightdrive' },
    ]);

    expect(fetchLiveTracklist).toHaveBeenCalledWith('night-drive');
    expect(screen.getByText('Opening drone')).toBeInTheDocument();
    expect(screen.getByText('6:52')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '@nightdrive' })).toHaveAttribute(
      'href',
      '/u/nightdrive',
    );
  });

  it('renders nothing before any track is identified', async () => {
    await renderTracklist([]);
    expect(
      screen.queryByRole('region', { name: 'Played in this broadcast' }),
    ).not.toBeInTheDocument();
  });
});
