import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PlayerWaveform } from './PlayerWaveform';

vi.mock('wavesurfer.js', () => ({
  default: {
    create: vi.fn(() => ({
      on: vi.fn(() => vi.fn()),
      destroy: vi.fn(),
      setTime: vi.fn(),
      setOptions: vi.fn(),
      getCurrentTime: vi.fn(() => 0),
      options: {},
    })),
  },
}));

describe('PlayerWaveform', () => {
  it('turns labelled comment markers into seek buttons', () => {
    const onSeek = vi.fn();
    render(
      <PlayerWaveform
        trackId="t1"
        peaks={[10, 200, 40]}
        durationSec={200}
        label="First Light"
        onSeek={onSeek}
        markers={[
          { fraction: 0.2, label: '0:40 · 2 comments', count: 2 },
          { fraction: 0.6, label: '2:00 · Aino: nice' },
        ]}
      />,
    );
    const markers = screen.getAllByTestId('waveform-comment-marker');
    expect(markers).toHaveLength(2);
    expect(markers[0]).toHaveAccessibleName(
      'Jump to comment: 0:40 · 2 comments',
    );
    expect(markers[0]).toHaveTextContent('2');
    fireEvent.click(markers[1]!);
    expect(onSeek).toHaveBeenCalledWith(0.6);
  });

  it('keeps unlabelled markers decorative', () => {
    render(
      <PlayerWaveform
        trackId="t1"
        durationSec={100}
        onSeek={vi.fn()}
        markers={[{ fraction: 0.5 }]}
      />,
    );
    expect(screen.queryByTestId('waveform-comment-marker')).toBeNull();
  });
});
