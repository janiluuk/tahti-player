import { afterEach, describe, expect, it, vi } from 'vitest';

import * as likes from '../api/likes';
import * as engagement from '../api/sound-engagement';
import { useSoundLikesStore } from './soundLikesStore';

describe('soundLikesStore', () => {
  afterEach(() => {
    useSoundLikesStore.getState().reset();
    vi.restoreAllMocks();
  });

  it('loads which tracks you loved once per sign-in', async () => {
    const fetch = vi.spyOn(likes, 'fetchMyLikes').mockResolvedValue({
      data: [{ id: 's1' } as likes.LikedTrack],
      meta: { source: 'api' },
    });
    await useSoundLikesStore.getState().load('u1');
    await useSoundLikesStore.getState().load('u1');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(useSoundLikesStore.getState().liked.has('s1')).toBe(true);
  });

  it('toggles through the sound engagement API and keeps the new count', async () => {
    const set = vi
      .spyOn(engagement, 'setSoundEngagement')
      .mockResolvedValue({ ok: true, data: { active: true, count: 4 } });
    expect(await useSoundLikesStore.getState().toggle('yaniho', 's2')).toBe(
      null,
    );
    expect(set).toHaveBeenCalledWith('like', 'yaniho', 's2', true);
    expect(useSoundLikesStore.getState().liked.has('s2')).toBe(true);
    expect(useSoundLikesStore.getState().counts.s2).toBe(4);
  });

  it("answers the API's reason when it fails", async () => {
    vi.spyOn(engagement, 'setSoundEngagement').mockResolvedValue({
      ok: false,
      error: 'Sign in to like tracks',
    });
    expect(await useSoundLikesStore.getState().toggle('yaniho', 's3')).toBe(
      'Sign in to like tracks',
    );
  });
});
