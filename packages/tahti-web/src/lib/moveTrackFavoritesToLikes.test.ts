// @vitest-environment jsdom
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as engagement from '../api/sound-engagement';
import type { TahtiPlayable } from '../api/types';
import {
  rehydrateLibraryForUser,
  useLibraryStore,
} from '../stores/libraryStore';
import { useSoundLikesStore } from '../stores/soundLikesStore';
import {
  moveTrackFavoritesToLikes,
  moveTrackFavoritesToLikesWithToast,
} from './moveTrackFavoritesToLikes';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const sound = (id: string, channelSlug = 'aurora'): TahtiPlayable => ({
  id: `sound:${id}`,
  kind: 'sound',
  title: `Track ${id}`,
  artist: 'Aurora Drift',
  streamUrl: `https://example.com/${id}.mp3`,
  protocol: 'https',
  channelSlug,
});

const STATION: TahtiPlayable = {
  id: 'radio:https://ice1.somafm.com/groovesalad-256-mp3',
  kind: 'radio',
  title: 'Groove Salad',
  artist: 'SomaFM',
  streamUrl: 'https://ice1.somafm.com/groovesalad-256-mp3',
  protocol: 'https',
};

const EMBED: TahtiPlayable = {
  ...sound('embed-1'),
  streamUrl: '',
  embed: { provider: 'hearthis', embedUri: 'https://hearthis.at/x/y/' },
};

const savedIds = () =>
  useLibraryStore.getState().favoriteTracks.map((track) => track.id);

describe('moveTrackFavoritesToLikes', () => {
  beforeEach(async () => {
    localStorage.clear();
    useSoundLikesStore.getState().reset();
    await rehydrateLibraryForUser('move-test-reset');
    await rehydrateLibraryForUser('user-1');
    useLibraryStore.setState({
      favoriteTracks: [sound('a'), STATION, sound('b'), EMBED],
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(toast.success).mockClear();
  });

  it('likes local favourite sounds, clears them and remembers it ran', async () => {
    const like = vi
      .spyOn(engagement, 'setSoundEngagement')
      .mockResolvedValue({ ok: true, data: { active: true, count: 1 } });

    expect(await moveTrackFavoritesToLikes('user-1')).toEqual({
      moved: 2,
      failed: 0,
    });

    expect(like).toHaveBeenCalledTimes(2);
    expect(like).toHaveBeenCalledWith('like', 'aurora', 'a', true);
    expect(like).toHaveBeenCalledWith('like', 'aurora', 'b', true);
    expect(savedIds()).toEqual([STATION.id, EMBED.id]);
    expect(useSoundLikesStore.getState().liked).toEqual(new Set(['a', 'b']));
    expect(localStorage.getItem('tahti-web:track-favorites-moved:user-1')).toBe(
      'done',
    );

    useLibraryStore.setState({ favoriteTracks: [sound('c')] });
    expect(await moveTrackFavoritesToLikes('user-1')).toBeNull();
    expect(like).toHaveBeenCalledTimes(2);
  });

  it('does nothing for a signed-out listener', async () => {
    await rehydrateLibraryForUser(null);
    useLibraryStore.setState({ favoriteTracks: [sound('a')] });
    const like = vi.spyOn(engagement, 'setSoundEngagement');

    expect(await moveTrackFavoritesToLikes('user-1')).toBeNull();

    expect(like).not.toHaveBeenCalled();
    expect(savedIds()).toEqual(['sound:a']);
  });

  it('keeps the tracks that failed and tries them again next time', async () => {
    const like = vi
      .spyOn(engagement, 'setSoundEngagement')
      .mockImplementation(async (_kind, _slug, soundId) =>
        soundId === 'b'
          ? { ok: false, error: 'Sound item not found' }
          : { ok: true, data: { active: true, count: 1 } },
      );

    expect(await moveTrackFavoritesToLikes('user-1')).toEqual({
      moved: 1,
      failed: 1,
    });
    expect(savedIds()).toEqual([STATION.id, 'sound:b', EMBED.id]);
    expect(localStorage.getItem('tahti-web:track-favorites-moved:user-1')).toBe(
      '1',
    );

    like.mockResolvedValue({ ok: true, data: { active: true, count: 1 } });
    expect(await moveTrackFavoritesToLikes('user-1')).toEqual({
      moved: 1,
      failed: 0,
    });
    expect(savedIds()).toEqual([STATION.id, EMBED.id]);
  });

  it('gives up on tracks that keep failing', async () => {
    vi.spyOn(engagement, 'setSoundEngagement').mockResolvedValue({
      ok: false,
      error: 'Sound item not found',
    });
    for (let run = 0; run < 3; run++) {
      await moveTrackFavoritesToLikes('user-1');
    }
    expect(localStorage.getItem('tahti-web:track-favorites-moved:user-1')).toBe(
      'done',
    );
    expect(savedIds()).toContain('sound:a');
  });

  it('says how many tracks moved', async () => {
    vi.spyOn(engagement, 'setSoundEngagement').mockResolvedValue({
      ok: true,
      data: { active: true, count: 1 },
    });
    await moveTrackFavoritesToLikesWithToast('user-1');
    expect(toast.success).toHaveBeenCalledWith(
      'Moved 2 saved tracks to your likes',
    );
  });

  it('stays quiet when there is nothing to move', async () => {
    useLibraryStore.setState({ favoriteTracks: [STATION] });
    const like = vi.spyOn(engagement, 'setSoundEngagement');
    expect(await moveTrackFavoritesToLikesWithToast('user-1')).toBeNull();
    expect(like).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});
