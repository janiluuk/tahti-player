import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useListeningPartyTimeline } from './useListeningPartyTimeline';

const LOCAL_NOW = Date.parse('2026-11-06T19:59:00.000Z');

const party = {
  startAt: '2026-11-06T20:00:00.000Z',
  // The server is 30 s ahead of this device.
  serverNow: '2026-11-06T19:59:30.000Z',
  state: 'SCHEDULED',
  tracks: [
    { id: 'a', position: 1, durationSec: 20 },
    { id: 'b', position: 2, durationSec: 60 },
  ],
};

describe('useListeningPartyTimeline', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(LOCAL_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts down on the server clock, not the local one', () => {
    const { result } = renderHook(() =>
      useListeningPartyTimeline(party, LOCAL_NOW),
    );
    expect(result.current?.state).toBe('SCHEDULED');
    expect(result.current?.msUntilStart).toBe(30_000);
  });

  it('ticks into the party and across tracks', () => {
    const { result } = renderHook(() =>
      useListeningPartyTimeline(party, LOCAL_NOW),
    );
    act(() => {
      vi.advanceTimersByTime(55_000);
    });
    expect(result.current?.state).toBe('LIVE');
    expect(result.current?.nowPlaying).toMatchObject({
      trackId: 'b',
      offsetSec: 5,
    });
  });

  it('keeps a canceled party canceled', () => {
    const { result } = renderHook(() =>
      useListeningPartyTimeline({ ...party, state: 'CANCELED' }, LOCAL_NOW),
    );
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(result.current?.state).toBe('CANCELED');
    expect(result.current?.nowPlaying).toBeNull();
  });

  it('is null without a party', () => {
    const { result } = renderHook(() =>
      useListeningPartyTimeline(null, LOCAL_NOW),
    );
    expect(result.current).toBeNull();
  });
});
