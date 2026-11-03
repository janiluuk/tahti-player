import { describe, expect, it } from 'vitest';

import { humanizePastDate } from './humanizeDate';

const NOW = new Date('2026-09-03T12:00:00.000Z');

describe('humanizePastDate', () => {
  it('uses relative wording for recent times', () => {
    expect(humanizePastDate('2026-09-03T11:59:30.000Z', NOW)).toBe('just now');
    expect(humanizePastDate('2026-09-03T11:59:00.000Z', NOW)).toBe(
      '1 minute ago',
    );
    expect(humanizePastDate('2026-09-03T11:45:00.000Z', NOW)).toBe(
      '15 minutes ago',
    );
    expect(humanizePastDate('2026-09-03T10:00:00.000Z', NOW)).toBe(
      '2 hours ago',
    );
  });

  it('says days ago inside a week and d.m.yyyy after that', () => {
    const threeDaysAgo = new Date(NOW);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    expect(humanizePastDate(threeDaysAgo.toISOString(), NOW)).toBe(
      '3 days ago',
    );

    const lastMonth = new Date(NOW);
    lastMonth.setDate(lastMonth.getDate() - 17);
    expect(humanizePastDate(lastMonth.toISOString(), NOW)).toBe(
      `${lastMonth.getDate()}.${lastMonth.getMonth() + 1}.${lastMonth.getFullYear()}`,
    );
  });
});
