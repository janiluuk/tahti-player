import { toast } from 'sonner';

import type { QueueItem } from '@tahti-player/model';

import type { TahtiPlayable } from '../api/types';
import { streamUrlFromQueueItem, usePlayerStore } from '../stores/playerStore';
import { getNativeLibrary } from './nativeLibrary';

const KEY = 'tahti-queue-v1';
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
  durationSec?: number;
};

export type PersistedQueue = {
  v: 1;
  currentId: string | null;
  items: PersistedQueueItem[];
};

const isLocal = (id: string) => id.startsWith('local:');
const isSound = (id: string) => id.startsWith('sound:');

/** What to save for a queue. Radio and live entries are skipped (they resume
 * from their own state), as are entries with nothing to identify them by. */
export function serializeQueue(
  queue: readonly QueueItem[],
  currentId: string | null,
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
      durationSec:
        qi.track.durationMs != null ? qi.track.durationMs / 1000 : undefined,
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
      .slice(0, MAX_ITEMS);
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
    durationSec: item.durationSec ?? null,
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
export async function resolveRestoredLocalSources() {
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
    .hydrateQueue(items.map(toPlayable), saved.currentId);
  void resolveRestoredLocalSources();
  return true;
}

/** Saves the queue whenever it or the current track changes (debounced). */
export function startQueuePersistence(): () => void {
  let timer: number | undefined;
  let last = usePlayerStore.getState();
  const unsubscribe = usePlayerStore.subscribe((state) => {
    if (state.queue === last.queue && state.currentId === last.currentId) {
      return;
    }
    last = state;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      const { queue, currentId } = usePlayerStore.getState();
      writeStored(serializeQueue(queue, currentId));
    }, SAVE_DELAY_MS);
  });
  return () => {
    window.clearTimeout(timer);
    unsubscribe();
  };
}
