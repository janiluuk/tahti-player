import { describe, expect, it } from 'vitest';

import {
  playableFromHearthisEmbed,
  playableFromStudioHearthis,
} from './embedPlayback';

describe('playableFromHearthisEmbed', () => {
  it('always sets the hearthis widget and never a stream URL', () => {
    const playable = playableFromHearthisEmbed({
      playerId: 'hearthis:99',
      title: 'Night Bus',
      artist: 'mockartist',
      embedUri: '99',
      durationSec: 180,
    });
    expect(playable.streamUrl).toBe('');
    expect(playable.sourceProvider).toBe('hearthis');
    expect(playable.embed).toEqual({
      provider: 'hearthis',
      embedUri: '99',
    });
  });
});

describe('playableFromStudioHearthis', () => {
  it('maps a Studio HEARTHIS archive row onto the shared player widget', () => {
    const playable = playableFromStudioHearthis({
      id: 'arch-mock-3',
      title: 'Imported from hearthis.at',
      artistName: 'You',
      embedProvider: 'HEARTHIS',
      embedUri: '1234567',
      durationSec: 2640,
    });
    expect(playable).toMatchObject({
      id: 'archive:arch-mock-3',
      streamUrl: '',
      sourceProvider: 'hearthis',
      embed: { provider: 'hearthis', embedUri: '1234567' },
    });
  });

  it('returns null for non-hearthis embeds', () => {
    expect(
      playableFromStudioHearthis({
        id: 'x',
        title: 'Spotify cut',
        embedProvider: 'SPOTIFY',
        embedUri: 'abc',
      }),
    ).toBeNull();
  });
});
