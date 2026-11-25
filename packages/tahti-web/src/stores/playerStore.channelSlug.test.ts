import { beforeEach, describe, expect, it } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { playableToTrack } from '../lib/playableToTrack';
import {
  parsePersistedQueue,
  restorePersistedQueue,
  serializeQueue,
} from '../lib/queuePersistence';
import { playableFromQueueItem, usePlayerStore } from './playerStore';

const sound: TahtiPlayable = {
  id: 'sound:northern-lights-archive-1',
  kind: 'sound',
  title: 'Night Drive',
  artist: 'Northern Lights',
  streamUrl: 'https://cdn.example/night-drive.mp3',
  protocol: 'https',
  channelSlug: 'northern-lights',
};

const queued = (item: TahtiPlayable) => ({
  id: item.id,
  track: playableToTrack(item),
  status: 'idle' as const,
  addedAtIso: '2026-11-25T00:00:00.000Z',
});

beforeEach(() => {
  window.localStorage.clear();
  usePlayerStore.getState().clearQueue();
});

describe('the artist slug of a queued sound', () => {
  it("is the owner's channel slug, not the sound id", () => {
    expect(playableFromQueueItem(queued(sound))?.channelSlug).toBe(
      'northern-lights',
    );
  });

  it('is unknown when the sound did not say whose channel it is', () => {
    const anonymous = { ...sound, channelSlug: undefined };
    expect(
      playableFromQueueItem(queued(anonymous))?.channelSlug,
    ).toBeUndefined();
  });

  it('survives saving and restoring the queue', () => {
    usePlayerStore.getState().play(sound);
    const saved = serializeQueue(
      usePlayerStore.getState().queue,
      usePlayerStore.getState().currentId,
    );
    expect(saved.items[0]?.channelSlug).toBe('northern-lights');

    usePlayerStore.getState().clearQueue();
    window.localStorage.setItem('tahti-queue-v1', JSON.stringify(saved));
    expect(restorePersistedQueue()).toBe(true);
    const restored = usePlayerStore.getState().queue[0];
    expect(restored && playableFromQueueItem(restored)?.channelSlug).toBe(
      'northern-lights',
    );
  });

  it('ignores a saved slug that is not a string', () => {
    const parsed = parsePersistedQueue(
      JSON.stringify({
        v: 1,
        currentId: null,
        items: [{ id: sound.id, title: sound.title, channelSlug: 42 }],
      }),
    );
    expect(parsed?.items[0]?.channelSlug).toBeUndefined();
  });
});
