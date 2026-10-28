import { describe, expect, it } from 'vitest';

import { formatCountdown, formatRunningTime } from './format';

describe('formatCountdown', () => {
  it('shows minutes and seconds under an hour', () => {
    expect(formatCountdown(65_000)).toBe('01:05');
    expect(formatCountdown(0)).toBe('00:00');
    expect(formatCountdown(-5)).toBe('00:00');
  });

  it('rounds up so it never reads zero before the start', () => {
    expect(formatCountdown(1)).toBe('00:01');
  });

  it('adds hours and days', () => {
    expect(formatCountdown(3_600_000 + 61_000)).toBe('01:01:01');
    expect(formatCountdown(2 * 86_400_000 + 3_600_000)).toBe('2 d 01:00:00');
  });
});

describe('formatRunningTime', () => {
  it('rounds to minutes', () => {
    expect(formatRunningTime(2000)).toBe('33 min');
    expect(formatRunningTime(3900)).toBe('1 h 05 min');
  });
});
