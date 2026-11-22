import { describe, expect, it } from 'vitest';

import { endAtFor, isUpcomingOrLiveScheduleCard } from './schedule-helpers';

describe('isUpcomingOrLiveScheduleCard', () => {
  const now = Date.parse('2026-11-22T20:00:00.000Z');

  it('keeps a show that has not started yet', () => {
    expect(
      isUpcomingOrLiveScheduleCard(
        {
          startAt: '2026-11-22T21:00:00.000Z',
          endAt: '2026-11-22T22:00:00.000Z',
        },
        now,
      ),
    ).toBe(true);
  });

  it('keeps a show that is still on air', () => {
    expect(
      isUpcomingOrLiveScheduleCard(
        {
          startAt: '2026-11-22T19:30:00.000Z',
          endAt: '2026-11-22T20:30:00.000Z',
        },
        now,
      ),
    ).toBe(true);
  });

  it('hides a long-overdue show', () => {
    expect(
      isUpcomingOrLiveScheduleCard(
        {
          startAt: '2026-10-01T18:00:00.000Z',
          endAt: endAtFor('2026-10-01T18:00:00.000Z', 2),
        },
        now,
      ),
    ).toBe(false);
  });

  it('falls back to startAt when endAt is missing', () => {
    expect(
      isUpcomingOrLiveScheduleCard(
        { startAt: '2026-11-22T19:00:00.000Z', endAt: null },
        now,
      ),
    ).toBe(false);
    expect(
      isUpcomingOrLiveScheduleCard(
        { startAt: '2026-11-22T21:00:00.000Z', endAt: null },
        now,
      ),
    ).toBe(true);
  });
});
