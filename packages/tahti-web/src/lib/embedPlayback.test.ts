import { describe, expect, it } from 'vitest';

import {
  playableFromHearthisEmbed,
  playableFromStudioHearthis,
} from './embedPlayback';

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
