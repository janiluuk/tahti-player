import { describe, expect, it } from 'vitest';

import type { OnAirChannel } from '../../api/listen';
import {
  isPlayableReplay,
  onAirListing,
  withoutFailedReplays,
} from './onAirChannels';

const HLS = 'https://cdn.example/hls-live';

function channel(
  slug: string,
  overrides: Partial<OnAirChannel> = {},
): OnAirChannel {
  return {
    slug,
    state: 'LIVE',
    fallbackEnabled: true,
    hlsUrl: `${HLS}/${slug}/master.m3u8`,
    nowPlaying: { title: 'Track', artistName: 'Artist', artworkUrl: null },
    user: { username: slug, displayName: slug, avatarUrl: null },
    ...overrides,
  };
}

describe('isPlayableReplay', () => {
  it('needs both a stream and a track on air', () => {
    expect(isPlayableReplay(channel('a'))).toBe(true);
    expect(isPlayableReplay(channel('a', { nowPlaying: null }))).toBe(false);
    expect(isPlayableReplay(channel('a', { hlsUrl: null }))).toBe(false);
    expect(
      isPlayableReplay(
        channel('a', { hlsUrl: undefined, nowPlaying: undefined }),
      ),
    ).toBe(false);
  });
});

describe('onAirListing', () => {
  it('keeps live channels and only the replays that can play', () => {
    const listing = onAirListing({
      live: [channel('dj', { nowPlaying: null })],
      replaying: [
        channel('rotation'),
        channel('silent', { nowPlaying: null }),
        channel('offline', { state: 'OFFLINE', hlsUrl: null }),
      ],
    });
    expect(listing.map((c) => [c.slug, c.state])).toEqual([
      ['dj', 'LIVE'],
      ['rotation', 'REPLAY'],
    ]);
  });

  it('leaves out Tahti Radio and a replay that is also live', () => {
    const listing = onAirListing({
      live: [channel('dj')],
      replaying: [channel('dj'), channel('tahti-radio')],
    });
    expect(listing.map((c) => c.slug)).toEqual(['dj']);
  });
});

describe('withoutFailedReplays', () => {
  it('hides a replay whose stream failed, never a live channel', () => {
    const live = { ...channel('dj'), state: 'LIVE' };
    const replay = { ...channel('rotation'), state: 'REPLAY' };
    const failed = {
      state: 'unavailable' as const,
      failure: { reason: 'unreachable' as const },
      checkedAt: 0,
    };
    expect(
      withoutFailedReplays([live, replay], {
        [live.hlsUrl!]: failed,
        [replay.hlsUrl!]: failed,
      }).map((c) => c.slug),
    ).toEqual(['dj']);
    expect(
      withoutFailedReplays([live, replay], {
        [replay.hlsUrl!]: { state: 'ok', checkedAt: 0 },
      }).map((c) => c.slug),
    ).toEqual(['dj', 'rotation']);
  });
});
