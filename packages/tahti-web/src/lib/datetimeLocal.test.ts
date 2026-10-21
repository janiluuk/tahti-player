import { describe, expect, it } from 'vitest';

import { fromDatetimeLocalValue, toDatetimeLocalValue } from './datetimeLocal';

describe('datetime-local helpers', () => {
  it('round-trips a local wall-clock time through ISO', () => {
    const iso = fromDatetimeLocalValue('2030-05-04T18:30');
    expect(iso).toBe(new Date(2030, 4, 4, 18, 30).toISOString());
    expect(toDatetimeLocalValue(iso!)).toBe('2030-05-04T18:30');
  });

  it('returns null for an empty or invalid value', () => {
    expect(fromDatetimeLocalValue('')).toBeNull();
    expect(fromDatetimeLocalValue('not a date')).toBeNull();
  });
});
