import { describe, expect, it } from 'vitest';

import { trimToCuts } from './episodeTrim';

describe('trimToCuts', () => {
  it('removes everything before the start', () => {
    expect(trimToCuts(10, 0, 100)).toEqual([{ start: 0, end: 10 }]);
  });
  it('removes everything after the end', () => {
    expect(trimToCuts(0, 90, 100)).toEqual([{ start: 90, end: 100 }]);
  });
  it('keeps only [start, end]', () => {
    expect(trimToCuts(10, 90, 100)).toEqual([
      { start: 0, end: 10 },
      { start: 90, end: 100 },
    ]);
  });
  it('treats 0 / an end at or before the start as "to the end"', () => {
    expect(trimToCuts(20, 10, 100)).toEqual([{ start: 0, end: 20 }]);
    expect(trimToCuts(0, 0, 100)).toEqual([]);
  });
  it('ignores NaN and clamps to the source length', () => {
    expect(trimToCuts(Number.NaN, 500, 100)).toEqual([]);
  });
});
