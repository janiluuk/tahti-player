import { beforeEach, describe, expect, it } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { usePlayerStore } from './playerStore';

const track = (name: string): TahtiPlayable => ({
  id: `local:${name}`,
  kind: 'sound',
  title: name,
  artist: 'Artist',
  streamUrl: `asset://${name}`,
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
