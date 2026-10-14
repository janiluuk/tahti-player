import type { RepeatMode } from '@tahti-player/model';

import { usePlayerStore } from '../../stores/playerStore';
import { albumTitle } from '../playableToTrack';

type Params = Record<string, unknown>;

const REPEAT_MODES: readonly RepeatMode[] = ['off', 'all', 'one'];

function state() {
  return usePlayerStore.getState();
}

function currentIndex() {
  const { queue, currentId } = state();
  return queue.findIndex((item) => item.id === currentId);
}

function mpdStatus() {
  const { status } = state();
  if (status === 'playing' || status === 'loading') {
    return 'playing';
  }
  return status === 'paused' ? 'paused' : 'stopped';
}

function goToIndex(index: unknown) {
  const item = Number.isInteger(index)
    ? state().queue[index as number]
    : undefined;
  if (!item) {
    throw new Error(`No queue item at position ${String(index)}.`);
  }
  state().playQueueIndex(item.id);
}

function play() {
  const { queue, currentId, setStatus } = state();
  if (currentId) {
    setStatus('playing');
  } else if (queue[0]) {
    state().playQueueIndex(queue[0].id);
  }
}

function pause() {
  if (state().currentId) {
    state().setStatus('paused');
  }
}

const METHODS: Record<string, (params: Params) => unknown> = {
  'Playback.getState': () => ({
    status: mpdStatus(),
    seek: state().currentTime,
    duration: state().duration,
  }),
  'Playback.getVolume': () => state().volume,
  'Playback.isShuffleEnabled': () => state().shuffle,
  'Playback.getRepeatMode': () => state().repeatMode,
  'Playback.play': play,
  'Playback.pause': pause,
  'Playback.toggle': () => (mpdStatus() === 'playing' ? pause() : play()),
  'Playback.stop': () => {
    pause();
    if (state().currentId && !state().isLive) {
      state().seekTo(0);
    }
  },
  'Playback.seekTo': ({ seconds }) => {
    if (typeof seconds !== 'number' || state().isLive) {
      return;
    }
    state().seekTo(Math.max(0, seconds));
  },
  'Playback.setVolume': ({ volume }) => {
    if (typeof volume === 'number') {
      state().setVolume(Math.min(1, Math.max(0, volume)));
    }
  },
  'Playback.setShuffleEnabled': ({ enabled }) => {
    if (state().shuffle !== Boolean(enabled)) {
      state().toggleShuffle();
    }
  },
  'Playback.setRepeatMode': ({ mode }) => {
    if (REPEAT_MODES.includes(mode as RepeatMode)) {
      state().setRepeatMode(mode as RepeatMode);
    }
  },
  'Queue.getQueue': () => ({
    items: state().queue.map((item) => ({
      ...item,
      track: {
        ...item.track,
        album: albumTitle(item.track) ? item.track.album : undefined,
      },
    })),
    currentIndex: Math.max(0, currentIndex()),
  }),
  'Queue.goToIndex': ({ index }) => goToIndex(index),
  'Queue.goToNext': () => state().next(),
  'Queue.goToPrevious': () => state().previous(),
  'Queue.removeByIndices': ({ indices }) => {
    const queue = state().queue;
    const ids = (Array.isArray(indices) ? indices : [])
      .map((index) => queue[index as number]?.id)
      .filter((id): id is string => Boolean(id));
    ids.forEach((id) => state().removeFromQueue(id));
  },
  'Queue.reorder': ({ fromIndex, toIndex }) => {
    const length = state().queue.length;
    const inRange = (index: unknown) =>
      Number.isInteger(index) &&
      (index as number) >= 0 &&
      (index as number) < length;
    if (inRange(fromIndex) && inRange(toIndex)) {
      state().reorderQueue(fromIndex as number, toIndex as number);
    }
  },
  'Queue.clearQueue': () => state().clearQueue(),
};

/** Bridge methods from the MPD server carry this prefix, so they never reach the MCP domains. */
export const MPD_METHOD_PREFIX = 'Mpd.';

/** Answers one MPD bridge request (`Mpd.Playback.getState` and so on) from the Tahti player. */
export async function dispatchMpd(
  method: string,
  params: Params,
): Promise<unknown> {
  const run = METHODS[method.slice(MPD_METHOD_PREFIX.length)];
  if (!run) {
    throw new Error(`Unknown MPD bridge method ${method}.`);
  }
  return (await run(params)) ?? null;
}

export type MpdSubsystem = 'player' | 'playlist' | 'mixer' | 'options';

/** Tells the MPD server which `idle` subsystems changed. Returns the unsubscribe. */
export function watchMpdSubsystems(
  notify: (subsystem: MpdSubsystem) => void,
): () => void {
  let previous = state();
  return usePlayerStore.subscribe((next) => {
    const before = previous;
    previous = next;
    if (next.status !== before.status || next.currentId !== before.currentId) {
      notify('player');
    }
    if (
      next.queue.length !== before.queue.length ||
      next.queue.some((item, index) => item.id !== before.queue[index]?.id)
    ) {
      notify('playlist');
    }
    if (next.volume !== before.volume) {
      notify('mixer');
    }
    if (
      next.shuffle !== before.shuffle ||
      next.repeatMode !== before.repeatMode
    ) {
      notify('options');
    }
  });
}
