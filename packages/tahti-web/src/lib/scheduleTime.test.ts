import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatScheduleWindow } from './scheduleTime';

describe('formatScheduleWindow', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('formats a start-only window with day and clock', () => {
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue(
      'Mon, Nov 3',
    );
    vi.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('18:00');
    expect(formatScheduleWindow('2026-11-03T16:00:00.000Z')).toBe(
      'Mon, Nov 3 · 18:00',
    );
  });

  it('formats a start–end window', () => {
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue(
      'Mon, Nov 3',
    );
    vi.spyOn(Date.prototype, 'toLocaleTimeString')
      .mockReturnValueOnce('18:00')
      .mockReturnValueOnce('19:00');
    expect(
      formatScheduleWindow(
        '2026-11-03T16:00:00.000Z',
        '2026-11-03T17:00:00.000Z',
      ),
    ).toBe('Mon, Nov 3 · 18:00–19:00');
  });

  it('shows the day and times of the given time zone', () => {
    const at = '2026-11-03T23:30:00.000Z';
    expect(formatScheduleWindow(at, null, ' · ', 'Asia/Tokyo')).toMatch(
      /08[:.]30/,
    );
    expect(formatScheduleWindow(at, null, ' · ', 'America/New_York')).toMatch(
      /(18|06)[:.]30/,
    );
  });

  it('ignores an unknown time zone instead of throwing', () => {
    expect(() =>
      formatScheduleWindow(
        '2026-11-03T16:00:00.000Z',
        null,
        ' · ',
        'Mars/Base',
      ),
    ).not.toThrow();
  });
});
