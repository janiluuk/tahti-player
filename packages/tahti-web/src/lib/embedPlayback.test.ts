import { describe, expect, it } from 'vitest';

import {
  playableFromEmbed,
  playableFromHearthisEmbed,
  playableFromStudioEmbed,
  playableFromStudioHearthis,
} from './embedPlayback';

describe('playableFromEmbed', () => {
  it('builds an embed-only playable keyed by the given provider', () => {
    const playable = playableFromEmbed('mixcloud', {
      playerId: 'sound:mix-1',
      title: 'Set',
      artist: 'Artist',
      embedUri: 'feed-abc',
      durationSec: 120,
    });
    expect(playable).toMatchObject({
      id: 'sound:mix-1',
      streamUrl: '',
      sourceProvider: 'mixcloud',
      embed: { provider: 'mixcloud', embedUri: 'feed-abc' },
    });
  });

  it('supports the spotify and bandcamp providers too', () => {
    expect(
      playableFromEmbed('spotify', {
        playerId: 'sound:sp',
        title: 'T',
        artist: 'A',
        embedUri: 'spotify:track:1',
      }).embed,
    ).toEqual({ provider: 'spotify', embedUri: 'spotify:track:1' });
    expect(
      playableFromEmbed('bandcamp', {
        playerId: 'sound:bc',
        title: 'T',
        artist: 'A',
        embedUri: 'track=1',
      }).embed,
    ).toEqual({ provider: 'bandcamp', embedUri: 'track=1' });
  });
});

describe('playableFromHearthisEmbed', () => {
  it('builds an embed-only playable with empty streamUrl', () => {
    const playable = playableFromHearthisEmbed({
      playerId: 'hearthis:1',
      title: 'Track',
      artist: 'Artist',
      coverUrl: 'https://example/cover.jpg',
      embedUri: '1',
      durationSec: 120,
    });
    expect(playable).toMatchObject({
      id: 'hearthis:1',
      streamUrl: '',
      sourceProvider: 'hearthis',
      embed: { provider: 'hearthis', embedUri: '1' },
    });
  });
});

describe('playableFromStudioHearthis', () => {
  it('maps a Studio HEARTHIS sound row onto the shared player widget', () => {
    const playable = playableFromStudioHearthis({
      id: 'snd-1',
      title: 'Studio track',
      artistName: 'You',
      embedProvider: 'HEARTHIS',
      embedUri: '99',
      durationSec: 90,
    });
    expect(playable).toMatchObject({
      id: 'sound:snd-1',
      streamUrl: '',
      sourceProvider: 'hearthis',
      embed: { provider: 'hearthis', embedUri: '99' },
    });
  });

  it('returns null for non-hearthis embeds', () => {
    expect(
      playableFromStudioHearthis({
        id: 'snd-2',
        title: 'Other',
        embedProvider: 'BANDCAMP',
        embedUri: 'x',
      }),
    ).toBeNull();
  });
});

describe('playableFromStudioEmbed', () => {
  it('maps hearthis and every other provider onto a shared-player embed', () => {
    const bc = playableFromStudioEmbed({
      id: 'snd-bc',
      title: 'Bc',
      artistName: 'You',
      embedProvider: 'BANDCAMP',
      embedUri: 'track=1',
    });
    expect(bc).toMatchObject({
      sourceProvider: 'bandcamp',
      embed: { provider: 'bandcamp', embedUri: 'track=1' },
    });

    const sp = playableFromStudioEmbed({
      id: 'snd-sp',
      title: 'Sp',
      embedProvider: 'SPOTIFY',
      embedUri: 'spotify:track:1',
    });
    expect(sp).toMatchObject({
      sourceProvider: 'spotify',
      embed: { provider: 'spotify', embedUri: 'spotify:track:1' },
      artist: 'Unknown',
    });

    const mikseri = playableFromStudioEmbed({
      id: 'snd-mikseri',
      title: 'Mikseri track',
      embedProvider: 'MIKSERI',
      embedUri: 'https://www.mikseri.net/embed/?type=1&parameter=635878',
    });
    expect(mikseri).toMatchObject({
      sourceProvider: 'mikseri',
      embed: {
        provider: 'mikseri',
        embedUri: 'https://www.mikseri.net/embed/?type=1&parameter=635878',
      },
    });
  });

  it('falls back to the native path when there is no embed', () => {
    expect(
      playableFromStudioEmbed({
        id: 'snd-3',
        title: 'Other',
        embedProvider: null,
        embedUri: null,
      }),
    ).toBeNull();
    expect(
      playableFromStudioEmbed({
        id: 'snd-4',
        title: 'NoUri',
        embedProvider: 'MIXCLOUD',
        embedUri: null,
      }),
    ).toBeNull();
  });
});
