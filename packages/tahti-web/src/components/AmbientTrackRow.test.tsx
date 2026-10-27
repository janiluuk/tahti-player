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
});
