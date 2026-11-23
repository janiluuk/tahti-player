/** `/studio/schedule?tab=` is shared: Broadcasts uses `programme`, the
 * Events filter (`?show=events`) uses its own tabs. Old `/studio/events?tab=`
 * links carry the event tab values. */
export const SCHEDULE_EVENT_TABS = ['upcoming', 'past', 'invites'] as const;

export type ScheduleEventTab = (typeof SCHEDULE_EVENT_TABS)[number];

export type ScheduleSearchTab = 'programme' | ScheduleEventTab;

export const isScheduleEventTab = (value: unknown): value is ScheduleEventTab =>
  (SCHEDULE_EVENT_TABS as readonly unknown[]).includes(value);

export const isScheduleSearchTab = (
  value: unknown,
): value is ScheduleSearchTab =>
  value === 'programme' || isScheduleEventTab(value);
