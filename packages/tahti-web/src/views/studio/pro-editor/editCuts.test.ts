import { describe, expect, it } from 'vitest';

import {
  keptDuration,
  mergeCuts,
  silenceCuts,
  trimToRange,
  zoomRange,
} from './editCuts';

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

describe('silenceCuts', () => {
  it('finds leading and trailing silence', () => {
    const peaks = [0, 0, 0.5, 0.6, 0.5, 0, 0, 0];
    expect(silenceCuts(peaks, 8)).toEqual([
      { start: 0, end: 2 },
      { start: 5, end: 8 },
    ]);
  });

  it('returns nothing for empty, all-silent or tight audio', () => {
    expect(silenceCuts([], 8)).toEqual([]);
    expect(silenceCuts([0, 0, 0], 3)).toEqual([]);
    expect(silenceCuts([0.5, 0.5], 2)).toEqual([]);
  });
});

describe('zoomRange', () => {
  it('stays inside 0..1 when zooming out past the edge', () => {
    expect(zoomRange(0, 0.5, 4)).toEqual([0, 1]);
  });

  it('zooms in around the centre', () => {
    const [s, e] = zoomRange(0, 1, 0.5);
    expect(s).toBeCloseTo(0.25);
    expect(e).toBeCloseTo(0.75);
  });
});
