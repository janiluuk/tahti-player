import { useEffect, useMemo, useState } from 'react';

import {
  computeListeningPartyTimeline,
  serverClockOffsetMs,
  type ListeningPartyTimeline,
  type ListeningPartyTimelineTrack,
} from '../lib/listeningPartyTimeline';

export type ListeningPartyClockInput = {
  startAt: string;
  serverNow: string;
  /** The server's own verdict; only CANCELED is taken from it, the rest is
   * recomputed every tick. */
  state: string;
  tracks: readonly ListeningPartyTimelineTrack[];
};

export type ListeningPartyClock = ListeningPartyTimeline & {
  /** Server time at this tick, in ms. */
  nowMs: number;
  msUntilStart: number;
};

const TICK_MS = 1000;

/**
 * Ticks the party timeline once a second on the server's clock: the offset
 * between `serverNow` and the local time the response arrived (`receivedAt`)
 * is added to `Date.now()`, so a device with a wrong clock still lands on
 * the same track and offset as everyone else.
 */
export function useListeningPartyTimeline(
  party: ListeningPartyClockInput | null,
  receivedAt: number,
  tickMs: number = TICK_MS,
): ListeningPartyClock | null {
  const offsetMs = party ? serverClockOffsetMs(party.serverNow, receivedAt) : 0;
  const [localNow, setLocalNow] = useState(() => Date.now());

  useEffect(() => {
    if (!party) {
      return;
    }
    setLocalNow(Date.now());
    const timer = window.setInterval(() => setLocalNow(Date.now()), tickMs);
    return () => window.clearInterval(timer);
  }, [party, tickMs]);

  return useMemo(() => {
    if (!party) {
      return null;
    }
    const nowMs = localNow + offsetMs;
    const timeline = computeListeningPartyTimeline({
      startAt: party.startAt,
      tracks: party.tracks,
      canceledAt: party.state === 'CANCELED' ? party.startAt : null,
      now: nowMs,
    });
    return {
      ...timeline,
      nowMs,
      msUntilStart: Math.max(0, new Date(party.startAt).getTime() - nowMs),
    };
  }, [party, localNow, offsetMs]);
}
