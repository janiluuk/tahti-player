import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as client from '../../api/client';
import * as discover from '../../api/discover';
import * as latestReleases from '../../api/latest-releases';
import { usePlayerStore } from '../../stores/playerStore';
import { renderWithRouter } from '../../test/renderWithRouter';
import { NewReleasesRow, TahtiSelectsRow, TrendingRow } from './HomeHighlights';

const track = (id: string, title: string) => ({
  id: `sound:${id}`,
  title,
  artist: 'Liis Kask',
  channelSlug: 'liis-kask',
  coverUrl: null,
});

describe('HomeHighlights', () => {
  it('shows curated Selects linking to the track and artist', async () => {
    vi.spyOn(discover, 'fetchTahtiSelects').mockResolvedValue({
      data: [track('s1', 'Acoustic Set')],
      meta: { source: 'api' },
    });

    await renderWithRouter(<TahtiSelectsRow />);

    const link = await screen.findByRole('link', { name: 'Acoustic Set' });
    expect(link).toHaveAttribute('href', '/t/s1');
    expect(screen.getByRole('link', { name: 'Liis Kask' })).toHaveAttribute(
      'href',
      '/channel/liis-kask',
    );
  });

  it('ranks the week’s most played tracks', async () => {
    vi.spyOn(discover, 'fetchTopTracks').mockResolvedValue({
      data: [track('a', 'First'), track('b', 'Second')],
      meta: { source: 'api' },
    });

    await renderWithRouter(<TrendingRow />);

    expect(await screen.findByRole('link', { name: '1. First' })).toBeVisible();
    expect(screen.getByRole('link', { name: '2. Second' })).toBeVisible();
  });

  it('plays a release from its card, shows its type pill and preserves its title link', async () => {
    usePlayerStore.setState(usePlayerStore.getInitialState());
    vi.spyOn(client, 'fetchSmartLink').mockResolvedValue({
      data: {
        release: {
          id: 'r1',
          title: 'Night Drive',
          tracks: [
            {
              id: 't1',
              title: 'First track',
              position: 1,
              soundId: 's1',
              audioUrl: 'https://example.com/first.mp3',
            },
            {
              id: 't2',
              title: 'Second track',
              position: 2,
              soundId: 's2',
              audioUrl: 'https://example.com/second.mp3',
            },
          ],
        },
        artist: { username: 'liis', displayName: 'Liis Kask', avatarUrl: null },
        targets: {},
        featuredCollections: [],
        profileUrl: '/u/liis',
        releaseUrl: '/r/liis-night-drive',
        embedUrl: '',
      },
      meta: { source: 'api' },
    });
    vi.spyOn(latestReleases, 'fetchLatestReleases').mockResolvedValue({
      data: [
        {
          id: 'r1',
          title: 'Night Drive',
          type: 'EP',
          releaseDate: '2026-09-25T00:00:00.000Z',
          artworkUrl: null,
          smartLinkSlug: 'liis-night-drive',
          artistDisplayName: 'Liis Kask',
          artistUsername: 'liis',
        },
      ],
      meta: { source: 'api' },
    });

    await renderWithRouter(<NewReleasesRow />);

    expect(
      await screen.findByRole('link', { name: 'Night Drive' }),
    ).toHaveAttribute('href', '/r/liis-night-drive');
    expect(screen.getByRole('link', { name: 'Liis Kask' })).toBeVisible();
    expect(screen.getByText('EP')).toBeVisible();
    await userEvent.click(
      screen.getByRole('button', { name: 'Play Night Drive' }),
    );
    await waitFor(() =>
      expect(usePlayerStore.getState().currentId).toBe('sound:s1'),
    );
    expect(usePlayerStore.getState().queue).toHaveLength(2);
    expect(screen.getByTestId('card')).toHaveAttribute('data-playing', 'true');
    await userEvent.click(
      screen.getByRole('button', { name: 'Pause Night Drive' }),
    );
    expect(usePlayerStore.getState().status).toBe('paused');
    expect(screen.getByTestId('card')).not.toHaveAttribute('data-playing');
  });

  it('offers Retry when the request fails', async () => {
    vi.spyOn(discover, 'fetchTahtiSelects').mockResolvedValue({
      data: [],
      meta: { source: 'mock', reason: 'Network error' },
    });

    await renderWithRouter(<TahtiSelectsRow />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Retry/ })).toBeVisible(),
    );
  });
});
