import { describe, expect, it } from 'vitest';

import { searchTrackPlayable } from './searchTrackPlayable';

const base = {
  id: 's1',
  title: 'Polar Static',
  artistName: 'Northern Lights',
  channelSlug: 'northern-lights',
  durationSec: 244,
  coverUrl: null,
};

describe('searchTrackPlayable', () => {
  it('plays a track with a stream', () => {
    expect(
      searchTrackPlayable({ ...base, audioUrl: 'https://cdn.example/a.mp3' }),
    ).toMatchObject({
      id: 'sound:s1',
      kind: 'sound',
      streamUrl: 'https://cdn.example/a.mp3',
      protocol: 'https',
      channelSlug: 'northern-lights',
    });
  });

  it('keeps an id that already has the sound prefix', () => {
    expect(
      searchTrackPlayable({
        ...base,
        id: 'sound:s1',
        audioUrl: 'https://cdn.example/a.m3u8',
      }),
    ).toMatchObject({ id: 'sound:s1', protocol: 'hls' });
  });

  it('plays an embed-only track through its widget', () => {
    expect(
      searchTrackPlayable({
        ...base,
        audioUrl: null,
        embedProvider: 'HEARTHIS',
        embedUri: '1234567',
      })?.embed,
    ).toMatchObject({ provider: 'hearthis', embedUri: '1234567' });
  });

  it('leaves gated tracks and old API answers unplayable', () => {
    expect(
      searchTrackPlayable({
        ...base,
        audioUrl: null,
        gate: { reason: 'SUBSCRIBERS_ONLY' },
      }),
    ).toBeNull();
    expect(searchTrackPlayable(base)).toBeNull();
  });
});
