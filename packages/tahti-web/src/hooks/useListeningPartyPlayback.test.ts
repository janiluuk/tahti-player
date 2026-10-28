import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  testClock,
  testParty,
} from '../components/listening-party/__fixtures__/party';
import { usePlayerStore } from '../stores/playerStore';
import { useListeningPartyPlayback } from './useListeningPartyPlayback';

describe('useListeningPartyPlayback', () => {
  afterEach(() => {
    usePlayerStore.setState({
      queue: [],
      currentId: null,
      status: 'idle',
      seekTarget: null,
      currentTime: 0,
    });
  });

  it('does nothing until the listener joins', () => {
    const party = testParty({ state: 'LIVE' });
    renderHook(() =>
      useListeningPartyPlayback(party, testClock(party, 150), false, vi.fn()),
    );
    expect(usePlayerStore.getState().currentId).toBeNull();
  });

  it('joins late at the party offset through the party stream', () => {
    const party = testParty({ state: 'LIVE' });
    renderHook(() =>
      useListeningPartyPlayback(party, testClock(party, 150), true, vi.fn()),
    );
    const state = usePlayerStore.getState();
    expect(state.currentId).toBe('party:lp1:t2');
    expect(state.seekTarget).toBe(30);
    expect(state.queue).toHaveLength(1);
    expect(JSON.stringify(state.queue[0])).toContain(
      '/api/v1/listening-parties/lp1/tracks/t2/stream',
    );
  });

  it('moves on to the next track with the timeline', () => {
    const party = testParty({ state: 'LIVE' });
    const { rerender } = renderHook(
      ({ seconds }) =>
        useListeningPartyPlayback(
          party,
          testClock(party, seconds),
          true,
          vi.fn(),
        ),
      { initialProps: { seconds: 10 } },
    );
    expect(usePlayerStore.getState().currentId).toBe('party:lp1:t1');
    rerender({ seconds: 121 });
    expect(usePlayerStore.getState().currentId).toBe('party:lp1:t2');
    expect(usePlayerStore.getState().seekTarget).toBe(1);
  });

  it('stops following once the party ends', () => {
    const party = testParty({ state: 'LIVE' });
    const onStop = vi.fn();
    const { rerender } = renderHook(
      ({ seconds }) =>
        useListeningPartyPlayback(
          party,
          testClock(party, seconds),
          true,
          onStop,
        ),
      { initialProps: { seconds: 10 } },
    );
    rerender({ seconds: 10_000 });
    expect(onStop).toHaveBeenCalledTimes(1);
  });
});
