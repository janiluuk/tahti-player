// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CollectionPlayer } from './CollectionPlayer';

const TRACKS = [
  { id: 't1', title: 'Nightriders vol. 43', durationLabel: '36:59' },
  { id: 't2', title: 'Producer set of Trance', durationLabel: '1:53:03' },
  { id: 't3', title: 'Warmup set @ Eiranranta', durationLabel: '1:10:29' },
];

const base = {
  title: 'Recorded sets from gigs',
  tracks: TRACKS,
  onPlayAll: vi.fn(),
  onPlayTrack: vi.fn(),
};

describe('CollectionPlayer', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows the kind, count and likes, and plays the whole collection', () => {
    render(<CollectionPlayer {...base} trackCount={178} likeCount={2} />);
    expect(screen.getByText('178 Sounds')).toBeVisible();
    expect(screen.getByText('2 Likes')).toBeVisible();
    fireEvent.click(
      screen.getByRole('button', { name: 'Play Recorded sets from gigs' }),
    );
    expect(base.onPlayAll).toHaveBeenCalledTimes(1);
  });

  it('plays the clicked row from its position', () => {
    render(<CollectionPlayer {...base} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Play Producer set of Trance' }),
    );
    expect(base.onPlayTrack).toHaveBeenCalledWith(1);
  });

  it('marks the playing row and pauses from it or from the big button', () => {
    const onTogglePlayback = vi.fn();
    render(
      <CollectionPlayer
        {...base}
        currentTrackId="t3"
        isPlaying
        onTogglePlayback={onTogglePlayback}
      />,
    );
    const rows = screen.getAllByTestId('collection-player-row');
    expect(rows[2]).toHaveAttribute('aria-current', 'true');
    expect(rows[0]).not.toHaveAttribute('aria-current');
    fireEvent.click(within(rows[2].parentElement!).getByRole('button'));
    fireEvent.click(
      screen.getByRole('button', { name: 'Pause Recorded sets from gigs' }),
    );
    expect(onTogglePlayback).toHaveBeenCalledTimes(2);
    expect(base.onPlayAll).not.toHaveBeenCalled();
  });

  it('links to the full list only when it shows part of it', () => {
    const renderShowAll = (label: string, children: React.ReactNode) => (
      <a href="/c/sets" aria-label={label}>
        {children}
      </a>
    );
    const { rerender } = render(
      <CollectionPlayer
        {...base}
        trackCount={178}
        renderShowAll={renderShowAll}
      />,
    );
    expect(
      screen.getByRole('link', { name: 'Show all 178 Sounds' }),
    ).toBeVisible();
    rerender(<CollectionPlayer {...base} renderShowAll={renderShowAll} />);
    expect(screen.queryByRole('link')).toBeNull();
  });
});
