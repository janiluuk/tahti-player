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
    expect(playable.embed).toEqual({ provider: 'hearthis', embedUri: '99' });
  });
});

describe('playableFromStudioHearthis', () => {
  it('builds an archive playable for a HEARTHIS sound', () => {
    const playable = playableFromStudioHearthis({
      id: 'arch-mock-3',
      title: 'Imported from hearthis.at',
      artistName: 'You',
      embedProvider: 'HEARTHIS',
      embedUri: '1234567',
    });
    expect(playable).toMatchObject({
      id: 'archive:arch-mock-3',
      embed: { provider: 'hearthis', embedUri: '1234567' },
      streamUrl: '',
    });
  });

  it('returns null for Mixcloud/Spotify/Bandcamp (inline widget only)', () => {
    expect(
      playableFromStudioHearthis({
        id: 'x',
        title: 'Set',
        embedProvider: 'MIXCLOUD',
        embedUri: '/artist/set/',
      }),
    ).toBeNull();
  });
});
