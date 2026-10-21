import { useEffect, useRef } from 'react';

import { pushJamState } from '../api/jam';
import type { JamSession, JamTrack } from '../api/types';
import {
  estimatedPositionSec,
  jamPlayable,
  jamStateSignature,
  sessionSignature,
} from '../lib/jamPlayback';
import { playableFromQueueItem, usePlayerStore } from '../stores/playerStore';
import { usePolling } from './usePolling';

const HOST_PUSH_INTERVAL_MS = 5000;

type JamStateBody = {
  isPlaying: boolean;
  currentTrack: JamTrack | null;
  positionSec: number;
};

/** This device's player as a jam state update, or null while a track is
 * still loading - a buffering track reads as "not playing", and sending
 * that would pause the jam for everyone. */
function localJamState(): JamStateBody | null {
  const state = usePlayerStore.getState();
  if (state.status === 'loading') {
    return null;
  }
  const item = state.queue.find((q) => q.id === state.currentId);
  const playable = item ? playableFromQueueItem(item) : null;
  return {
    isPlaying: state.status === 'playing',
    currentTrack: playable
      ? {
          id: playable.id,
          title: playable.title,
          artistName: playable.artist,
          coverUrl: playable.coverUrl ?? null,
          // Embed-only tracks (Mixcloud/Hearthis/Spotify) have nothing a
          // guest's own player can stream - leave these null so a guest
          // sees "now playing" without trying to auto-play them.
          streamUrl: playable.embed ? null : playable.streamUrl,
          protocol: playable.embed ? null : playable.protocol,
          channelSlug: playable.channelSlug ?? null,
          durationSec: playable.durationSec ?? null,
        }
      : null,
    positionSec: state.currentTime,
  };
}

function bodySignature(body: JamStateBody): string {
  return jamStateSignature(body.isPlaying, body.currentTrack?.id ?? null);
}

/** Moves the host's player onto a track a co-controller picked: jumps to it
 * when it's already queued, otherwise slots it in after the current track
 * so the host's queue (the jam's playlist) survives. */
function followJamTrack(track: JamTrack): boolean {
  const store = usePlayerStore.getState();
  if (!store.queue.some((q) => q.id === track.id)) {
    if (!track.streamUrl) {
      return false;
    }
    store.playNext(jamPlayable(track, track.streamUrl));
  }
  store.playQueueIndex(track.id);
  return true;
}

/** Host side: while `active`, mirrors this device's player into the jam
 * every few seconds and on every play/pause/track change, and follows
 * changes a co-controller makes so the next mirror doesn't undo them.
 *
 * The host's own state is the starting point: it only starts following
 * once its first push has landed, and ignores session snapshots older
 * than its latest push (an SSE frame still in flight from before it). */
export function useJamHostSync(
  session: JamSession | null,
  active: boolean,
): void {
  const sessionId = session?.id ?? null;
  const status = usePlayerStore((s) => s.status);
  const currentId = usePlayerStore((s) => s.currentId);
  const queue = usePlayerStore((s) => s.queue);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const lastSyncedRef = useRef('');
  const pushedOnceRef = useRef(false);
  const inFlightRef = useRef(0);
  const lastPushAtRef = useRef(0);

  const followRemote = () => {
    const latest = sessionRef.current;
    if (
      !active ||
      !latest ||
      !pushedOnceRef.current ||
      inFlightRef.current > 0 ||
      new Date(latest.positionUpdatedAt).getTime() < lastPushAtRef.current
    ) {
      return;
    }
    const signature = sessionSignature(latest);
    if (signature === lastSyncedRef.current) {
      return;
    }
    lastSyncedRef.current = signature;
    const store = usePlayerStore.getState();
    const track = latest.currentTrack;
    if (track && store.currentId !== track.id) {
      if (!followJamTrack(track)) {
        return;
      }
      store.seekTo(estimatedPositionSec(latest));
    }
    store.setStatus(latest.isPlaying ? 'playing' : 'paused');
  };

  const push = (force: boolean) => {
    if (!sessionId || !active) {
      return;
    }
    const body = localJamState();
    if (!body) {
      return;
    }
    const signature = bodySignature(body);
    if (!force && signature === lastSyncedRef.current) {
      return;
    }
    lastSyncedRef.current = signature;
    inFlightRef.current += 1;
    void pushJamState(sessionId, body)
      .then((view) => {
        pushedOnceRef.current = true;
        lastPushAtRef.current = new Date(view.positionUpdatedAt).getTime();
      })
      .catch(() => {
        // Transient failure - the next interval tick or state change retries.
      })
      .finally(() => {
        inFlightRef.current -= 1;
        followRemote();
      });
  };

  useEffect(() => {
    push(false);
  }, [sessionId, active, status, currentId, queue]);

  useEffect(() => {
    followRemote();
  }, [session]);

  usePolling(
    () => push(true),
    HOST_PUSH_INTERVAL_MS,
    Boolean(sessionId && active),
  );
}

/** A guest the host has given control, while they play along: pausing or
 * resuming the jam's track on their own player does it for everyone.
 * Only their own transitions count - following the jam moves the player
 * onto the session's state, which then matches and sends nothing - and
 * only on the jam's current track, so an unrelated track (or one their
 * player moves on to after the jam track ends) never takes over the jam. */
export function useJamCoControl(
  session: JamSession | null,
  active: boolean,
): void {
  const status = usePlayerStore((s) => s.status);
  const currentId = usePlayerStore((s) => s.currentId);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const previousRef = useRef<string | null>(null);

  useEffect(() => {
    if (!active) {
      previousRef.current = null;
      return;
    }
    const latest = sessionRef.current;
    const body = localJamState();
    if (!latest || !body) {
      return;
    }
    const signature = bodySignature(body);
    const previous = previousRef.current;
    previousRef.current = signature;
    if (
      previous === null ||
      previous === signature ||
      !latest.currentTrack ||
      body.currentTrack?.id !== latest.currentTrack.id ||
      signature === sessionSignature(latest)
    ) {
      return;
    }
    void pushJamState(latest.id, {
      ...body,
      currentTrack: latest.currentTrack,
    }).catch(() => {
      // The guest's player keeps its own state; the jam just doesn't follow.
    });
  }, [active, status, currentId]);
}
