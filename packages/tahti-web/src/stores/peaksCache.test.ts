import { describe, expect, it } from 'vitest';

import { peaksFor, rememberPeaks } from './peaksCache';

describe('rememberPeaks', () => {
  it('stores peaks by id and ignores empty ones', () => {
    const cache = rememberPeaks({}, 'a', [1, 2]);
    expect(peaksFor(cache, 'a')).toEqual([1, 2]);
    expect(rememberPeaks(cache, 'b', [])).toBe(cache);
    expect(rememberPeaks(cache, 'b', null)).toBe(cache);
    expect(peaksFor(cache, 'b')).toBeNull();
  });

  it('drops the least recently stored ids past the limit', () => {
    let cache = {};
    for (const id of ['a', 'b', 'c']) {
      cache = rememberPeaks(cache, id, [1], 3);
    }
    cache = rememberPeaks(cache, 'a', [2], 3);
    cache = rememberPeaks(cache, 'd', [3], 3);

    expect(Object.keys(cache)).toEqual(['c', 'a', 'd']);
    expect(peaksFor(cache, 'a')).toEqual([2]);
  });

  it('keeps its own copy of the peaks', () => {
    const peaks = [5];
    const cache = rememberPeaks({}, 'a', peaks);
    peaks.push(6);
    expect(peaksFor(cache, 'a')).toEqual([5]);
  });
});
