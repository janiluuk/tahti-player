import { describe, expect, it } from 'vitest';

import {
  releaseDateFromReleasedAt,
  releasedAtFromReleaseDate,
} from './releasedAt';

describe('releasedAt', () => {
  it('sends the picked day as a UTC-midnight ISO datetime', () => {
    expect(releasedAtFromReleaseDate('2026-07-15')).toEqual({
      releasedAt: '2026-07-15T00:00:00.000Z',
    });
  });

  it('omits releasedAt when the date is cleared or malformed', () => {
    expect(releasedAtFromReleaseDate('')).toEqual({});
    expect(releasedAtFromReleaseDate(undefined)).toEqual({});
    expect(releasedAtFromReleaseDate('2026-13-45')).toEqual({});
    expect(releasedAtFromReleaseDate('15.07.2026')).toEqual({});
  });

  it('reads the API datetime back into the date input value', () => {
    expect(releaseDateFromReleasedAt('2026-07-15T00:00:00.000Z')).toBe(
      '2026-07-15',
    );
    expect(releaseDateFromReleasedAt(null)).toBe('');
    expect(releaseDateFromReleasedAt('not a date')).toBe('');
  });

  it('round-trips a saved day unchanged', () => {
    const { releasedAt } = releasedAtFromReleaseDate('2025-12-31');
    expect(releaseDateFromReleasedAt(releasedAt)).toBe('2025-12-31');
  });
});
