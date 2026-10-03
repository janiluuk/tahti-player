import { describe, expect, it, vi } from 'vitest';

import * as comments from '../../api/comments';
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

  it('blocks playback while the API gates the track, even with a cached URL', () => {
    const detail = {
      accessMode: 'SUBSCRIBERS_ONLY',
      audioUrl: null,
      gate: { reason: 'SUBSCRIBERS_ONLY' },
      channel: { username: 'artist' },
    } as TrackDetailState['detail'];
    const gated = state({ detail, currentId: 'sound:other' });
    const page = buildTrackPage(gated, playable);

    expect(page.accessGate).toEqual({ reason: 'SUBSCRIBERS_ONLY' });
    expect(page.canPlay).toBe(false);
    page.togglePlayback();
    page.jumpTo(10);
    expect(gated.play).not.toHaveBeenCalled();

    const open = buildTrackPage(
      state({ detail: { ...detail!, gate: null } }),
      playable,
    );
    expect(open.accessGate).toBeNull();
    expect(open.canPlay).toBe(true);
  });

  it('opens the name-your-price dialog or buys at the set price', () => {
    const setPwywOpen = vi.fn();
    const setPwywAmt = vi.fn();
    buildTrackPage(
      state({
        detail: {
          purchaseTierId: 'tier',
          purchaseTierPriceCents: 350,
          purchaseTierPriceOptional: true,
          channel: { username: 'artist' },
        } as TrackDetailState['detail'],
        setPwywOpen,
        setPwywAmt,
      }),
      playable,
    ).startBuy();

    expect(setPwywAmt).toHaveBeenCalledWith('3.50');
    expect(setPwywOpen).toHaveBeenCalledWith(true);
  });

  it('lets the author and the track owner delete a comment', async () => {
    const setComments = vi.fn();
    const comment = {
      id: 'c1',
      body: 'Nice',
      authorUsername: 'fan',
      authorDisplayName: 'Fan',
      authorAvatarUrl: null,
      createdAt: '2026-09-01T12:00:00.000Z',
    };
    const asFan = buildTrackPage(
      state({
        user: { username: 'fan' } as TrackDetailState['user'],
        detail: {
          channel: { username: 'artist' },
        } as TrackDetailState['detail'],
        setComments,
        setDeletingCommentId: vi.fn(),
      }),
      playable,
    );
    expect(asFan.canDeleteComment(comment)).toBe(true);
    expect(
      asFan.canDeleteComment({ ...comment, authorUsername: 'someone' }),
    ).toBe(false);
    const asOwner = buildTrackPage(
      state({
        user: { username: 'artist' } as TrackDetailState['user'],
        detail: {
          channel: { username: 'artist' },
        } as TrackDetailState['detail'],
      }),
      playable,
    );
    expect(
      asOwner.canDeleteComment({ ...comment, authorUsername: 'someone' }),
    ).toBe(true);
    expect(buildTrackPage(state(), playable).canDeleteComment(comment)).toBe(
      false,
    );

    const spy = vi.spyOn(comments, 'deleteComment').mockResolvedValue({
      ok: true,
    });
    await asFan.removeComment('c1');
    expect(spy).toHaveBeenCalledWith('c1');
    const update = setComments.mock.calls[0]![0] as (
      current: (typeof comment)[],
    ) => (typeof comment)[];
    expect(update([comment, { ...comment, id: 'c2' }])).toEqual([
      { ...comment, id: 'c2' },
    ]);
  });
});
