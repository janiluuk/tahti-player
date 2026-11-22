import { describe, expect, it } from 'vitest';

import type { PublicCollection } from '../api/types';
import { collectionTintUrl, coverWash } from './collectionTint';

function item(id: string, bannerUrl: string | null) {
  return {
    id,
    position: 0,
    sound: { id, title: id, bannerUrl },
    release: null,
  } as PublicCollection['items'][number];
}

describe('collectionTintUrl', () => {
  it('uses the collection cover first', () => {
    expect(
      collectionTintUrl({
        coverUrl: '/cover.jpg',
        items: [item('a', '/track.jpg')],
      }),
    ).toBe('/cover.jpg');
  });

  it('falls back to the first track that has a cover', () => {
    expect(
      collectionTintUrl({
        coverUrl: null,
        items: [
          { ...item('r', null), sound: null },
          item('a', null),
          item('b', '/b.jpg'),
          item('c', '/c.jpg'),
        ],
      }),
    ).toBe('/b.jpg');
  });

  it('gives no tint when nothing has artwork', () => {
    expect(
      collectionTintUrl({ coverUrl: null, items: [item('a', null)] }),
    ).toBeNull();
  });
});

describe('coverWash', () => {
  it('is a low-alpha gradient that fades to transparent', () => {
    const wash = coverWash([232, 117, 26]);
    expect(wash).toMatch(/^linear-gradient\(/);
    expect(wash).toContain('rgba(232, 117, 26, 0.3)');
    expect(wash).toContain('transparent');
    expect(wash).not.toContain('rgb(232, 117, 26)');
  });
});
