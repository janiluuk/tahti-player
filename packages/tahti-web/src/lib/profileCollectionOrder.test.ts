import { describe, expect, it } from 'vitest';

import { publicCollectionsInProfileOrder } from './profileCollectionOrder';

describe('publicCollectionsInProfileOrder', () => {
  it('puts featured first, then the saved order, then newest; drops private ones', () => {
    const ordered = publicCollectionsInProfileOrder([
      {
        slug: 'a',
        name: 'A',
        isPublic: true,
        publicProfileOrder: 1,
        createdAt: '2026-01-01',
      },
      {
        slug: 'b',
        name: 'B',
        isPublic: true,
        publicProfileOrder: 0,
        createdAt: '2026-02-01',
      },
      {
        slug: 'new',
        name: 'New',
        isPublic: true,
        publicProfileOrder: 0,
        createdAt: '2026-03-01',
      },
      {
        slug: 'f',
        name: 'F',
        isPublic: true,
        publicProfileOrder: 5,
        isFeatured: true,
      },
      { slug: 'p', name: 'P', isPublic: false },
    ]);
    expect(ordered.map((c) => c.slug)).toEqual(['f', 'new', 'b', 'a']);
  });
});
