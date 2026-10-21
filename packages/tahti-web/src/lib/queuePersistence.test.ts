import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { usePlayerStore } from '../stores/playerStore';
import type { TahtiNativeLibrary } from './nativeLibrary';
import {
  parsePersistedQueue,
  restorePersistedQueue,
  serializeQueue,
  startQueuePersistence,
} from './queuePersistence';

const local = (
  id: string,
  extra: Partial<TahtiPlayable> = {},
): TahtiPlayable => ({
  id: `local:${id}`,
  kind: 'sound',
  title: `Local ${id}`,
  artist: 'Me',
  streamUrl: `asset://session-scoped/${id}`,
  protocol: 'https',
  sourceProvider: 'local',
  durationSec: 60,
  ...extra,
});
const cloud = (id: string): TahtiPlayable => ({
  id: `sound:${id}`,
  kind: 'sound',
  title: `Cloud ${id}`,
  artist: 'Them',
  streamUrl: `https://cdn.example/${id}.mp3`,
  protocol: 'https',
  durationSec: 120,
});
const radio: TahtiPlayable = {
  id: 'radio:x',
  kind: 'radio',
  title: 'Radio',
  artist: 'Station',
  streamUrl: 'https://radio.example/live',
  protocol: 'https',
};

const store = () => usePlayerStore.getState();
const titles = () => store().queue.map((q) => q.track.title);
const KEY = 'tahti-queue-v1';

function nativeLibrary(available: string[]) {
  const prepareBatch = vi.fn(async (ids: string[]) => ({
    unavailable: ids.filter((id) => !available.includes(id)).length,
    items: ids
      .filter((id) => available.includes(id))
      .map((id) => ({
        track: { id, title: `Local ${id}`, artist: 'Me' },
        streamUrl: `asset://fresh/${id}`,
      })),
  }));
  globalThis.__TAHTI_NATIVE_LIBRARY__ = {
    prepareBatch,
  } as unknown as TahtiNativeLibrary;
  return prepareBatch;
}

beforeEach(() => {
  window.localStorage.clear();
  store().clearQueue();
  usePlayerStore.setState({ restoredPending: null, status: 'idle' });
});
afterEach(() => {
  globalThis.__TAHTI_NATIVE_LIBRARY__ = undefined;
  vi.useRealTimers();
});

describe('serializeQueue', () => {
  it('keeps local and Tahti tracks, drops session URLs and skips radio and live', () => {
    store().play(local('a'), { enqueueRest: [cloud('1'), radio] });
    const saved = serializeQueue(store().queue, store().currentId);
    expect(saved.items.map((i) => i.id)).toEqual(['local:a', 'sound:1']);
    expect(saved.items[0]?.streamUrl).toBeUndefined();
    expect(saved.items[1]?.streamUrl).toBe('https://cdn.example/1.mp3');
    expect(saved.currentId).toBe('local:a');
    expect(JSON.stringify(saved)).not.toContain('session-scoped');
  });

  it('forgets a current track that is not saved', () => {
    store().play(radio, { enqueueRest: [cloud('1')] });
    expect(
      serializeQueue(store().queue, store().currentId).currentId,
    ).toBeNull();
  });
});

describe('parsePersistedQueue', () => {
  it('rejects garbage and other versions, and filters bad items', () => {
    expect(parsePersistedQueue(null)).toBeNull();
    expect(parsePersistedQueue('{nope')).toBeNull();
    expect(parsePersistedQueue(JSON.stringify({ v: 2, items: [] }))).toBeNull();
    const parsed = parsePersistedQueue(
      JSON.stringify({
        v: 1,
        currentId: 'gone',
        items: [
          { id: 'local:a', title: 'A', artist: '' },
          { id: 'radio:x', title: 'R', artist: '' },
          null,
          { id: 5 },
        ],
      }),
    );
    expect(parsed?.items.map((i) => i.id)).toEqual(['local:a']);
    expect(parsed?.currentId).toBeNull();
  });
});

describe('restorePersistedQueue', () => {
  const save = () => {
    store().play(local('a'), {
      enqueueRest: [cloud('1'), local('b'), local('c')],
    });
    window.localStorage.setItem(
      KEY,
      JSON.stringify(serializeQueue(store().queue, store().currentId)),
    );
    store().clearQueue();
    usePlayerStore.setState({
      restoredPending: null,
      status: 'idle',
      hasPlayed: false,
    });
  };

  it('brings the queue back paused, without loading or playing anything', async () => {
    save();
    nativeLibrary(['a', 'b', 'c']);
    expect(restorePersistedQueue()).toBe(true);

    expect(titles()).toEqual(['Local a', 'Cloud 1', 'Local b', 'Local c']);
    expect(store().currentId).toBe('local:a');
    expect(store().status).toBe('paused');
    expect(store().restoredPending).toBe('local:a');
    expect(store().hasPlayed).toBe(false);
    await vi.waitFor(() =>
      expect(store().queue.every((q) => q.track.source.url)).toBe(true),
    );
  });

  it('resolves the current track first and the rest in a later batch', async () => {
    save();
    const prepareBatch = nativeLibrary(['a', 'b', 'c']);
    restorePersistedQueue();
    await vi.waitFor(() => expect(prepareBatch).toHaveBeenCalledTimes(2));
    expect(prepareBatch.mock.calls[0]?.[0]).toEqual(['a']);
    expect(prepareBatch.mock.calls[1]?.[0]).toEqual(['b', 'c']);
    expect(store().queue[0]?.track.source.url).toBe('asset://fresh/a');
  });

  it('drops tracks whose file is gone, telling the user, and stays paused', async () => {
    save();
    nativeLibrary(['a', 'c']);
    restorePersistedQueue();
    await vi.waitFor(() =>
      expect(titles()).toEqual(['Local a', 'Cloud 1', 'Local c']),
    );
    expect(store().status).toBe('paused');
  });

  it('hands the not-loaded state to the next track if the current file is gone', async () => {
    save();
    nativeLibrary(['b', 'c']);
    restorePersistedQueue();
    await vi.waitFor(() => expect(store().currentId).toBe('sound:1'));
    expect(store().restoredPending).toBe('sound:1');
    expect(store().status).toBe('paused');
  });

  it('keeps unresolved tracks if the library cannot be reached', async () => {
    save();
    globalThis.__TAHTI_NATIVE_LIBRARY__ = {
      prepareBatch: vi.fn().mockRejectedValue(new Error('down')),
    } as unknown as TahtiNativeLibrary;
    restorePersistedQueue();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(titles()).toHaveLength(4);
  });

  it('leaves local files out when there is no native library, but keeps Tahti tracks', () => {
    save();
    expect(restorePersistedQueue()).toBe(true);
    expect(titles()).toEqual(['Cloud 1']);
    expect(store().currentId).toBeNull();
    expect(store().status).toBe('idle');
  });

  it('does nothing without saved data, with corrupt data, or over an existing queue', () => {
    expect(restorePersistedQueue()).toBe(false);
    window.localStorage.setItem(KEY, '{broken');
    expect(restorePersistedQueue()).toBe(false);
    save();
    nativeLibrary(['a', 'b', 'c']);
    store().play(cloud('9'));
    expect(restorePersistedQueue()).toBe(false);
    expect(titles()).toEqual(['Cloud 9']);
  });
});

describe('startQueuePersistence', () => {
  it('saves after the queue or current track changes, debounced, and forgets an empty queue', () => {
    vi.useFakeTimers();
    const stop = startQueuePersistence();
    store().play(local('a'), { enqueueRest: [cloud('1')] });
    store().enqueue(local('b'));
    expect(window.localStorage.getItem(KEY)).toBeNull();
    vi.advanceTimersByTime(600);
    const saved = JSON.parse(window.localStorage.getItem(KEY) ?? '{}');
    expect(saved.items.map((i: { id: string }) => i.id)).toEqual([
      'local:a',
      'sound:1',
      'local:b',
    ]);

    store().setProgress(12, 60);
    vi.advanceTimersByTime(600);
    expect(
      JSON.parse(window.localStorage.getItem(KEY) ?? '{}').items,
    ).toHaveLength(3);

    store().clearQueue();
    vi.advanceTimersByTime(600);
    expect(window.localStorage.getItem(KEY)).toBeNull();
    stop();
  });

  it('stops saving once stopped', () => {
    vi.useFakeTimers();
    const stop = startQueuePersistence();
    stop();
    store().play(cloud('1'));
    vi.advanceTimersByTime(600);
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });
});
