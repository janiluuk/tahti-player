import { TAHTI_RADIO_SLUG } from '../api/client';
import { RADIO_STATIONS } from '../content/radioStations';

export type RadioRingStop =
  | { kind: 'channel'; slug: string; name: string }
  | { kind: 'station'; id: string; name: string };

export type RadioRingCurrent =
  | { kind: 'channel'; slug: string; name: string }
  | { kind: 'station'; id: string };

function sameStop(stop: RadioRingStop, current: RadioRingCurrent): boolean {
  return stop.kind === 'channel'
    ? current.kind === 'channel' && current.slug === stop.slug
    : current.kind === 'station' && current.id === stop.id;
}

/** The stations a radio page can step through, in the order the Radio
 * pages list them: Tahti Radio first, then the curated stations. A radio
 * channel that isn't Tahti Radio joins the front of its own ring. */
export function radioStationRing(current?: RadioRingCurrent): RadioRingStop[] {
  const ring: RadioRingStop[] = [
    { kind: 'channel', slug: TAHTI_RADIO_SLUG, name: 'Tahti Radio' },
    ...RADIO_STATIONS.map((station) => ({
      kind: 'station' as const,
      id: station.id,
      name: station.name,
    })),
  ];
  if (
    current?.kind === 'channel' &&
    !ring.some((stop) => sameStop(stop, current))
  ) {
    ring.unshift(current);
  }
  return ring;
}

/** The stops either side of `current`, wrapping round at both ends; null
 * when `current` isn't in the ring or is the only stop. */
export function radioRingNeighbors(
  current: RadioRingCurrent,
): { prev: RadioRingStop; next: RadioRingStop } | null {
  const ring = radioStationRing(current);
  const index = ring.findIndex((stop) => sameStop(stop, current));
  if (index < 0 || ring.length < 2) {
    return null;
  }
  return {
    prev: ring[(index - 1 + ring.length) % ring.length]!,
    next: ring[(index + 1) % ring.length]!,
  };
}
