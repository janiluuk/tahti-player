import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as discover from '../../api/discover';
import * as latestReleases from '../../api/latest-releases';
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

  it('links new releases to their smart link page', async () => {
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
    expect(screen.getByRole('link', { name: 'EP · Liis Kask' })).toBeVisible();
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
