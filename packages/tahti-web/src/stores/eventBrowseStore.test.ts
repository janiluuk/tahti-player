import { describe, expect, it } from 'vitest';

import { resolveEventNeighbours, toEventBrowseItems } from './eventBrowseStore';

const row = [
  { id: 'a', title: 'A' },
  { id: 'b', title: 'B' },
  { id: 'c', title: 'C' },
];

describe('resolveEventNeighbours', () => {
  it('finds both neighbours in the middle of a row', () => {
    expect(resolveEventNeighbours(row, 'b')).toEqual({
      previous: { id: 'a', title: 'A' },
      next: { id: 'c', title: 'C' },
      position: 2,
      total: 3,
    });
  });

  it('stops at the ends instead of wrapping', () => {
    expect(resolveEventNeighbours(row, 'a')).toMatchObject({
      previous: null,
      next: { id: 'b' },
      position: 1,
    });
    expect(resolveEventNeighbours(row, 'c')).toMatchObject({
      previous: { id: 'b' },
      next: null,
      position: 3,
    });
  });

  it('is null without a row, outside it, or for a row of one', () => {
    expect(resolveEventNeighbours(null, 'a')).toBeNull();
    expect(resolveEventNeighbours(row, 'zzz')).toBeNull();
    expect(resolveEventNeighbours([{ id: 'a', title: 'A' }], 'a')).toBeNull();
  });

  it('counts an event listed twice once', () => {
    expect(
      resolveEventNeighbours([...row, { id: 'a', title: 'A' }], 'c'),
    ).toMatchObject({ next: null, total: 3 });
  });
});

describe('toEventBrowseItems', () => {
  it('keeps only id and title, in order', () => {
    expect(
      toEventBrowseItems([
        { id: 'x', title: 'X', extra: 1 } as { id: string; title: string },
        { id: 'y', title: 'Y' },
      ]),
    ).toEqual([
      { id: 'x', title: 'X' },
      { id: 'y', title: 'Y' },
    ]);
  });
});
