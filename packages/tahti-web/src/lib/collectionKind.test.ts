import { describe, expect, it } from 'vitest';

import { collectionKind, collectionsOfKind } from './collectionKind';

describe('collectionKind', () => {
  it.each([
    [{ type: 'ALBUM', style: 'PLAYLIST' }, 'album'],
    [{ type: 'CUSTOM', style: 'EP' }, 'album'],
    [{ type: 'CUSTOM', style: 'SINGLE' }, 'album'],
    [{ type: 'MIX_SERIES', style: 'PLAYLIST' }, 'dj-set'],
    [{ type: 'CUSTOM', style: 'DJ_SET_SERIES' }, 'dj-set'],
    [{ type: 'CUSTOM', style: 'PLAYLIST' }, 'other'],
    [{ type: 'CUSTOM', style: 'PODCAST' }, 'other'],
  ])('%o is %s', (collection, kind) => {
    expect(collectionKind(collection)).toBe(kind);
  });

  it('filters a list by kind, keeping order', () => {
    const list = [
      { slug: 'a', type: 'ALBUM', style: 'ALBUM' },
      { slug: 'b', type: 'CUSTOM', style: 'DJ_SET_SERIES' },
      { slug: 'c', type: 'CUSTOM', style: 'EP' },
    ];
    expect(collectionsOfKind(list, 'album').map((c) => c.slug)).toEqual([
      'a',
      'c',
    ]);
  });
});
