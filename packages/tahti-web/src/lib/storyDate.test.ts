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

  it('stays humanized after a week', () => {
    expect(storyDate('2026-10-16T12:00:00.000Z', now)).toBe('2 weeks ago');
    expect(storyDate('2026-08-14T12:00:00.000Z', now)).toBe('2 months ago');
    expect(storyDate('2025-09-01T12:00:00.000Z', now)).toBe('1 year ago');
  });

  it('treats a future date as just now', () => {
    expect(storyDate('2026-10-30T12:05:00.000Z', now)).toBe('just now');
  });

  it('returns nothing for a bad date', () => {
    expect(storyDate('not a date', now)).toBe('');
  });
});
