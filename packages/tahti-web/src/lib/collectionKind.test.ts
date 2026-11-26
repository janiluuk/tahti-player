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

  it.each([
    ['Sets', 'dj-set'],
    ['Set of Schranz from 00 era', 'dj-set'],
    ['sets 2026', 'dj-set'],
    ['2026 sets', 'dj-set'],
    ['DJ sets', 'dj-set'],
    ['Jet Set EP', 'album'],
    ['Sunset drive', 'other'],
    ['Revitalize LP', 'album'],
    ['Uncanny Alley EP', 'album'],
    ['Yani & Ho - Mute8 (2026)', 'other'],
    ['Tracks', 'other'],
    ['Settings test', 'other'],
  ])('a generic playlist named %s is %s', (name, kind) => {
    expect(collectionKind({ type: 'CUSTOM', style: 'PLAYLIST', name })).toBe(
      kind,
    );
  });

  it('lets an explicit style win over the name', () => {
    expect(
      collectionKind({ type: 'CUSTOM', style: 'ALBUM', name: 'Sets' }),
    ).toBe('album');
  });
});
