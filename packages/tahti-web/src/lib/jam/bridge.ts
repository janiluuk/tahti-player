import type { QueueItem, RepeatMode, Track } from '@tahti-player/model';

import { fetchTrackDetail } from '../../api/client';
import { fetchSearch } from '../../api/listen';
import type { TahtiPlayable } from '../../api/types';
import { usePlayerStore } from '../../stores/playerStore';
import { playableFromDetail } from '../../views/track-detail/helpers';
import { albumTitle } from '../playableToTrack';

type Params = Record<string, unknown>;

const REPEAT_MODES: readonly RepeatMode[] = ['off', 'all', 'one'];
const SEARCH_LIMIT = 20;

export type JamPlayback = {
  status: 'playing' | 'paused' | 'loading' | 'stopped';
  seek: number;
  duration: number;
  volume: number;
  muted: boolean;
};

export type JamQueue = { items: QueueItem[]; currentIndex: number };

export type JamSettings = { shuffle: boolean; repeat: RepeatMode };

/** Thrown for a request the phone got wrong; the HTTP API sends the message back. */
export class JamRequestError extends Error {}

function state() {
  return usePlayerStore.getState();
}

/** Artwork a phone on the LAN can load; local `asset:` URLs only work inside the desktop app. */
function webArtwork(track: Track): Track['artwork'] {
  const items = track.artwork?.items.filter((item) =>
    /^https?:\/\//.test(item.url),
  );
  return items?.length ? { ...track.artwork, items } : undefined;
}

/** What a phone may see of a track: no file paths, stream URLs or desktop-only artwork. */
function forPhone(track: Track): Track {
  return {
    title: track.title,
    artists: track.artists,
    album: albumTitle(track) ? track.album : undefined,
    durationMs: track.durationMs,
    artwork: webArtwork(track),
    tags: track.tags,
    source: { provider: track.source.provider, id: track.source.id },
  };
}

export function jamQueue(): JamQueue {
  const { queue, currentId } = state();
  return {
    items: queue.map((item) => ({ ...item, track: forPhone(item.track) })),
    currentIndex: Math.max(
      0,
      queue.findIndex((item) => item.id === currentId),
    ),
  };
}

export function jamPlayback(): JamPlayback {
  const { status, currentTime, duration, volume, muted } = state();
  return {
    status:
      status === 'playing' || status === 'loading' || status === 'paused'
        ? status
        : 'stopped',
    seek: currentTime,
    duration,
    volume,
    muted,
  };
}

export function jamSettings(): JamSettings {
  const { shuffle, repeatMode } = state();
  return { shuffle, repeat: repeatMode };
}

function play() {
  const { queue, currentId, setStatus, playQueueIndex } = state();
  if (currentId) {
    setStatus('playing');
  } else if (queue[0]) {
    playQueueIndex(queue[0].id);
  }
}

function pause() {
  if (state().currentId) {
    state().setStatus('paused');
  }
}

function searchTrack(result: {
  id: string;
  title: string;
  artistName: string;
  durationSec: number | null;
  coverUrl: string | null;
}): Track {
  return {
    title: result.title,
    artists: [{ name: result.artistName, roles: ['performer'] }],
    durationMs:
      result.durationSec != null ? result.durationSec * 1000 : undefined,
    artwork: result.coverUrl
      ? { items: [{ url: result.coverUrl, purpose: 'cover' }] }
      : undefined,
    source: { provider: 'tahti', id: result.id },
  };
}

async function playableFor(track: unknown): Promise<TahtiPlayable> {
  const source = (track as Track | null)?.source;
  if (source?.provider !== 'tahti' || typeof source.id !== 'string') {
    throw new JamRequestError(
      'Only Tahti tracks from /api/search can be added.',
    );
  }
  const { data } = await fetchTrackDetail(source.id);
  if (!data) {
    throw new JamRequestError(`Track ${source.id} isn't available.`);
  }
  return playableFromDetail(source.id, data);
}

const METHODS: Record<string, (params: Params) => unknown> = {
  'Queue.getQueue': jamQueue,
  'Playback.getState': jamPlayback,
  'Settings.get': jamSettings,
  'Playback.play': play,
  'Playback.pause': pause,
  'Playback.toggle': () =>
    jamPlayback().status === 'playing' || jamPlayback().status === 'loading'
      ? pause()
      : play(),
  'Queue.goToNext': () => state().next(),
  'Queue.goToPrevious': () => state().previous(),
  'Playback.seekTo': ({ seconds }) => {
    if (typeof seconds !== 'number' || !Number.isFinite(seconds)) {
      throw new JamRequestError('seconds must be a number.');
    }
    if (!state().isLive) {
      state().seekTo(Math.max(0, seconds));
    }
  },
  'Playback.setVolume': ({ volume }) => {
    if (typeof volume !== 'number' || !Number.isFinite(volume)) {
      throw new JamRequestError('volume must be a number from 0 to 1.');
    }
    state().setVolume(Math.min(1, Math.max(0, volume)));
  },
  'Playback.setShuffleEnabled': ({ enabled }) => {
    if (state().shuffle !== Boolean(enabled)) {
      state().toggleShuffle();
    }
  },
  'Playback.setRepeatMode': ({ mode }) => {
    if (!REPEAT_MODES.includes(mode as RepeatMode)) {
      throw new JamRequestError('mode must be off, all or one.');
    }
    state().setRepeatMode(mode as RepeatMode);
  },
  'Queue.playItem': ({ id }) => {
    if (!state().queue.some((item) => item.id === id)) {
      throw new JamRequestError(`No queue item has the id ${String(id)}.`);
    }
    state().playQueueIndex(id as string);
  },
  'Queue.removeByIds': ({ ids }) => {
    (Array.isArray(ids) ? ids : []).forEach((id) => {
      if (typeof id === 'string') {
        state().removeFromQueue(id);
      }
    });
  },
  'Queue.addToQueue': async ({ tracks }) => {
    if (!Array.isArray(tracks) || tracks.length === 0) {
      throw new JamRequestError('tracks must be a non-empty list.');
    }
    const playables = await Promise.all(tracks.map(playableFor));
    const wasEmpty = state().queue.length === 0;
    state().enqueueMany(playables);
    if (wasEmpty) {
      play();
    }
  },
  search: async ({ query, limit }) => {
    if (typeof query !== 'string' || !query.trim()) {
      throw new JamRequestError('query must be a non-empty string.');
    }
    const { data } = await fetchSearch(query, 'tracks');
    const max =
      typeof limit === 'number' && limit > 0
        ? Math.min(limit, SEARCH_LIMIT)
        : SEARCH_LIMIT;
    return { tracks: data.tracks.slice(0, max).map(searchTrack) };
  },
};

/** Bridge methods from the Tahti Jam HTTP API carry this prefix. */
export const JAM_METHOD_PREFIX = 'Jam.';

/** Answers one Tahti Jam bridge request (`Jam.Queue.getQueue` and so on) from the Tahti player. */
export async function dispatchJam(
  method: string,
  params: Params,
): Promise<unknown> {
  const run = METHODS[method.slice(JAM_METHOD_PREFIX.length)];
  if (!run) {
    throw new JamRequestError(`Unknown Tahti Jam method ${method}.`);
  }
  return (await run(params)) ?? null;
}

export type JamEventKind = 'queue' | 'playback' | 'settings';

const PROGRESS_STEP_SEC = 1;

/** Sends each kind of state to the phones when it changes. Progress is sent at most once a second. */
export function watchJamState(
  send: (kind: JamEventKind, data: unknown) => void,
): () => void {
  let previous = state();
  return usePlayerStore.subscribe((next) => {
    const before = previous;
    if (next.queue !== before.queue || next.currentId !== before.currentId) {
      send('queue', jamQueue());
    }
    const moved =
      Math.abs(next.currentTime - before.currentTime) >= PROGRESS_STEP_SEC;
    if (
      next.status !== before.status ||
      next.duration !== before.duration ||
      next.volume !== before.volume ||
      next.muted !== before.muted ||
      moved
    ) {
      send('playback', jamPlayback());
    }
    if (
      next.shuffle !== before.shuffle ||
      next.repeatMode !== before.repeatMode
    ) {
      send('settings', jamSettings());
    }
    previous =
      moved ||
      next.status !== before.status ||
      next.duration !== before.duration
        ? next
        : { ...next, currentTime: before.currentTime };
  });
}
