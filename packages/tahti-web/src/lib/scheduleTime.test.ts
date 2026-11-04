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
});
