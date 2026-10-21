import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChannelNowPlaying } from '../../api/channel-now-playing-types';
import {
  fetchRadioShowNowPlaying,
  fetchRadioShowUpcoming,
} from '../../api/shows';
import { useRotationNowPlaying } from './useRotationNowPlaying';

vi.mock('../../api/shows', () => ({
  fetchRadioShowNowPlaying: vi.fn(),
  fetchRadioShowUpcoming: vi.fn(),
}));

const NOW = Date.parse('2026-10-03T12:00:00.000Z');

const current: ChannelNowPlaying = {
  title: 'Aurora',
  artistName: 'Viivi',
  artistUsername: 'viivi',
  artworkUrl: null,
  durationSec: 60,
  startedAt: new Date(NOW - 50_000).toISOString(),
};

const following = {
  title: 'Usa',
  artistName: 'Kaiku',
  artistUsername: null,
  artworkUrl: null,
  durationSec: 120,
  startedAt: new Date(NOW + 11_000).toISOString(),
};

const api = { source: 'api' as const };

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe('useRotationNowPlaying', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('does not fetch while the track is still playing', async () => {
    renderHook(() => useRotationNowPlaying('selects', current, null));
    await advance(9_000);
    expect(fetchRadioShowNowPlaying).not.toHaveBeenCalled();
  });

  it('switches to the next track when startedAt changes after the end', async () => {
    vi.mocked(fetchRadioShowNowPlaying)
      .mockResolvedValueOnce({ data: current, meta: api })
      .mockResolvedValueOnce({ data: following, meta: api });
    vi.mocked(fetchRadioShowUpcoming).mockResolvedValue({
      data: [
        {
          id: 'x',
          title: 'Pohjoinen',
          artistName: 'Lumi',
          artistUsername: 'lumi',
          artworkUrl: null,
        },
      ],
      meta: api,
    });
    const { result } = renderHook(() =>
      useRotationNowPlaying('selects', current, {
        title: 'Usa',
        artistName: 'Kaiku',
        artistUsername: null,
      }),
    );

    await advance(10_000);
    expect(fetchRadioShowNowPlaying).toHaveBeenCalledTimes(1);
    expect(result.current.nowPlaying?.title).toBe('Aurora');

    await advance(5_000);
    expect(fetchRadioShowNowPlaying).toHaveBeenCalledTimes(2);
    expect(fetchRadioShowNowPlaying).toHaveBeenCalledWith('selects');
    expect(result.current.nowPlaying?.title).toBe('Usa');
    expect(result.current.next).toEqual({
      title: 'Pohjoinen',
      artistName: 'Lumi',
      artistUsername: 'lumi',
    });

    await advance(60_000);
    expect(fetchRadioShowNowPlaying).toHaveBeenCalledTimes(2);
  });

  it('backs off 5s, 10s, 20s and then stops when nothing changes', async () => {
    vi.mocked(fetchRadioShowNowPlaying).mockResolvedValue({
      data: current,
      meta: api,
    });
    renderHook(() => useRotationNowPlaying('selects', current, null));

    await advance(10_000);
    expect(fetchRadioShowNowPlaying).toHaveBeenCalledTimes(1);
    await advance(5_000);
    expect(fetchRadioShowNowPlaying).toHaveBeenCalledTimes(2);
    await advance(9_999);
    expect(fetchRadioShowNowPlaying).toHaveBeenCalledTimes(2);
    await advance(1);
    expect(fetchRadioShowNowPlaying).toHaveBeenCalledTimes(3);
    await advance(20_000);
    expect(fetchRadioShowNowPlaying).toHaveBeenCalledTimes(4);
    await advance(120_000);
    expect(fetchRadioShowNowPlaying).toHaveBeenCalledTimes(4);
    expect(fetchRadioShowUpcoming).not.toHaveBeenCalled();
  });

  it('never fetches without a usable duration', async () => {
    renderHook(() =>
      useRotationNowPlaying('selects', { ...current, durationSec: null }, null),
    );
    await advance(300_000);
    expect(fetchRadioShowNowPlaying).not.toHaveBeenCalled();
  });

  it('skips the up-next lookup for a non-curated channel', async () => {
    vi.mocked(fetchRadioShowNowPlaying).mockResolvedValue({
      data: following,
      meta: api,
    });
    const { result } = renderHook(() =>
      useRotationNowPlaying('artist', current, null),
    );
    await advance(10_000);
    expect(result.current.nowPlaying?.title).toBe('Usa');
    expect(result.current.next).toBeNull();
    expect(fetchRadioShowUpcoming).not.toHaveBeenCalled();
  });
});
