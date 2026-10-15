import { formatReleaseDate } from './date';

describe('formatReleaseDate', () => {
  it('formats an ISO date without a time component', () => {
    expect(formatReleaseDate('2026-01-15T00:00:00.000Z')).toBe('Jan 15, 2026');
  });

  it('returns an empty string when the date is missing', () => {
    expect(formatReleaseDate(undefined)).toBe('');
  });

  it('returns an empty string for an unparsable date', () => {
    expect(formatReleaseDate('not-a-date')).toBe('');
    expect(formatReleaseDate('March 7')).toBe('');
    expect(formatReleaseDate('2026-13-45')).toBe('');
  });

  it('keeps a bare calendar date on its day in any timezone', () => {
    expect(formatReleaseDate('2026-04-01')).toBe('Apr 1, 2026');
    expect(formatReleaseDate('2026-12-31T23:30:00.000Z')).toBe('Dec 31, 2026');
  });
});
