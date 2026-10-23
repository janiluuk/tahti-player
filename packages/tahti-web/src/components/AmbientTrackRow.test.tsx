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
});
