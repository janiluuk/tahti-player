import { describe, expect, it } from 'vitest';

import { partyPlayableId, partyPlaybackStep } from './listeningPartyPlayback';

const tracks = [
  { id: 'a', durationSec: 100 },
  { id: 'b', durationSec: 200 },
];

const live = (trackId: string, offsetSec: number) => ({
  state: 'LIVE' as const,
  nowPlaying: {
    trackId,
    position: trackId === 'a' ? 1 : 2,
    offsetSec,
  },
});

const playing = (trackId: string, currentTime: number) => ({
  currentId: partyPlayableId('lp1', trackId),
  currentTime,
  status: 'playing',
});

function step(
  overrides: Partial<Parameters<typeof partyPlaybackStep>[0]> = {},
) {
  return partyPlaybackStep({
    partyId: 'lp1',
    timeline: live('a', 50),
    tracks,
    loadedTrackId: 'a',
    player: playing('a', 50),
    msSinceLastSeek: 10_000,
    ...overrides,
  });
}

describe('partyPlaybackStep', () => {
  it('waits for the start, and stops following once the party is over', () => {
    expect(
      step({ timeline: { state: 'SCHEDULED', nowPlaying: null } }),
    ).toEqual({ kind: 'wait' });
    expect(step({ timeline: { state: 'ENDED', nowPlaying: null } })).toEqual({
      kind: 'over',
    });
    expect(step({ timeline: { state: 'CANCELED', nowPlaying: null } })).toEqual(
      { kind: 'over' },
    );
  });

  it('loads the current track at the party offset on a late join', () => {
    expect(
      step({
        loadedTrackId: null,
        timeline: live('b', 42.5),
        player: { currentId: null, currentTime: 0, status: 'idle' },
      }),
    ).toEqual({ kind: 'load', trackId: 'b', offsetSec: 42.5 });
  });

  it('advances to the next track when the timeline does', () => {
    expect(step({ timeline: live('b', 0.4) })).toEqual({
      kind: 'load',
      trackId: 'b',
      offsetSec: 0.4,
    });
  });

  it('re-seeks only past the drift threshold', () => {
    expect(step({ player: playing('a', 51.9) })).toEqual({ kind: 'wait' });
    expect(step({ player: playing('a', 47.5) })).toEqual({
      kind: 'seek',
      offsetSec: 50,
    });
  });

  it('lets a fresh seek settle and ignores drift while paused or loading', () => {
    expect(step({ player: playing('a', 40), msSinceLastSeek: 1000 })).toEqual({
      kind: 'wait',
    });
    expect(step({ player: { ...playing('a', 40), status: 'paused' } })).toEqual(
      { kind: 'wait' },
    );
    expect(step({ player: { ...playing('a', 0), status: 'loading' } })).toEqual(
      { kind: 'wait' },
    );
  });

  it('stops following when the listener plays something else mid-track', () => {
    expect(
      step({
        player: { currentId: 'sound-1', currentTime: 3, status: 'playing' },
      }),
    ).toEqual({ kind: 'left' });
  });

  it('does not mistake the end of a track handing over for leaving', () => {
    expect(
      step({
        timeline: live('a', 98.5),
        player: { currentId: 'radio:x', currentTime: 0, status: 'loading' },
      }),
    ).toEqual({ kind: 'wait' });
  });
});
