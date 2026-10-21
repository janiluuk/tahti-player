import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { hasPeaks, peaksToWaveSurfer } from './peaks';
import { Waveform } from './Waveform';

vi.mock('wavesurfer.js', () => ({
  default: {
    create: vi.fn(() => ({
      on: vi.fn(() => vi.fn()),
      destroy: vi.fn(),
      load: vi.fn(),
      setTime: vi.fn(),
      getCurrentTime: vi.fn(() => 0),
    })),
  },
}));

describe('peaksToWaveSurfer', () => {
  it('maps 0..255 buckets into one -1..1 channel', () => {
    const [channel] = peaksToWaveSurfer([0, 128, 255]);
    expect(channel?.[0]).toBe(-1);
    expect(channel?.[1]).toBeCloseTo(0, 1);
    expect(channel?.[2]).toBe(1);
  });

  it('treats empty peaks as empty', () => {
    expect(hasPeaks([])).toBe(false);
    expect(peaksToWaveSurfer([])).toEqual([[]]);
  });
});

describe('Waveform', () => {
  it('renders a peaks container', async () => {
    render(<Waveform peaks={[10, 200, 40]} durationSec={12} />);
    expect(
      await screen.findByRole('img', { name: 'Waveform' }),
    ).toHaveAttribute('data-waveform', 'peaks');
  });
});
