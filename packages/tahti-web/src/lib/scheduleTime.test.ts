import { afterEach, describe, expect, it } from 'vitest';

import { i18n } from '@tahti-player/i18n';

import { formatScheduleWindow } from './scheduleTime';

describe('formatScheduleWindow', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en_US');
  });

  it('joins the day, start and end with the given separator', () => {
    const start = new Date(2026, 10, 3, 18, 0).toISOString();
    const end = new Date(2026, 10, 3, 19, 30).toISOString();
    expect(formatScheduleWindow(start, end)).toBe(
      'Tue, Nov 3 · 06:00 PM–07:30 PM',
    );
    expect(formatScheduleWindow(start, end, ' ')).toBe(
      'Tue, Nov 3 06:00 PM–07:30 PM',
    );
  });

  it('leaves the end off when there is none', () => {
    const start = new Date(2026, 10, 3, 18, 0).toISOString();
    expect(formatScheduleWindow(start)).toBe('Tue, Nov 3 · 06:00 PM');
    expect(formatScheduleWindow(start, null)).toBe('Tue, Nov 3 · 06:00 PM');
  });

  it('formats the window in Finnish when the app language is Finnish', async () => {
    await i18n.changeLanguage('fi_FI');
    const start = new Date(2026, 10, 3, 18, 0).toISOString();
    const end = new Date(2026, 10, 3, 19, 30).toISOString();
    expect(formatScheduleWindow(start, end)).toBe('ti 3.11. · 18.00–19.30');
  });
});
