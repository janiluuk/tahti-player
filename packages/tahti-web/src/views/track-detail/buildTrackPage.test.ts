import { describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../../api/types';
import { buildTrackPage } from './buildTrackPage';
import type { TrackDetailState } from './useTrackDetail';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const playable = {
  id: 'sound:t1',
  title: 'Track',
  streamUrl: 'https://example.test/t1.mp3',
  durationSec: 200,
} as TahtiPlayable;

const state = (overrides: Partial<TrackDetailState> = {}) =>
  ({
    id: 't1',
    playableId: 'sound:t1',
    user: null,
    detail: null,
    channel: null,
    profile: null,
    comments: [],
    commentsEnabled: true,
    commentBody: '',
    currentId: 'sound:t1',
    status: 'playing',
    currentTime: 90,
    duration: 0,
    favoriteTracks: [],
    rgb: null,
    tracklist: [],
    purchaseEntitled: true,
    play: vi.fn(),
    setStatus: vi.fn(),
    seekTo: vi.fn(),
    ...overrides,
  }) as unknown as TrackDetailState;

describe('buildTrackPage', () => {
  it('derives progress and the active cue from the player position', () => {
    const page = buildTrackPage(
      state({
        tracklist: [
          { id: 'a', startSec: 0 },
          { id: 'b', startSec: 60 },
          { id: 'c', startSec: 120 },
        ] as TrackDetailState['tracklist'],
      }),
      playable,
    );

    expect(page.isPlaying).toBe(true);
    expect(page.totalDuration).toBe(200);
    expect(page.progress).toBeCloseTo(0.45);
    expect(page.activeCueId).toBe('b');
    expect(page.clock).toBe('1:30');
  });

  it('ignores the player position when another track is current', () => {
    const page = buildTrackPage(state({ currentId: 'sound:other' }), playable);

    expect(page.isCurrent).toBe(false);
    expect(page.isPlaying).toBe(false);
    expect(page.elapsed).toBe(0);
    expect(page.progress).toBe(0);
  });

  it('places markers only for timed comments', () => {
    const page = buildTrackPage(
      state({
        comments: [
          { id: '1', body: '[0:50] nice' },
          { id: '2', body: 'untimed' },
        ] as TrackDetailState['comments'],
      }),
      playable,
    );

    expect(page.commentMarkers).toEqual([{ fraction: 0.25 }]);
  });

  it('pauses the current track and plays another one', () => {
    const current = state();
    buildTrackPage(current, playable).togglePlayback();
    expect(current.setStatus).toHaveBeenCalledWith('paused');

    const other = state({ currentId: 'sound:other' });
    buildTrackPage(other, playable).togglePlayback();
    expect(other.play).toHaveBeenCalledWith(playable);
  });

  it('offers to buy only unentitled purchase tracks', () => {
    const detail = {
      accessMode: 'PURCHASE',
      purchaseTierId: 'tier',
      channel: { username: 'artist' },
    } as TrackDetailState['detail'];

    expect(
      buildTrackPage(state({ detail, purchaseEntitled: false }), playable)
        .showBuyTrack,
    ).toBe(true);
    expect(
      buildTrackPage(state({ detail, purchaseEntitled: true }), playable)
        .showBuyTrack,
    ).toBe(false);
  });
});
