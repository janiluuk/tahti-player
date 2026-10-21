import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChannelNowPlaying } from '../../api/channel-now-playing-types';
import {
  ChannelStageTrackMeta,
  computeTrackProgress,
} from './ChannelStageTrackMeta';

const NOW = Date.parse('2026-10-03T12:00:00.000Z');

function track(overrides: Partial<ChannelNowPlaying> = {}): ChannelNowPlaying {
  return {
    title: 'Aurora',
    artistName: 'Viivi',
    artistUsername: 'viivi',
    artworkUrl: null,
    durationSec: 200,
    startedAt: new Date(NOW - 50_000).toISOString(),
    ...overrides,
  };
}

describe('computeTrackProgress', () => {
  it('returns elapsed and remaining seconds', () => {
    expect(
      computeTrackProgress(new Date(NOW - 50_000).toISOString(), 200, NOW),
    ).toEqual({ elapsedSec: 50, remainingSec: 150, durationSec: 200 });
  });

  it('is null when startedAt or durationSec is missing or invalid', () => {
    const started = new Date(NOW).toISOString();
    expect(computeTrackProgress(undefined, 200, NOW)).toBeNull();
    expect(computeTrackProgress(started, null, NOW)).toBeNull();
    expect(computeTrackProgress(started, undefined, NOW)).toBeNull();
    expect(computeTrackProgress(started, 0, NOW)).toBeNull();
    expect(computeTrackProgress(started, Number.NaN, NOW)).toBeNull();
    expect(computeTrackProgress('not a date', 200, NOW)).toBeNull();
  });

  it('clamps small clock skew and a short overrun', () => {
    expect(
      computeTrackProgress(new Date(NOW + 5_000).toISOString(), 200, NOW),
    ).toMatchObject({ elapsedSec: 0, remainingSec: 200 });
    expect(
      computeTrackProgress(new Date(NOW - 210_000).toISOString(), 200, NOW),
    ).toMatchObject({ elapsedSec: 200, remainingSec: 0 });
  });

  it('is null when the track started far in the future or ended long ago', () => {
    expect(
      computeTrackProgress(new Date(NOW + 120_000).toISOString(), 200, NOW),
    ).toBeNull();
    expect(
      computeTrackProgress(new Date(NOW - 600_000).toISOString(), 200, NOW),
    ).toBeNull();
  });
});

describe('ChannelStageTrackMeta', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows time left and ticks down every second', () => {
    render(<ChannelStageTrackMeta nowPlaying={track()} />);

    expect(screen.getByText('2:30 left')).toBeInTheDocument();
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '50');

    act(() => {
      vi.advanceTimersByTime(3_000);
    });

    expect(screen.getByText('2:27 left')).toBeInTheDocument();
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '53');
  });

  it('hides the progress bar once the track has overrun by too long', () => {
    render(
      <ChannelStageTrackMeta
        nowPlaying={track({
          startedAt: new Date(NOW - 195_000).toISOString(),
        })}
      />,
    );
    expect(screen.getByText('0:05 left')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(40_000);
    });

    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
  });

  it('renders nothing without a duration and no next track', () => {
    const { container } = render(
      <ChannelStageTrackMeta
        nowPlaying={track({ durationSec: null })}
        next={null}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for an older API response without timing fields', () => {
    const { container } = render(
      <ChannelStageTrackMeta
        nowPlaying={{
          title: 'Aurora',
          artistName: 'Viivi',
          artistUsername: null,
          artworkUrl: null,
        }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the up-next track when given', () => {
    render(
      <ChannelStageTrackMeta
        nowPlaying={track({ durationSec: null })}
        next={{ title: 'Usa', artistName: 'Kaiku', artistUsername: null }}
      />,
    );

    expect(screen.getByText(/Up next:/)).toBeInTheDocument();
    expect(screen.getByText(/Usa - Kaiku/)).toBeInTheDocument();
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
  });
});
