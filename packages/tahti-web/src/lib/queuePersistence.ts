import { toast } from 'sonner';

import type { QueueItem } from '@tahti-player/model';

import type { TahtiPlayable } from '../api/types';
import {
  channelSlugFromQueueItem,
  streamUrlFromQueueItem,
  usePlayerStore,
} from '../stores/playerStore';
import { getNativeLibrary } from './nativeLibrary';

const KEY = 'tahti-queue-v1';
const POSITION_KEY = 'tahti-queue-position-v1';
const POSITION_SAVE_STEP_SEC = 5;
/** A track this close to its end restarts from the top after a reload. */
const POSITION_END_MARGIN_SEC = 3;
const MAX_ITEMS = 5000;
const RESOLVE_BATCH = 500;
const SAVE_DELAY_MS = 500;

/** One queued track as saved between sessions: enough to show it and, for
 * local files, to find it again -- never a session-scoped URL. */
export type PersistedQueueItem = {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  /** Stream URL for Tahti tracks; omitted for local files (resolved on restore). */
  streamUrl?: string;
  sourceProvider?: string;
  /** The owner's channel slug, for the artist link. */
  channelSlug?: string;
  durationSec?: number;
  /** Waveform peaks when the track had played (bounded by the peaks cache). */
  peaks?: number[];
};

export type PersistedQueue = {
  v: 1;
  currentId: string | null;
  items: PersistedQueueItem[];
};

const isLocal = (id: string) => id.startsWith('local:');
const isPeaks = (value: unknown): value is number[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((n) => typeof n === 'number' && Number.isFinite(n));
const isSound = (id: string) => id.startsWith('sound:');

/** What to save for a queue. Radio and live entries are skipped (they resume
 * from their own state), as are entries with nothing to identify them by. */
export function serializeQueue(
  queue: readonly QueueItem[],
  currentId: string | null,
  peaksById: Readonly<Record<string, number[]>> = {},
): PersistedQueue {
  const items: PersistedQueueItem[] = [];
  for (const qi of queue) {
    if (items.length >= MAX_ITEMS) {
      break;
    }
    if (!isLocal(qi.id) && !isSound(qi.id)) {
      continue;
    }
    const local = isLocal(qi.id);
    const url = local ? undefined : (streamUrlFromQueueItem(qi) ?? undefined);
    if (!local && !url) {
      continue;
    }
    items.push({
      id: qi.id,
      title: qi.track.title,
      artist: qi.track.artists.map((artist) => artist.name).join(', '),
      coverUrl: qi.track.artwork?.items[0]?.url,
      streamUrl: url,
      sourceProvider: qi.track.source.provider,
      channelSlug: channelSlugFromQueueItem(qi),
      durationSec:
        qi.track.durationMs != null ? qi.track.durationMs / 1000 : undefined,
      peaks: peaksById[qi.id]?.length ? peaksById[qi.id] : undefined,
    });
  }
  return {
    v: 1,
    currentId: items.some((item) => item.id === currentId) ? currentId : null,
    items,
  };
}

/** Reads saved JSON defensively; anything unexpected yields an empty queue. */
export function parsePersistedQueue(raw: string | null): PersistedQueue | null {
  if (!raw) {
    return null;
  }
  try {
    const data = JSON.parse(raw) as Partial<PersistedQueue>;
    if (data?.v !== 1 || !Array.isArray(data.items)) {
      return null;
    }
    const items = data.items
      .filter(
        (item): item is PersistedQueueItem =>
          Boolean(item) &&
          typeof item.id === 'string' &&
          typeof item.title === 'string' &&
          (isLocal(item.id) || isSound(item.id)),
      )
      .slice(0, MAX_ITEMS)
      .map((item) => ({
        ...item,
        peaks:
          item.peaks === undefined || isPeaks(item.peaks)
            ? item.peaks
            : undefined,
        channelSlug:
          typeof item.channelSlug === 'string' && item.channelSlug
            ? item.channelSlug
            : undefined,
      }));
    return {
      v: 1,
      currentId:
        typeof data.currentId === 'string' &&
        items.some((item) => item.id === data.currentId)
          ? data.currentId
          : null,
      items,
    };
  } catch {
    return null;
  }
}

function toPlayable(item: PersistedQueueItem): TahtiPlayable {
  return {
    id: item.id,
    kind: 'sound',
    title: item.title,
    artist: item.artist,
    coverUrl: item.coverUrl,
    streamUrl: item.streamUrl ?? '',
    protocol: 'https',
    sourceProvider: item.sourceProvider,
    channelSlug: item.channelSlug,
    durationSec: item.durationSec ?? null,
    peaks: item.peaks ?? null,
  };
}

function readStored(): PersistedQueue | null {
  try {
    return parsePersistedQueue(window.localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

function writeStored(value: PersistedQueue) {
  try {
    if (value.items.length === 0) {
      window.localStorage.removeItem(KEY);
    } else {
      window.localStorage.setItem(KEY, JSON.stringify(value));
    }
  } catch {
    // Storage blocked or full: the queue still works, it just isn't remembered.
  }
}

/**
 * Looks up the file for each restored local track (current one first, then
 * the rest in batches so a big queue never blocks the UI), fills in its URL,
 * and drops tracks whose file is gone. Nothing here starts playback.
 */
async function resolveRestoredLocalSources() {
  const library = getNativeLibrary();
  const state = usePlayerStore.getState();
  const wanted = state.queue.filter(
    (qi) => isLocal(qi.id) && !streamUrlFromQueueItem(qi),
  );
  if (!wanted.length) {
    return;
  }
  const ordered = [
    ...wanted.filter((qi) => qi.id === state.currentId),
    ...wanted.filter((qi) => qi.id !== state.currentId),
  ].map((qi) => qi.id);
  const gone: string[] = [];
  const batches: string[][] = [];
  const first = ordered[0];
  if (first !== undefined && first === state.currentId) {
    batches.push([first]);
    ordered.shift();
  }
  for (let start = 0; start < ordered.length; start += RESOLVE_BATCH) {
    batches.push(ordered.slice(start, start + RESOLVE_BATCH));
  }
  for (const batch of batches) {
    if (!library) {
      gone.push(...batch);
      continue;
    }
    try {
      const result = await library.prepareBatch(
        batch.map((id) => id.slice('local:'.length)),
      );
      const sources: Record<string, string> = {};
      for (const item of result.items) {
        sources[`local:${item.track.id}`] = item.streamUrl;
      }
      usePlayerStore.getState().setQueueSources(sources);
      gone.push(...batch.filter((id) => !(id in sources)));
    } catch {
      // Could not reach the library right now: leave these unresolved rather
      // than deleting them from the queue.
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  if (gone.length) {
    for (const id of gone) {
      usePlayerStore.getState().removeFromQueue(id);
    }
    toast.info(
      gone.length === 1
        ? '1 track from your saved queue is no longer available and was removed.'
        : `${gone.length} tracks from your saved queue are no longer available and were removed.`,
    );
  }
}

export type PersistedPosition = { id: string; at: number; duration: number };

export function parsePersistedPosition(
  raw: string | null,
): PersistedPosition | null {
  if (!raw) {
    return null;
  }
  try {
    const data = JSON.parse(raw) as Partial<PersistedPosition>;
    if (
      typeof data.id !== 'string' ||
      typeof data.at !== 'number' ||
      !Number.isFinite(data.at) ||
      data.at < 0
    ) {
      return null;
    }
    const duration =
      typeof data.duration === 'number' && Number.isFinite(data.duration)
        ? data.duration
        : 0;
    return { id: data.id, at: data.at, duration };
  } catch {
    return null;
  }
}

function readPosition(): PersistedPosition | null {
  try {
    return parsePersistedPosition(window.localStorage.getItem(POSITION_KEY));
  } catch {
    return null;
  }
}

function writePosition(value: PersistedPosition | null) {
  try {
    if (value) {
      window.localStorage.setItem(POSITION_KEY, JSON.stringify(value));
    } else {
      window.localStorage.removeItem(POSITION_KEY);
    }
  } catch {
    // Storage blocked or full: the track restores from the start instead.
  }
}

/** Where to pick the current track up again, or null to start it from 0. */
export function resumePointFor(
  position: PersistedPosition | null,
  currentId: string | null,
): { at: number; duration: number } | null {
  if (!position || !currentId || position.id !== currentId) {
    return null;
  }
  if (position.at < 1) {
    return null;
  }
  if (
    position.duration > 0 &&
    position.at >= position.duration - POSITION_END_MARGIN_SEC
  ) {
    return null;
  }
  return { at: position.at, duration: position.duration };
}

/** Restores the queue saved by the last session, paused. Call once at startup. */
export function restorePersistedQueue(): boolean {
  if (usePlayerStore.getState().queue.length > 0) {
    return false;
  }
  const saved = readStored();
  if (!saved || saved.items.length === 0) {
    return false;
  }
  const library = getNativeLibrary();
  // Local files can only be found again through the native library.
  const items = saved.items.filter((item) => !isLocal(item.id) || library);
  if (items.length === 0) {
    return false;
  }
  usePlayerStore
    .getState()
    .hydrateQueue(
      items.map(toPlayable),
      saved.currentId,
      resumePointFor(readPosition(), saved.currentId),
    );
  void resolveRestoredLocalSources();
  return true;
}

/** Saves the queue whenever it or the current track changes (debounced). */
export function startQueuePersistence(): () => void {
  let timer: number | undefined;
  let last = usePlayerStore.getState();
  let savedPosition = readPosition();
  const savePosition = (force: boolean) => {
    const { currentId, currentTime, duration, isLive } =
      usePlayerStore.getState();
    if (!currentId || isLive || (!isSound(currentId) && !isLocal(currentId))) {
      if (savedPosition) {
        savedPosition = null;
        writePosition(null);
      }
      return;
    }
    if (
      !force &&
      savedPosition?.id === currentId &&
      Math.abs(currentTime - savedPosition.at) < POSITION_SAVE_STEP_SEC
    ) {
      return;
    }
    savedPosition = { id: currentId, at: currentTime, duration };
    writePosition(savedPosition);
  };
  const unsubscribePosition = usePlayerStore.subscribe((state, prev) => {
    if (state.restoredPending && state.restoredPending === state.currentId) {
      // Still the untouched restored track: keep the saved spot as it is.
      return;
    }
    if (state.currentId !== prev.currentId) {
      savePosition(true);
    } else if (state.status !== prev.status && state.status === 'paused') {
      savePosition(true);
    } else if (state.currentTime !== prev.currentTime) {
      savePosition(false);
    }
  });
  const onPageHide = () => {
    const { restoredPending, currentId } = usePlayerStore.getState();
    if (!restoredPending || restoredPending !== currentId) {
      savePosition(true);
    }
  };
  window.addEventListener('pagehide', onPageHide);
  const unsubscribe = usePlayerStore.subscribe((state) => {
    if (
      state.queue === last.queue &&
      state.currentId === last.currentId &&
      state.peaksById === last.peaksById
    ) {
      return;
    }
    last = state;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      const { queue, currentId, peaksById } = usePlayerStore.getState();
      writeStored(serializeQueue(queue, currentId, peaksById));
    }, SAVE_DELAY_MS);
  });
  return () => {
    window.clearTimeout(timer);
    unsubscribe();
    unsubscribePosition();
    window.removeEventListener('pagehide', onPageHide);
  };
}
