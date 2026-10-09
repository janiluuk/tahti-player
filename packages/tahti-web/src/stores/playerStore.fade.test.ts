import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { usePlayerStore } from './playerStore';

const item = (id: string, kind: TahtiPlayable['kind'] = 'sound') =>
  ({
    id,
    kind,
    title: id,
    artist: 'Artist',
    streamUrl: `https://cdn.example/${id}`,
    protocol: 'https',
    isRealLive: kind === 'live',
  }) as TahtiPlayable;

const CHANNEL = item('live:night-drive', 'live');
const state = () => usePlayerStore.getState();

describe('playerStore fadeOverTo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    state().clearQueue();
    usePlayerStore.setState({ fadeLevel: 1, volume: 0.85, muted: false });
    state().play(item('sound:a'), { enqueueRest: [item('sound:b')] });
    usePlayerStore.setState({ status: 'playing' });
  });

  afterEach(() => {
    vi.useRealTimers();
    state().clearQueue();
    usePlayerStore.setState({ fadeLevel: 1 });
  });

  it('fades out, switches while silent, and fades the channel in', async () => {
    const done = state().fadeOverTo(CHANNEL);
    await vi.advanceTimersByTimeAsync(300);
    expect(state().currentId).toBe('sound:a');
    expect(state().fadeLevel).toBeLessThan(1);
    expect(state().fadeLevel).toBeGreaterThan(0);

    await vi.advanceTimersByTimeAsync(500);
    expect(state().currentId).toBe('live:night-drive');
    expect(state().fadeLevel).toBe(0);
    expect(state().isRealLive).toBe(true);

    usePlayerStore.setState({ status: 'playing' });
    await vi.advanceTimersByTimeAsync(1300);
    expect(await done).toBe(true);
    expect(state().fadeLevel).toBe(1);
    expect(state().volume).toBe(0.85);
  });

  it('keeps the queue, with the channel after the track it replaced', async () => {
    const done = state().fadeOverTo(CHANNEL);
    await vi.advanceTimersByTimeAsync(800);
    usePlayerStore.setState({ status: 'playing' });
    await vi.advanceTimersByTimeAsync(1300);
    await done;
    expect(state().queue.map((q) => q.id)).toEqual([
      'sound:a',
      'live:night-drive',
      'sound:b',
    ]);
  });

  it('gives up and restores the level when the listener changes track mid-fade', async () => {
    const done = state().fadeOverTo(CHANNEL);
    await vi.advanceTimersByTimeAsync(200);
    state().playQueueIndex('sound:b');
    await vi.advanceTimersByTimeAsync(1000);
    expect(await done).toBe(false);
    expect(state().currentId).toBe('sound:b');
    expect(state().fadeLevel).toBe(1);
    expect(state().queue.map((q) => q.id)).toEqual(['sound:a', 'sound:b']);
  });

  it('fades in anyway when the new source never reports sound', async () => {
    const done = state().fadeOverTo(CHANNEL);
    await vi.advanceTimersByTimeAsync(800);
    expect(state().status).toBe('loading');
    await vi.advanceTimersByTimeAsync(4000 + 1300);
    expect(await done).toBe(true);
    expect(state().fadeLevel).toBe(1);
  });
});
