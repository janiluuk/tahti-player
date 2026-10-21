import {
  formatClockTime,
  formatDateTime,
  formatTimeMillis,
  formatTimeSeconds,
} from './time';

describe('formatTimeSeconds', () => {
  it.each([
    [0, '0:00'],
    [5, '0:05'],
    [65, '1:05'],
    [599.9, '9:59'],
    [3600, '1:00:00'],
    [3725, '1:02:05'],
    [36125, '10:02:05'],
    [-65, '-1:05'],
  ])('%s seconds is %s', (seconds, expected) => {
    expect(formatTimeSeconds(seconds)).toBe(expected);
  });

  it('is empty without a value', () => {
    expect(formatTimeSeconds(undefined)).toBe('');
    expect(formatTimeMillis(undefined)).toBe('');
  });

  it('formats milliseconds', () => {
    expect(formatTimeMillis(125_999)).toBe('2:05');
  });
});

describe('log timestamps', () => {
  const date = new Date(2026, 0, 5, 7, 8, 9, 42);

  it('formats the time of day with milliseconds', () => {
    expect(formatClockTime(date)).toBe('07:08:09.042');
  });

  it('formats the full date and time', () => {
    expect(formatDateTime(date)).toBe('2026-01-05 07:08:09.042');
  });
});
