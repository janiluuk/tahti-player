import { describe, expect, it } from 'vitest';

import { keptDuration, mergeCuts, trimToRange } from './editCuts';

describe('mergeCuts / keptDuration', () => {
  it('merges overlapping and touching cuts', () => {
    expect(
      mergeCuts([
        { start: 5, end: 8 },
        { start: 1, end: 3 },
        { start: 2, end: 6 },
      ]),
    ).toEqual([{ start: 1, end: 8 }]);
  });

  it('does not double-count overlapping cuts', () => {
    expect(
      keptDuration(10, [
        { start: 0, end: 4 },
        { start: 2, end: 6 },
      ]),
    ).toBe(4);
  });
});

describe('trimToRange', () => {
  it('cuts head and tail and keeps cuts inside the range', () => {
    expect(
      trimToRange(
        [
          { start: 4, end: 5 },
          { start: 8, end: 9 },
        ],
        10,
        2,
        7,
      ),
    ).toEqual([
      { start: 0, end: 2 },
      { start: 4, end: 5 },
      { start: 7, end: 10 },
    ]);
  });

  it('adds no cut where the range touches the ends', () => {
    expect(trimToRange([], 10, 0, 10)).toEqual([]);
  });
});
