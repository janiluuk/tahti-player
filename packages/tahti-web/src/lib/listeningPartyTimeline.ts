// Mirrors `computeListeningPartyTimeline` in tahti-org `@tahti/shared`
// (packages/shared/src/listening-party-timeline.ts); keep the boundary rules
// identical so the page and the server agree on what is playing.

export type ListeningPartyTimelineState =
  'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELED';

export type ListeningPartyTimelineTrack = {
  id: string;
  position: number;
  /** Null or negative counts as zero length. */
  durationSec: number | null;
};

export type ListeningPartyTimelineInput = {
  startAt: Date | string;
  tracks: readonly ListeningPartyTimelineTrack[];
  canceledAt?: Date | string | null;
  now: Date | number;
};

export type ListeningPartyTimeline = {
  state: ListeningPartyTimelineState;
  endAt: Date;
  nowPlaying: {
    trackId: string;
    position: number;
    /** Seconds into the track, fractional. */
    offsetSec: number;
  } | null;
};

function toMs(value: Date | string | number): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function trackMs(track: ListeningPartyTimelineTrack): number {
  return Math.max(0, track.durationSec ?? 0) * 1000;
}

/** Total running time of the tracks, in seconds. */
export function listeningPartyDurationSec(
  tracks: readonly Pick<ListeningPartyTimelineTrack, 'durationSec'>[],
): number {
  return tracks.reduce(
    (sum, track) => sum + Math.max(0, track.durationSec ?? 0),
    0,
  );
}

/**
 * State and now-playing at `now`. Tracks play once, in `position` order, with
 * no gaps. Intervals are half-open: a track owns [start, start + duration),
 * so at an exact boundary the next track is playing at offset 0, and at
 * `endAt` itself the party has ENDED.
 */
export function computeListeningPartyTimeline(
  input: ListeningPartyTimelineInput,
): ListeningPartyTimeline {
  const startMs = toMs(input.startAt);
  const nowMs = toMs(input.now);
  const ordered = [...input.tracks].sort((a, b) => a.position - b.position);
  const endMs = startMs + ordered.reduce((sum, t) => sum + trackMs(t), 0);
  const endAt = new Date(endMs);

  if (input.canceledAt) {
    return { state: 'CANCELED', endAt, nowPlaying: null };
  }
  if (nowMs < startMs) {
    return { state: 'SCHEDULED', endAt, nowPlaying: null };
  }
  if (nowMs >= endMs) {
    return { state: 'ENDED', endAt, nowPlaying: null };
  }

  let trackStartMs = startMs;
  for (const track of ordered) {
    const trackEndMs = trackStartMs + trackMs(track);
    if (nowMs < trackEndMs) {
      return {
        state: 'LIVE',
        endAt,
        nowPlaying: {
          trackId: track.id,
          position: track.position,
          offsetSec: (nowMs - trackStartMs) / 1000,
        },
      };
    }
    trackStartMs = trackEndMs;
  }
  return { state: 'ENDED', endAt, nowPlaying: null };
}

/** How far the server's clock is ahead of this device's, in ms: add it to
 * `Date.now()` to get server time. `receivedAt` is the local time the
 * response carrying `serverNow` arrived. */
export function serverClockOffsetMs(
  serverNow: string,
  receivedAt: number,
): number {
  const serverMs = new Date(serverNow).getTime();
  return Number.isFinite(serverMs) ? serverMs - receivedAt : 0;
}
