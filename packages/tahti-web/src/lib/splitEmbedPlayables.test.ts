import { describe, expect, it } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { splitEmbedPlayables } from './splitEmbedPlayables';

const playable = (id: string, embed = false) =>
  ({
    id,
    kind: 'sound',
    title: id,
    artist: 'A',
    ...(embed
      ? { embed: { provider: 'soundcloud', embedUri: `sc:${id}` } }
      : {}),
  }) as TahtiPlayable;

describe('splitEmbedPlayables', () => {
  it('keeps hosted tracks and embeds apart in their original order', () => {
    const { tracks, embeds } = splitEmbedPlayables([
      playable('a'),
      playable('b', true),
      playable('c'),
      playable('d', true),
    ]);
    expect(tracks.map((item) => item.id)).toEqual(['a', 'c']);
    expect(embeds.map((item) => item.id)).toEqual(['b', 'd']);
  });
});
