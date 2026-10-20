// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import { ChannelPlaylistBlock } from './ChannelPlaylistBlock';

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  useNavigate: () => () => undefined,
}));

describe('ChannelPlaylistBlock', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows PageError on fetch failure and recovers on retry', async () => {
    const fetchCollection = vi
      .spyOn(client, 'fetchCollection')
      .mockRejectedValueOnce(new Error('HTTP 502'))
      .mockResolvedValueOnce({
        data: {
          slug: 'night-mix',
          name: 'Night Mix',
          description: null,
          coverUrl: null,
          isPublic: true,
          collaborative: false,
          user: { username: 'ada', displayName: 'Ada' },
          items: [],
          links: { page: '/u/ada/c/night-mix', rss: '' },
        },
        meta: { source: 'api' },
      });
    render(<ChannelPlaylistBlock playlistSlug="night-mix" />);
    expect(await screen.findByText('Could not load playlist')).toBeTruthy();
    expect(screen.getByText('HTTP 502')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Night Mix')).toBeTruthy();
    expect(await screen.findByText('No playable tracks yet')).toBeTruthy();
    expect(fetchCollection).toHaveBeenCalledTimes(2);
  });
});
