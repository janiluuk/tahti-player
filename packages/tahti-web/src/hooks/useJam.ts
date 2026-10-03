import { useEffect, useRef, useState } from 'react';

import { fetchJam, subscribeToJamEvents } from '../api/jam';
import type { JamSession } from '../api/types';
import { estimatedPositionSec, jamPlayable } from '../lib/jamPlayback';
import { usePlayerStore } from '../stores/playerStore';
import { usePolling } from './usePolling';

export type JamConnectionStatus =
  'connecting' | 'connected' | 'reconnecting' | 'failed';

/** Guest (and host, for its own mirror) side: loads the session, then keeps
 * it live over SSE. `ended` flips once the host closes the jam — the caller
 * decides what to show (this hook doesn't navigate away on its own). */
export function useJamState(sessionId: string | null): {
  session: JamSession | null;
  connectionStatus: JamConnectionStatus;
  ended: boolean;
} {
  const [session, setSession] = useState<JamSession | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<JamConnectionStatus>('connecting');
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      return;
    }
    let cancelled = false;
    setConnectionStatus('connecting');
    setEnded(false);

    void fetchJam(sessionId)
      .then((initial) => {
        if (!cancelled) {
          setSession(initial);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConnectionStatus('failed');
        }
      });

    const unsubscribe = subscribeToJamEvents(sessionId, {
      onOpen: () => {
        if (!cancelled) {
          setConnectionStatus('connected');
        }
      },
      onError: () => {
        if (!cancelled) {
          setConnectionStatus('reconnecting');
        }
      },
      onEvent: (event) => {
        if (cancelled) {
          return;
        }
        if (event.type === 'state') {
          setSession(event.session);
          setConnectionStatus('connected');
        } else {
          setEnded(true);
        }
      },
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [sessionId]);

  return { session, connectionStatus, ended };
}

const GUEST_DRIFT_THRESHOLD_SEC = 3;
const GUEST_DRIFT_CHECK_INTERVAL_MS = 5000;

/** Guest side: while `enabled`, drives this device's own player to match
 * the jam's reported state — same track, same play/pause, same
 * position (periodically drift-corrected against `positionUpdatedAt`).
 * Loading a new track always re-seeks to the host's current estimated
 * position; play/pause toggles on the same track don't (see the effect's
 * dependency list) so a routine position ping doesn't yank the seek head
 * around — the drift-correction effect below handles gradual reconciling
 * instead. Browsers block unattended `audio.play()`, so the caller must
 * only pass `enabled: true` after a genuine user gesture (see JamView's
 * "enable audio" gate). */
export function useJamGuestPlayback(
  session: JamSession | null,
  enabled: boolean,
): void {
  const play = usePlayerStore((s) => s.play);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const setStatus = usePlayerStore((s) => s.setStatus);
  const loadedTrackIdRef = useRef<string | null>(null);

  const track = session?.currentTrack ?? null;
  const trackId = track?.id ?? null;
  const isPlaying = session?.isPlaying ?? false;

  useEffect(() => {
    if (!enabled || !session || !track || !track.streamUrl) {
      return;
    }
    if (loadedTrackIdRef.current !== track.id) {
      loadedTrackIdRef.current = track.id;
      play(jamPlayable(track, track.streamUrl));
      seekTo(estimatedPositionSec(session));
    }
    setStatus(isPlaying ? 'playing' : 'paused');
  }, [enabled, trackId, isPlaying]);

  usePolling(
    () => {
      if (!session || !track) {
        return;
      }
      const state = usePlayerStore.getState();
      if (state.currentId !== track.id) {
        return;
      }
      const estimated = estimatedPositionSec(session);
      if (Math.abs(state.currentTime - estimated) > GUEST_DRIFT_THRESHOLD_SEC) {
        seekTo(estimated);
      }
    },
    GUEST_DRIFT_CHECK_INTERVAL_MS,
    Boolean(enabled && session && isPlaying && track?.streamUrl),
  );
}
