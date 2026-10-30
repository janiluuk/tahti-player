import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AmbientTrackRow } from './AmbientTrackRow';

describe('AmbientTrackRow', () => {
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
    expect(screen.getByLabelText('3 likes')).toBeTruthy();
    expect(screen.getByLabelText('31 plays')).toBeTruthy();
    expect(screen.getByLabelText('15 downloads')).toBeTruthy();
    expect(screen.getByTestId('ambient-track-stats').textContent).toContain(
      'on ',
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
    expect(screen.getByLabelText('9 plays')).toBeTruthy();
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
    expect(screen.getByLabelText('4 comments')).toBeTruthy();
  });
});

it('replaces the waveform with an animated processing state until the upload is ready', () => {
  const loadAudioUrl = vi.fn();
  const { rerender } = render(
    <AmbientTrackRow
      trackId="new-upload"
      title="New upload"
      artist="You"
      processing
      onPlay={vi.fn()}
      loadAudioUrl={loadAudioUrl}
      ambientRgb={null}
    />,
  );
  expect(screen.getByRole('status')).toHaveTextContent('Processing audio');
  expect(screen.queryByRole('button', { name: 'Play New upload' })).toBeNull();
  expect(loadAudioUrl).not.toHaveBeenCalled();
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
