import { describe, expect, it } from 'vitest';

import { artistProfileEmbed, profileTrackToPlayable } from './artistProfile';

describe('artistProfileEmbed', () => {
  it('embeds a SoundCloud profile', () => {
    expect(artistProfileEmbed('https://soundcloud.com/someone')?.label).toBe(
      'SoundCloud',
    );
  });

  it('rejects SoundCloud track URLs, unknown hosts and junk', () => {
    expect(artistProfileEmbed('https://soundcloud.com/a/b')).toBeNull();
    expect(artistProfileEmbed('https://example.com/x')).toBeNull();
    expect(artistProfileEmbed('not a url')).toBeNull();
  });

  it('only embeds Spotify artist/show/playlist links', () => {
    expect(
      artistProfileEmbed('https://open.spotify.com/artist/abc')?.height,
    ).toBe(352);
    expect(artistProfileEmbed('https://open.spotify.com/track/abc')).toBeNull();
  });
});

describe('profileTrackToPlayable', () => {
  it('returns null without a play URL and flags HLS streams', () => {
    const base = { id: 't1', title: 'T' } as never;
    expect(profileTrackToPlayable(base, 'A')).toBeNull();
    const hls = profileTrackToPlayable(
      { id: 't1', title: 'T', playUrl: 'https://x/y.m3u8' } as never,
      'A',
    );
    expect(hls?.protocol).toBe('hls');
    expect(hls?.artist).toBe('A');
  });
});
