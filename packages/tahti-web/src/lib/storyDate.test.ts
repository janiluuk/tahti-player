import { describe, expect, it } from 'vitest';

import { storyDate } from './storyDate';

const now = new Date('2026-10-30T12:00:00.000Z');

describe('storyDate', () => {
  it('counts minutes, hours and days for the last week', () => {
    expect(storyDate('2026-10-30T11:59:30.000Z', now)).toBe('just now');
    expect(storyDate('2026-10-30T11:15:00.000Z', now)).toBe('45 minutes ago');
    expect(storyDate('2026-10-30T09:00:00.000Z', now)).toBe('3 hours ago');
    expect(storyDate('2026-10-29T11:00:00.000Z', now)).toBe('1 day ago');
    expect(storyDate('2026-10-25T12:00:00.000Z', now)).toBe('5 days ago');
  });

  it('shows the date after a week', () => {
    expect(storyDate('2026-10-02T12:00:00.000Z', now)).toBe('Oct 2, 2026');
  });

  it('returns nothing for a bad date', () => {
    expect(storyDate('not a date', now)).toBe('');
  });
});
