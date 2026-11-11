// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchEmbedThumbnail } from '../lib/embedThumbnail';
import { EmbedTrackRow } from './EmbedTrackRow';

vi.mock('../stores/playerStore', () => ({
  usePlayerStore: (
    select: (state: { currentId: null; status: string }) => unknown,
  ) => select({ currentId: null, status: 'idle' }),
}));

vi.mock('../lib/embedThumbnail', () => ({
  fetchEmbedThumbnail: vi.fn().mockResolvedValue(null),
}));

vi.mock('./HearthisEmbedHost', () => ({
  useHearthisEmbedClaim: () => undefined,
}));

describe('EmbedTrackRow', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows the cover artwork when bannerUrl is set', () => {
    const { container } = render(
      <EmbedTrackRow
        title="Night Drive"
        provider="SPOTIFY"
        embedUri="spotify:track:abc"
        artworkUrl="https://cdn.example/cover.jpg"
      />,
    );
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://cdn.example/cover.jpg',
    );
  });

  it('still renders a play control when artwork is missing', () => {
    render(
      <EmbedTrackRow
        title="Night Drive"
        provider="SPOTIFY"
        embedUri="spotify:track:abc"
      />,
    );
    expect(
      screen.getByRole('button', {
        name: 'Play Night Drive on Spotify',
      }),
    ).toBeVisible();
  });

  it('reports a soft-filled cover to the owner callback', async () => {
    vi.mocked(fetchEmbedThumbnail).mockResolvedValueOnce(
      'https://img.example/soft.jpg',
    );
    const onSoftArtwork = vi.fn();
    const { container } = render(
      <EmbedTrackRow
        title="Night Drive"
        provider="MIXCLOUD"
        embedUri="https://www.mixcloud.com/dj/night-drive/"
        onSoftArtwork={onSoftArtwork}
      />,
    );
    await waitFor(() =>
      expect(onSoftArtwork).toHaveBeenCalledWith(
        'https://img.example/soft.jpg',
      ),
    );
    expect(onSoftArtwork).toHaveBeenCalledTimes(1);
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://img.example/soft.jpg',
    );
  });

  it('never looks up a thumbnail when the cover is stored', () => {
    vi.mocked(fetchEmbedThumbnail).mockClear();
    render(
      <EmbedTrackRow
        title="Night Drive"
        provider="SPOTIFY"
        embedUri="spotify:track:abc"
        artworkUrl="https://cdn.example/cover.jpg"
        onSoftArtwork={vi.fn()}
      />,
    );
    expect(fetchEmbedThumbnail).not.toHaveBeenCalled();
  });
});
