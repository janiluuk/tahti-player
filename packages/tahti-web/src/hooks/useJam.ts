import { useEffect, useRef, useState } from 'react';

import { fetchJam, pushJamState, subscribeToJamEvents } from '../api/jam';
import type { JamSession } from '../api/types';
import { playableFromQueueItem, usePlayerStore } from '../stores/playerStore';

export type JamConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failed';

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

const HOST_PUSH_INTERVAL_MS = 5000;

/** Host side: while `active`, mirrors this device's own player into the jam
 * session every few seconds and on every play/pause/track change, so
 * participants' views stay in sync. No-ops (and pushes nothing) when
 * `active` is false — a host closing the jam or navigating away just stops
 * calling this, it doesn't need its own explicit teardown request. */
export function useJamHostSync(
  sessionId: string | null,
  active: boolean,
): void {
  const status = usePlayerStore((s) => s.status);
  const currentId = usePlayerStore((s) => s.currentId);
  const queue = usePlayerStore((s) => s.queue);
  const lastSentRef = useRef<string>('');

  useEffect(() => {
    if (!sessionId || !active) {
      return;
    }

    const push = () => {
      const state = usePlayerStore.getState();
      const item = state.queue.find((q) => q.id === state.currentId);
      const playable = item ? playableFromQueueItem(item) : null;
      const body = {
        isPlaying: state.status === 'playing',
        currentTrack: playable
          ? {
              id: playable.id,
              title: playable.title,
              artistName: playable.artist,
              coverUrl: playable.coverUrl ?? null,
              // Embed-only tracks (Mixcloud/Hearthis/Spotify) have nothing a
              // guest's own player can stream — leave these null so a guest
              // sees "now playing" without trying to auto-play them.
              streamUrl: playable.embed ? null : playable.streamUrl,
              protocol: playable.embed ? null : playable.protocol,
              channelSlug: playable.channelSlug ?? null,
              durationSec: playable.durationSec ?? null,
            }
          : null,
        positionSec: state.currentTime,
      };
      // Position ticks constantly; only worth a request when something a
      // guest would actually notice changed (track/play-state), plus the
      // regular interval below for position drift.
      const signature = `${body.isPlaying}:${body.currentTrack?.id ?? ''}`;
      if (signature === lastSentRef.current) {
        return;
      }
      lastSentRef.current = signature;
      void pushJamState(sessionId, body).catch(() => {
        // Transient failure — the next interval tick or state change retries.
      });
    };

    push();
    const interval = setInterval(() => {
      lastSentRef.current = ''; // force-send on the regular tick too, for position drift
      push();
    }, HOST_PUSH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [sessionId, active, status, currentId, queue]);
}

const GUEST_DRIFT_THRESHOLD_SEC = 3;
const GUEST_DRIFT_CHECK_INTERVAL_MS = 5000;

function estimatedPositionSec(session: JamSession): number {
  if (!session.isPlaying) {
    return session.positionSec;
  }
  const elapsedSec =
    (Date.now() - new Date(session.positionUpdatedAt).getTime()) / 1000;
  return session.positionSec + Math.max(0, elapsedSec);
}

/** Guest side: while `enabled`, drives this device's own player to match
 * the jam's host-reported state — same track, same play/pause, same
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
      play({
        id: `sound:${track.id}`,
        kind: 'sound',
        title: track.title,
        artist: track.artistName,
        coverUrl: track.coverUrl ?? undefined,
        streamUrl: track.streamUrl,
        protocol: track.protocol ?? 'https',
        channelSlug: track.channelSlug ?? undefined,
        durationSec: track.durationSec ?? undefined,
      });
      seekTo(estimatedPositionSec(session));
    }
    setStatus(isPlaying ? 'playing' : 'paused');
  }, [enabled, trackId, isPlaying]);

  useEffect(() => {
    if (!enabled || !session || !isPlaying || !track?.streamUrl) {
      return;
    }
    const interval = setInterval(() => {
      const state = usePlayerStore.getState();
      if (state.currentId !== `sound:${track.id}`) {
        return;
      }
      const estimated = estimatedPositionSec(session);
      if (Math.abs(state.currentTime - estimated) > GUEST_DRIFT_THRESHOLD_SEC) {
        seekTo(estimated);
      }
    }, GUEST_DRIFT_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabled, session, isPlaying, track, seekTo]);
}
