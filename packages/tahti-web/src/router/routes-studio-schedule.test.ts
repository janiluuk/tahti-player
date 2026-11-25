import { describe, expect, it } from 'vitest';

import { studioEventsRoute, studioScheduleRoute } from './routes-studio';

type Validate = (search: Record<string, unknown>) => unknown;

const validateSchedule = studioScheduleRoute.options
  .validateSearch as unknown as Validate;
const validateEvents = studioEventsRoute.options
  .validateSearch as unknown as Validate;

describe('studioScheduleRoute search', () => {
  it.each(['upcoming', 'past', 'invites'])('keeps the Events tab %s', (tab) => {
    expect(validateSchedule({ show: 'events', tab })).toEqual({
      show: 'events',
      tab,
    });
  });

  it('keeps the legacy programme value for the redirect and drops unknown tabs', () => {
    expect(validateSchedule({ tab: 'programme' })).toEqual({
      tab: 'programme',
    });
    expect(validateSchedule({ tab: 'bogus' })).toEqual({});
  });

  it('carries an old /studio/events?tab= value to Schedule', () => {
    expect(validateEvents({ tab: 'invites' })).toEqual({ tab: 'invites' });
    expect(validateEvents({ tab: 'programme' })).toEqual({});
    let target: unknown;
    try {
      (
        studioEventsRoute.options.beforeLoad as unknown as (ctx: {
          search: { tab?: string };
        }) => void
      )({ search: { tab: 'past' } });
    } catch (thrown) {
      target = (thrown as { options: unknown }).options;
    }
    expect(target).toMatchObject({
      to: '/studio/schedule',
      search: { show: 'events', tab: 'past' },
    });
  });
});
