import { describe, expect, it } from 'vitest';

import { i18n } from '@tahti-player/i18n';

import { numericDate, relativeDate } from './relativeDate';

const now = new Date('2026-10-30T12:00:00.000Z');

describe('relativeDate', () => {
  it('humanizes anything inside a week', () => {
    expect(relativeDate('2026-10-30T11:59:30.000Z', now)).toBe('just now');
    expect(relativeDate('2026-10-30T11:15:00.000Z', now)).toBe(
      '45 minutes ago',
    );
    expect(relativeDate('2026-10-30T09:00:00.000Z', now)).toBe('3 hours ago');
    expect(relativeDate('2026-10-29T11:00:00.000Z', now)).toBe('1 day ago');
    expect(relativeDate('2026-10-24T13:00:00.000Z', now)).toBe('5 days ago');
  });

  it('shows d.m.yyyy from a week on, and for future dates', () => {
    const old = new Date(2026, 9, 2, 12);
    expect(relativeDate(old, now)).toBe('2.10.2026');
    const future = new Date(2026, 11, 24, 12);
    expect(relativeDate(future, now)).toBe('24.12.2026');
  });

  it('returns an empty string for an unparsable date', () => {
    expect(relativeDate('not a date', now)).toBe('');
  });

  it('speaks Finnish when the app language is Finnish', async () => {
    await i18n.changeLanguage('fi_FI');
    try {
      expect(relativeDate('2026-10-30T11:59:30.000Z', now)).toBe('juuri nyt');
      expect(relativeDate('2026-10-30T11:59:00.000Z', now)).toBe(
        '1 minuutti sitten',
      );
      expect(relativeDate('2026-10-30T11:15:00.000Z', now)).toBe(
        '45 minuuttia sitten',
      );
      expect(relativeDate('2026-10-30T09:00:00.000Z', now)).toBe(
        '3 tuntia sitten',
      );
      expect(relativeDate('2026-10-29T11:00:00.000Z', now)).toBe(
        '1 päivä sitten',
      );
      expect(relativeDate('2026-10-24T13:00:00.000Z', now)).toBe(
        '5 päivää sitten',
      );
    } finally {
      await i18n.changeLanguage('en_US');
    }
  });
});

describe('numericDate', () => {
  it('has no leading zeros', () => {
    expect(numericDate(new Date(2026, 0, 5))).toBe('5.1.2026');
  });
});
