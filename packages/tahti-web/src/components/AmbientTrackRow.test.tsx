import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AmbientTrackRow } from './AmbientTrackRow';

describe('AmbientTrackRow', () => {
  it('keeps the artwork beside the title and waveform at every density', () => {
    const thumbs = {
      comfortable: 'size-32',
      compact: 'size-28',
      dense: 'size-24',
    } as const;
    for (const density of ['comfortable', 'compact', 'dense'] as const) {
      const { unmount } = render(
        <AmbientTrackRow
          trackId={density}
          title={density}
          artist="Aurora Keys"
          density={density}
          ambientRgb={null}
          stats={{ releaseDate: '2026-11-01T00:00:00Z', plays: 3 }}
        />,
      );
      const row = screen.getByTestId('ambient-track-row');
      expect(row.className).toContain('flex-nowrap');
      expect(row.className).toContain('max-md:grid-cols-[auto_minmax(0,1fr)]');
      expect(row.className).not.toContain(' flex-wrap');
      const artwork = screen.getByTestId('ambient-track-row-artwork');
      expect(artwork.className).toContain(thumbs[density]);
      expect(artwork.className).toContain('max-md:row-span-2');
      expect(
        screen.getByTestId('ambient-track-row-actions').className,
      ).toContain('max-md:col-span-2');
      expect(row.querySelectorAll('time')).toHaveLength(1);
      unmount();
    }
  });

  it('opts the row into its artwork reveal by a named group, not a bare one', () => {
    render(
      <AmbientTrackRow
        trackId="sound:s1"
        title="Night Drive"
        artist="Aurora Keys"
        onPlay={vi.fn()}
        ambientRgb={null}
      />,
    );
    const row = screen.getByTestId('ambient-track-row');
    expect(row.className).toMatch(/(^|\s)group\/media-row(\s|$)/);
    expect(row.className).not.toMatch(/(^|\s)group(\s|$)/);
  });

  it('queues on Shift+click of the artwork play control, without a second queue button', () => {
    const onPlay = vi.fn();
    const onQueue = vi.fn();
    render(
      <AmbientTrackRow
        trackId="sound:s1"
        title="Night Drive"
        artist="Aurora Keys"
        onPlay={onPlay}
        onQueue={onQueue}
        ambientRgb={null}
      />,
    );
    expect(screen.queryByTestId('media-artwork-queue')).toBeNull();
    const play = screen.getByTestId('media-artwork-play');
    fireEvent.click(play, { shiftKey: true });
    expect(onQueue).toHaveBeenCalledTimes(1);
    expect(onPlay).not.toHaveBeenCalled();
    fireEvent.click(play);
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('gives the seekbar the track length for time read-outs', () => {
    render(
      <AmbientTrackRow
        trackId="sound:s1"
        title="Night Drive"
        artist="Aurora Keys"
        peaks={null}
        progress={0.5}
        durationSec={100}
        onSeek={vi.fn()}
        ambientRgb={null}
      />,
    );
    expect(
      screen.getByRole('slider', { name: 'Seek Night Drive' }),
    ).toHaveAttribute('aria-valuetext', '0:50 of 1:40');
  });

  it('shows the genre pill, duration and public totals', () => {
    render(
      <AmbientTrackRow
        trackId="t-stats"
        title="Moody Electronica vol. 40"
        artist="Yaniho"
        genreLabel="Progressive House"
        durationLabel="46:03"
        ambientRgb={null}
        stats={{
          releaseDate: '2026-10-17T12:00:00.000Z',
          likes: 3,
          plays: 31,
          downloads: 15,
        }}
      />,
    );
    expect(screen.getByText('Progressive House')).toBeTruthy();
    expect(screen.getByText('46:03')).toBeTruthy();
    expect(screen.getByText('3 likes')).toBeTruthy();
    expect(screen.getByText('31 plays')).toBeTruthy();
    expect(screen.getByText('15 downloads')).toBeTruthy();
    const stats = screen.getByTestId('ambient-track-stats');
    expect(stats.textContent).not.toContain('on ');
    expect(stats.querySelector('time')?.getAttribute('datetime')).toBe(
      '2026-10-17T12:00:00.000Z',
    );
  });

  it('shows a like toggle with its count and keeps likes out of the stats', () => {
    const onToggle = vi.fn();
    render(
      <AmbientTrackRow
        trackId="t-like"
        title="Late Session"
        artist="Yaniho"
        ambientRgb={null}
        stats={{ likes: 3, plays: 9 }}
        like={{ liked: false, count: 3, onToggle }}
      />,
    );
    const button = screen.getByRole('button', {
      name: 'Like Late Session (3 likes)',
    });
    expect(button.getAttribute('aria-pressed')).toBe('false');
    button.click();
    expect(onToggle).toHaveBeenCalled();
    expect(screen.queryByLabelText('3 likes')).toBeNull();
    expect(screen.getByText('9 plays')).toBeTruthy();
  });

  it('uses the singular for one like and one play', () => {
    render(
      <AmbientTrackRow
        trackId="t-one"
        title="Solo"
        artist="Yaniho"
        ambientRgb={null}
        stats={{ plays: 1 }}
        like={{ liked: true, count: 1, onToggle: vi.fn() }}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Unlike Solo (1 like)' }),
    ).toBeTruthy();
    expect(screen.getByText('1 play')).toBeTruthy();
  });

  it('shows the comment count when the source has one', () => {
    render(
      <AmbientTrackRow
        trackId="t-comments"
        title="Set"
        artist="Yaniho"
        ambientRgb={null}
        stats={{ plays: 9, comments: 4 }}
      />,
    );
    expect(screen.getByText('4 comments')).toBeTruthy();
  });
});

it('replaces the waveform with an animated processing state until the upload is ready', () => {
  const { rerender } = render(
    <AmbientTrackRow
      trackId="new-upload"
      title="New upload"
      artist="You"
      processing
      onPlay={vi.fn()}
      ambientRgb={null}
    />,
  );
  expect(screen.getByRole('status')).toHaveTextContent('Processing audio');
  expect(screen.queryByRole('button', { name: 'Play New upload' })).toBeNull();
  rerender(
    <AmbientTrackRow
      trackId="new-upload"
      title="New upload"
      artist="You"
      peaks={[0, 255, 40]}
      durationSec={60}
      onPlay={vi.fn()}
      ambientRgb={null}
    />,
  );
  expect(screen.queryByRole('status')).toBeNull();
  expect(screen.getByRole('button', { name: 'Play New upload' })).toBeVisible();
});

it('shows the album track number before the title', () => {
  render(
    <AmbientTrackRow
      trackId="t2"
      title="Particular particle"
      artist="Yaniho"
      trackNumber={2}
      ambientRgb={null}
    />,
  );
  expect(screen.getByTestId('ambient-track-number')).toHaveTextContent('2.');
  expect(screen.getByRole('heading')).toHaveTextContent(
    '2.Particular particle',
  );
});
