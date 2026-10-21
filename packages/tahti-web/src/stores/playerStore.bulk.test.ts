import { beforeEach, describe, expect, it } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { usePlayerStore } from './playerStore';

const track = (name: string, streamUrl = `asset://${name}`): TahtiPlayable => ({
  id: `local:${name}`,
  kind: 'sound',
  title: name,
  artist: 'Artist',
  streamUrl,
  protocol: 'https',
  sourceProvider: 'local',
  durationSec: 60,
});
const titles = () => usePlayerStore.getState().queue.map((q) => q.track.title);

beforeEach(() => {
  usePlayerStore.getState().clearQueue();
});

describe('bulk queue actions', () => {
  it('enqueueMany appends in order in one update and skips duplicates', () => {
    const { enqueueMany } = usePlayerStore.getState();
    expect(enqueueMany([track('a'), track('b'), track('a'), track('c')])).toBe(
      3,
    );
    expect(titles()).toEqual(['a', 'b', 'c']);
    expect(
      usePlayerStore.getState().enqueueMany([track('b'), track('d')]),
    ).toBe(1);
    expect(titles()).toEqual(['a', 'b', 'c', 'd']);
    expect(usePlayerStore.getState().enqueueMany([track('a')])).toBe(0);
  });

  it('playNextMany inserts right after the current track, keeping their order', () => {
    const store = usePlayerStore.getState();
    store.play(track('now'), { enqueueRest: [track('x'), track('y')] });
    usePlayerStore.getState().playNextMany([track('n1'), track('n2')]);
    expect(titles()).toEqual(['now', 'n1', 'n2', 'x', 'y']);
  });

  it('playNextMany moves already-queued tracks instead of duplicating them', () => {
    const store = usePlayerStore.getState();
    store.play(track('now'), { enqueueRest: [track('x'), track('y')] });
    usePlayerStore.getState().playNextMany([track('y'), track('z')]);
    expect(titles()).toEqual(['now', 'y', 'z', 'x']);
  });

  it('handles thousands of tracks in a single call', () => {
    const many = Array.from({ length: 5000 }, (_, i) => track(`t${i}`));
    expect(usePlayerStore.getState().enqueueMany(many)).toBe(5000);
    expect(usePlayerStore.getState().queue).toHaveLength(5000);
  });
});

describe('restored queue', () => {
  const reset = () =>
    usePlayerStore.setState({ restoredPending: null, status: 'idle' });

  it('hydrateQueue installs a paused, unloaded queue without touching history', () => {
    reset();
    usePlayerStore.getState().hydrateQueue([track('a'), track('b')], 'local:b');
    const state = usePlayerStore.getState();
    expect(titles()).toEqual(['a', 'b']);
    expect([state.currentId, state.status, state.restoredPending]).toEqual([
      'local:b',
      'paused',
      'local:b',
    ]);
    expect(state.playerBarVisible).toBe(true);
  });

  it('ignores a current id that is not in the queue', () => {
    reset();
    usePlayerStore.getState().hydrateQueue([track('a')], 'local:zzz');
    expect(usePlayerStore.getState().status).toBe('idle');
    expect(usePlayerStore.getState().restoredPending).toBeNull();
  });

  it('starting playback clears the not-loaded state; pausing does not restore it', () => {
    reset();
    usePlayerStore.getState().hydrateQueue([track('a')], 'local:a');
    usePlayerStore.getState().setStatus('paused');
    expect(usePlayerStore.getState().restoredPending).toBe('local:a');
    usePlayerStore.getState().setStatus('playing');
    expect(usePlayerStore.getState().restoredPending).toBeNull();
    usePlayerStore.getState().setStatus('paused');
    expect(usePlayerStore.getState().restoredPending).toBeNull();
  });

  it('removing the restored current track passes the not-loaded state on', () => {
    reset();
    usePlayerStore.getState().hydrateQueue([track('a'), track('b')], 'local:a');
    usePlayerStore.getState().removeFromQueue('local:a');
    const state = usePlayerStore.getState();
    expect([state.currentId, state.status, state.restoredPending]).toEqual([
      'local:b',
      'paused',
      'local:b',
    ]);
  });

  it('setQueueSources fills in stream URLs by id', () => {
    reset();
    usePlayerStore
      .getState()
      .hydrateQueue([track('a', ''), track('b', '')], null);
    usePlayerStore.getState().setQueueSources({ 'local:b': 'asset://b' });
    const urls = usePlayerStore.getState().queue.map((q) => q.track.source.url);
    expect(urls[1]).toBe('asset://b');
    expect(urls[0]).toBeFalsy();
  });
});
