import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { usePlayerStore } from '../stores/playerStore';
import type { TahtiNativeLibrary } from './nativeLibrary';
import {
  parsePersistedPosition,
  parsePersistedQueue,
  restorePersistedQueue,
  resumePointFor,
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

describe('queue peaks', () => {
  it('saves the peaks of tracks that played and brings them back', () => {
    const peaks = [10, 200, 90];
    store().play({ ...cloud('1'), peaks }, { enqueueRest: [cloud('2')] });
    const saved = serializeQueue(
      store().queue,
      store().currentId,
      store().peaksById,
    );
    expect(saved.items.map((item) => item.peaks)).toEqual([peaks, undefined]);

    window.localStorage.setItem(KEY, JSON.stringify(saved));
    store().clearQueue();
    usePlayerStore.setState({ peaksById: {}, currentPeaks: null });
    expect(restorePersistedQueue()).toBe(true);
    expect(store().currentPeaks).toEqual(peaks);
    expect(store().peaksById['sound:1']).toEqual(peaks);
  });

  it('drops malformed saved peaks', () => {
    const parsed = parsePersistedQueue(
      JSON.stringify({
        v: 1,
        currentId: null,
        items: [
          { id: 'sound:1', title: 'One', artist: 'A', peaks: ['x'] },
          { id: 'sound:2', title: 'Two', artist: 'A', peaks: [1, 2] },
        ],
      }),
    );
    expect(parsed?.items.map((item) => item.peaks)).toEqual([
      undefined,
      [1, 2],
    ]);
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

describe('playback position across a reload', () => {
  const POSITION_KEY = 'tahti-queue-position-v1';

  it('saves the spot every few seconds, on pause and when the page closes', () => {
    const stop = startQueuePersistence();
    store().play(cloud('1'));
    store().setStatus('playing');
    store().setProgress(2, 120);
    expect(window.localStorage.getItem(POSITION_KEY)).toContain('"at":0');
    store().setProgress(6, 120);
    expect(
      parsePersistedPosition(window.localStorage.getItem(POSITION_KEY)),
    ).toEqual({ id: 'sound:1', at: 6, duration: 120 });
    store().setProgress(8, 120);
    store().setStatus('paused');
    expect(
      parsePersistedPosition(window.localStorage.getItem(POSITION_KEY))?.at,
    ).toBe(8);
    store().setStatus('playing');
    store().setProgress(9.5, 120);
    window.dispatchEvent(new Event('pagehide'));
    expect(
      parsePersistedPosition(window.localStorage.getItem(POSITION_KEY))?.at,
    ).toBe(9.5);
    stop();
  });

  it('opens the current track paused at the saved spot, and the first play seeks there', () => {
    window.localStorage.setItem(KEY, JSON.stringify(serializeQueue([], null)));
    store().play(cloud('1'), { enqueueRest: [cloud('2')] });
    window.localStorage.setItem(
      KEY,
      JSON.stringify(serializeQueue(store().queue, store().currentId)),
    );
    window.localStorage.setItem(
      POSITION_KEY,
      JSON.stringify({ id: 'sound:1', at: 42, duration: 120 }),
    );
    store().clearQueue();

    expect(restorePersistedQueue()).toBe(true);
    expect(store().currentId).toBe('sound:1');
    expect(store().status).toBe('paused');
    expect(store().restoredPending).toBe('sound:1');
    expect(store().currentTime).toBe(42);
    expect(store().duration).toBe(120);
    expect(store().seekTarget).toBe(42);
    expect(store().playerBarVisible).toBe(true);
  });

  it('keeps the saved spot while the restored track has not been played', () => {
    window.localStorage.setItem(
      POSITION_KEY,
      JSON.stringify({ id: 'sound:1', at: 42, duration: 120 }),
    );
    store().hydrateQueue([cloud('1')], 'sound:1', { at: 42, duration: 120 });
    const stop = startQueuePersistence();
    store().clearSeekTarget();
    store().setProgress(0, 0);
    window.dispatchEvent(new Event('pagehide'));
    expect(
      parsePersistedPosition(window.localStorage.getItem(POSITION_KEY))?.at,
    ).toBe(42);
    stop();
  });

  it('starts from the top for a different track, a spot near the end, or under a second', () => {
    expect(
      resumePointFor({ id: 'sound:2', at: 42, duration: 120 }, 'sound:1'),
    ).toBeNull();
    expect(
      resumePointFor({ id: 'sound:1', at: 118, duration: 120 }, 'sound:1'),
    ).toBeNull();
    expect(
      resumePointFor({ id: 'sound:1', at: 0.4, duration: 120 }, 'sound:1'),
    ).toBeNull();
    expect(
      resumePointFor({ id: 'sound:1', at: 42, duration: 0 }, 'sound:1'),
    ).toEqual({ at: 42, duration: 0 });
  });

  it('never resumes a radio station at a position', () => {
    store().hydrateQueue([radio], 'radio:x', { at: 42, duration: 0 });
    expect(store().currentTime).toBe(0);
    expect(store().seekTarget).toBeNull();
  });

  it('rejects a malformed saved position', () => {
    expect(parsePersistedPosition('nope')).toBeNull();
    expect(parsePersistedPosition('{"id":"sound:1","at":-3}')).toBeNull();
    expect(parsePersistedPosition('{"at":3}')).toBeNull();
  });
});
