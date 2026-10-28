import type { ListeningPartyTimeline } from './listeningPartyTimeline';

/** Re-seek once the local player is this far from the party. */
export const PARTY_DRIFT_THRESHOLD_SEC = 2;
/** Give a seek this long to land before judging drift again, so a slow
 * buffer does not cause a seek loop. */
export const PARTY_SEEK_SETTLE_MS = 4000;
/** Near the end of a track the player may hand over to something else on
 * its own; that is the track ending, not the listener leaving. */
const NATURAL_END_SEC = 3;

export function partyPlayableId(partyId: string, trackId: string): string {
  return `party:${partyId}:${trackId}`;
}

export type PartyPlayerSnapshot = {
  currentId: string | null;
  currentTime: number;
  status: string;
};

export type PartyPlaybackStep =
  | { kind: 'wait' }
  | { kind: 'load'; trackId: string; offsetSec: number }
  | { kind: 'seek'; offsetSec: number }
  | { kind: 'left' }
  | { kind: 'over' };

/**
 * What a joined listener's player should do at this tick: load the party's
 * current track at its offset (on join, late join or a track change),
 * re-seek when it has drifted, or stop following because the party is over
 * or the listener started something else.
 */
export function partyPlaybackStep({
  partyId,
  timeline,
  tracks,
  loadedTrackId,
  player,
  msSinceLastSeek,
}: {
  partyId: string;
  timeline: Pick<ListeningPartyTimeline, 'state' | 'nowPlaying'>;
  tracks: readonly { id: string; durationSec: number }[];
  loadedTrackId: string | null;
  player: PartyPlayerSnapshot;
  msSinceLastSeek: number;
}): PartyPlaybackStep {
  if (timeline.state === 'ENDED' || timeline.state === 'CANCELED') {
    return { kind: 'over' };
  }
  const now = timeline.nowPlaying;
  if (timeline.state !== 'LIVE' || !now) {
    return { kind: 'wait' };
  }
  if (loadedTrackId === null) {
    return { kind: 'load', trackId: now.trackId, offsetSec: now.offsetSec };
  }
  const loadedId = partyPlayableId(partyId, loadedTrackId);
  if (loadedTrackId === now.trackId) {
    const durationSec =
      tracks.find((track) => track.id === now.trackId)?.durationSec ?? 0;
    if (
      player.currentId !== null &&
      player.currentId !== loadedId &&
      durationSec - now.offsetSec > NATURAL_END_SEC
    ) {
      return { kind: 'left' };
    }
    if (
      player.currentId === loadedId &&
      player.status === 'playing' &&
      msSinceLastSeek >= PARTY_SEEK_SETTLE_MS &&
      Math.abs(player.currentTime - now.offsetSec) > PARTY_DRIFT_THRESHOLD_SEC
    ) {
      return { kind: 'seek', offsetSec: now.offsetSec };
    }
    return { kind: 'wait' };
  }
  return { kind: 'load', trackId: now.trackId, offsetSec: now.offsetSec };
}
