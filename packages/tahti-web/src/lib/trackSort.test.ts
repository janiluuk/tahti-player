import { describe, expect, it } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { sortTracks } from './trackSort';

const track = (
  id: string,
  title: string,
  artist: string,
  durationSec: number | null,
  releaseDate: string | null,
): TahtiPlayable => ({
  id,
  kind: 'sound',
  title,
  artist,
  streamUrl: `https://cdn.example/${id}.mp3`,
  protocol: 'https',
  durationSec,
  releaseDate,
});

const ITEMS = [
  track('a', 'beta', 'Zed', 200, '2026-01-01'),
  track('b', 'Alpha', 'yan', null, null),
  track('c', 'track 10', 'Aino', 90, '2026-06-01'),
  track('d', 'track 2', 'aino', 300, '2025-01-01'),
];

const ids = (items: TahtiPlayable[]) => items.map((item) => item.id);

describe('sortTracks', () => {
  it('keeps the caller order by default', () => {
    expect(ids(sortTracks(ITEMS, 'default'))).toEqual(['a', 'b', 'c', 'd']);
  });

  it('sorts titles case-insensitively with numbers in order', () => {
    expect(ids(sortTracks(ITEMS, 'title'))).toEqual(['b', 'a', 'd', 'c']);
  });

  it('keeps the original order for equal artists', () => {
    expect(ids(sortTracks(ITEMS, 'artist'))).toEqual(['c', 'd', 'b', 'a']);
  });

  it('puts tracks without a duration or date last', () => {
    expect(ids(sortTracks(ITEMS, 'shortest'))).toEqual(['c', 'a', 'd', 'b']);
    expect(ids(sortTracks(ITEMS, 'longest'))).toEqual(['d', 'a', 'c', 'b']);
    expect(ids(sortTracks(ITEMS, 'newest'))).toEqual(['c', 'a', 'd', 'b']);
  });

  it('does not change the input array', () => {
    const copy = [...ITEMS];
    sortTracks(ITEMS, 'title');
    expect(ITEMS).toEqual(copy);
  });
});
