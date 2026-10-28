import { describe, expect, it } from 'vitest';

import {
  computeListeningPartyTimeline,
  listeningPartyDurationSec,
  serverClockOffsetMs,
} from './listeningPartyTimeline';

const START = '2026-11-06T20:00:00.000Z';
const startMs = Date.parse(START);
const tracks = [
  { id: 'b', position: 2, durationSec: 120 },
  { id: 'a', position: 1, durationSec: 60 },
  { id: 'c', position: 3, durationSec: 30 },
];

function at(secondsFromStart: number) {
  return computeListeningPartyTimeline({
    startAt: START,
    tracks,
    now: startMs + secondsFromStart * 1000,
  });
}

describe('computeListeningPartyTimeline', () => {
  it('is SCHEDULED before the start, with the end at start + total length', () => {
    const timeline = at(-1);
    expect(timeline.state).toBe('SCHEDULED');
    expect(timeline.nowPlaying).toBeNull();
    expect(timeline.endAt.toISOString()).toBe('2026-11-06T20:03:30.000Z');
  });

  it('plays the first track by position at the exact start', () => {
    expect(at(0)).toMatchObject({
      state: 'LIVE',
      nowPlaying: { trackId: 'a', position: 1, offsetSec: 0 },
    });
  });

  it('hands over to the next track at offset 0 on an exact boundary', () => {
    expect(at(60).nowPlaying).toEqual({
      trackId: 'b',
      position: 2,
      offsetSec: 0,
    });
    expect(at(179.5).nowPlaying).toEqual({
      trackId: 'b',
      position: 2,
      offsetSec: 119.5,
    });
  });

  it('is ENDED at the end itself and after', () => {
    expect(at(209.999).state).toBe('LIVE');
    expect(at(210)).toMatchObject({ state: 'ENDED', nowPlaying: null });
    expect(at(10_000).state).toBe('ENDED');
  });

  it('is CANCELED whatever the clock says', () => {
    const timeline = computeListeningPartyTimeline({
      startAt: START,
      tracks,
      canceledAt: '2026-11-01T00:00:00.000Z',
      now: startMs + 30_000,
    });
    expect(timeline).toMatchObject({ state: 'CANCELED', nowPlaying: null });
  });

  it('treats missing or negative durations as zero length', () => {
    const timeline = computeListeningPartyTimeline({
      startAt: START,
      tracks: [
        { id: 'x', position: 1, durationSec: null },
        { id: 'y', position: 2, durationSec: -5 },
        { id: 'z', position: 3, durationSec: 10 },
      ],
      now: new Date(startMs + 1000),
    });
    expect(timeline.nowPlaying?.trackId).toBe('z');
    expect(timeline.endAt.getTime()).toBe(startMs + 10_000);
  });

  it('ends immediately when there are no tracks', () => {
    expect(
      computeListeningPartyTimeline({
        startAt: START,
        tracks: [],
        now: startMs,
      }).state,
    ).toBe('ENDED');
  });
});

describe('listeningPartyDurationSec', () => {
  it('sums the track lengths', () => {
    expect(listeningPartyDurationSec(tracks)).toBe(210);
    expect(listeningPartyDurationSec([{ durationSec: null }])).toBe(0);
  });
});

describe('serverClockOffsetMs', () => {
  it('is how far the server clock is ahead of the local one', () => {
    expect(serverClockOffsetMs(START, startMs - 1500)).toBe(1500);
    expect(serverClockOffsetMs(START, startMs + 200)).toBe(-200);
  });

  it('is zero for an unreadable server time', () => {
    expect(serverClockOffsetMs('not a date', startMs)).toBe(0);
  });
});
