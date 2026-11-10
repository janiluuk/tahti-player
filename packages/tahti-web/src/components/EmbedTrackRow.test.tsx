// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EmbedTrackRow } from './EmbedTrackRow';

vi.mock('../stores/playerStore', () => ({
  usePlayerStore: (
    select: (state: { currentId: null; status: string }) => unknown,
  ) => select({ currentId: null, status: 'idle' }),
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
});
