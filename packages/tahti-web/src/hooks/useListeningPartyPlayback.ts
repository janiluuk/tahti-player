import { useEffect, useRef } from 'react';

import {
  listeningPartyTrackStreamUrl,
  type ListeningPartyDto,
} from '../api/listening-parties';
import type { TahtiPlayable } from '../api/types';
import { safeCreditName } from '../lib/displayName';
import {
  partyPlayableId,
  partyPlaybackStep,
} from '../lib/listeningPartyPlayback';
import { usePlayerStore } from '../stores/playerStore';
import type { ListeningPartyClock } from './useListeningPartyTimeline';

function partyPlayable(
  party: ListeningPartyDto,
  trackId: string,
): TahtiPlayable | null {
  const track = party.tracks.find((row) => row.id === trackId);
  if (!track) {
    return null;
  }
  return {
    id: partyPlayableId(party.id, track.id),
    kind: 'sound',
    title: track.title,
    artist:
      safeCreditName(party.host.displayName, party.host.username) ??
      party.host.username,
    coverUrl: party.release.artworkUrl ?? undefined,
    streamUrl: listeningPartyTrackStreamUrl(party.id, track.id),
    protocol: 'https',
    channelSlug: party.channel.slug,
    durationSec: track.durationSec,
  };
}

/**
 * While `joined`, keeps the app's player on the party: the current track
 * at the server offset (so a late join lands in sync), the next track when
 * the timeline moves on, and a re-seek when the player drifts more than
 * two seconds. Calls `onStop` when the party is over or the listener plays
 * something else. Browsers only allow `play()` after a user gesture, so
 * `joined` must come from a click (the Join button).
 */
export function useListeningPartyPlayback(
  party: ListeningPartyDto,
  clock: ListeningPartyClock | null,
  joined: boolean,
  onStop: () => void,
): void {
  const loadedTrackRef = useRef<string | null>(null);
  const lastSeekAtRef = useRef(0);
  const onStopRef = useRef(onStop);
  onStopRef.current = onStop;

  useEffect(() => {
    if (!joined) {
      loadedTrackRef.current = null;
    }
  }, [joined]);

  useEffect(() => {
    if (!joined || !clock) {
      return;
    }
    const player = usePlayerStore.getState();
    const step = partyPlaybackStep({
      partyId: party.id,
      timeline: clock,
      tracks: party.tracks,
      loadedTrackId: loadedTrackRef.current,
      player: {
        currentId: player.currentId,
        currentTime: player.currentTime,
        status: player.status,
      },
      msSinceLastSeek: Date.now() - lastSeekAtRef.current,
    });
    switch (step.kind) {
      case 'load': {
        const playable = partyPlayable(party, step.trackId);
        if (!playable) {
          return;
        }
        loadedTrackRef.current = step.trackId;
        lastSeekAtRef.current = Date.now();
        player.play(playable);
        player.seekTo(step.offsetSec);
        return;
      }
      case 'seek':
        lastSeekAtRef.current = Date.now();
        player.seekTo(step.offsetSec);
        return;
      case 'left':
      case 'over':
        loadedTrackRef.current = null;
        onStopRef.current();
        return;
      case 'wait':
        return;
    }
  }, [joined, clock, party]);
}
