import { describe, expect, it } from 'vitest';

import { RADIO_STATIONS } from '../content/radioStations';
import { radioRingNeighbors, radioStationRing } from './radioStationRing';

describe('radioStationRing', () => {
  it('starts with Tahti Radio, then the curated stations in list order', () => {
    const ring = radioStationRing();
    expect(ring[0]).toEqual({
      kind: 'channel',
      slug: 'tahti-radio',
      name: 'Tahti Radio',
    });
    expect(
      ring.slice(1).map((stop) => stop.kind === 'station' && stop.id),
    ).toEqual(RADIO_STATIONS.map((station) => station.id));
  });

  it('wraps round at both ends', () => {
    const last = RADIO_STATIONS[RADIO_STATIONS.length - 1]!;
    expect(
      radioRingNeighbors({ kind: 'channel', slug: 'tahti-radio', name: 'x' }),
    ).toMatchObject({
      prev: { kind: 'station', id: last.id },
      next: { kind: 'station', id: RADIO_STATIONS[0]!.id },
    });
    expect(radioRingNeighbors({ kind: 'station', id: last.id })).toMatchObject({
      next: { kind: 'channel', slug: 'tahti-radio' },
    });
  });

  it('adds another radio channel to the front of its own ring', () => {
    expect(
      radioRingNeighbors({
        kind: 'channel',
        slug: 'night-fm',
        name: 'Night FM',
      }),
    ).toMatchObject({
      prev: {
        kind: 'station',
        id: RADIO_STATIONS[RADIO_STATIONS.length - 1]!.id,
      },
      next: { kind: 'channel', slug: 'tahti-radio' },
    });
  });

  it('has no neighbours for an unknown station', () => {
    expect(radioRingNeighbors({ kind: 'station', id: 'nope' })).toBeNull();
  });
});
