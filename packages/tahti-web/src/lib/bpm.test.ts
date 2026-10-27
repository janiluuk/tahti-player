import { describe, expect, it } from 'vitest';

import {
  addTap,
  bpmInputError,
  bpmRanges,
  bpmShiftPercent,
  doubleBpm,
  halveBpm,
  tempoFromTaps,
} from './bpm';

describe('tap tempo', () => {
  it('averages the taps into a BPM', () => {
    expect(tempoFromTaps([0, 500, 1000, 1500])).toBe(120);
    expect(tempoFromTaps([0])).toBeNull();
  });

  it('starts over after a pause and keeps a rolling window', () => {
    let taps: number[] = [];
    for (const at of [0, 500, 1000]) {
      taps = addTap(taps, at);
    }
    expect(addTap(taps, 5000)).toEqual([5000]);
    let many: number[] = [];
    for (let index = 0; index < 12; index += 1) {
      many = addTap(many, index * 469);
    }
    expect(many).toHaveLength(8);
    expect(tempoFromTaps(many)).toBe(127.9);
  });

  it('ignores tempos no DJ would play', () => {
    expect(tempoFromTaps([0, 100])).toBeNull();
  });
});

describe('half and double', () => {
  it('stays within the sane range', () => {
    expect(halveBpm(140)).toBe(70);
    expect(doubleBpm(87)).toBe(174);
    expect(halveBpm(70)).toBeNull();
    expect(doubleBpm(174)).toBeNull();
  });
});

describe('bpmRanges', () => {
  it('spans the tolerance around the tempo and its half and double', () => {
    expect(bpmRanges(128, 6, false)).toEqual([
      { min: 120.3, max: 135.7, factor: 1 },
    ]);
    expect(bpmRanges(160, 3, true).map((range) => range.factor)).toEqual([
      1, 0.5,
    ]);
    expect(bpmRanges(100, 3, true).map((range) => range.factor)).toEqual([
      1, 2, 0.5,
    ]);
  });
});

describe('bpmShiftPercent', () => {
  it('measures the pitch change to the nearest tempo multiple', () => {
    expect(bpmShiftPercent(128, 130)).toBe(1.6);
    expect(bpmShiftPercent(140, 70)).toBe(0);
    expect(bpmShiftPercent(126, 120)).toBe(-4.8);
  });
});

describe('bpmInputError', () => {
  it('allows blank and 0 (clears) and rejects silly values', () => {
    expect(bpmInputError('')).toBeNull();
    expect(bpmInputError('0')).toBeNull();
    expect(bpmInputError('128')).toBeNull();
    expect(bpmInputError('abc')).toMatch(/number/);
    expect(bpmInputError('999')).toMatch(/between/);
  });
});
