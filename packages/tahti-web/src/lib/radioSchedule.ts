import type { StudioShowBooking } from '../api/shows';
import { dateLocaleTag } from './locale';

/** Days shown per page of the weekly schedule grid (prod's tahti-radio-slots
 * calendar shows the same span, one week at a time). */
const SCHEDULE_DAYS_VISIBLE = 7;

/** Full 24-hour row set for the grid — bookings are always hour-aligned. */
export const SCHEDULE_HOURS: readonly number[] = Array.from(
  { length: 24 },
  (_, i) => i,
);

/** Which schedule the grid currently displays: the shared Tahti Radio
 * calendar (every booked artist), or just the signed-in artist's own slots
 * on it. There is no separate "own station" grid in the data model — booking
 * always reserves a Tahti Radio hour — so "mine" is a filtered view of the
 * same underlying bookings, not a different data source. */
export type StationFilter = 'radio' | 'mine';

export function startOfLocalDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function atHour(day: Date, hour: number): Date {
  const copy = new Date(day);
  copy.setHours(hour, 0, 0, 0);
  return copy;
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

/** The `count` local days starting at `weekStart` (inclusive). */
export function weekDays(
  weekStart: Date,
  count: number = SCHEDULE_DAYS_VISIBLE,
): Date[] {
  return Array.from({ length: count }, (_, i) => addDays(weekStart, i));
}

/** ISO `from`/`to` bounds covering the visible week — the exact window
 * `fetchShowBookings` should be called with. */
export function weekRangeIso(
  weekStart: Date,
  count: number = SCHEDULE_DAYS_VISIBLE,
): { from: string; to: string } {
  return {
    from: weekStart.toISOString(),
    to: addDays(weekStart, count).toISOString(),
  };
}

export function weekLabel(days: Date[]): string {
  const first = days[0];
  const last = days[days.length - 1];
  if (!first || !last) {
    return '';
  }
  const fmt = (d: Date) =>
    d.toLocaleDateString(dateLocaleTag(), { month: 'short', day: 'numeric' });
  return `${fmt(first)} – ${fmt(last)}`;
}

/** Narrows the shared booking list to what the current station picker
 * selection should show. "radio" (or no own channel to narrow to) shows
 * every booking; "mine" narrows to the signed-in artist's own channel. */
export function filterBookingsForStation(
  bookings: StudioShowBooking[],
  station: StationFilter,
  ownChannelSlug: string | null,
): StudioShowBooking[] {
  if (station === 'radio' || !ownChannelSlug) {
    return bookings;
  }
  return bookings.filter(
    (booking) => booking.isMine || booking.channelSlug === ownChannelSlug,
  );
}

function bookingGridKey(day: Date, hour: number): string {
  return `${day.toDateString()}-${hour}`;
}

/** Precomputes a day×hour lookup once per bookings/days change instead of
 * rescanning every booking for every grid cell on each render. */
export function buildBookingGrid(
  days: Date[],
  bookings: StudioShowBooking[],
  hours: readonly number[] = SCHEDULE_HOURS,
): Map<string, StudioShowBooking> {
  const map = new Map<string, StudioShowBooking>();
  for (const day of days) {
    for (const hour of hours) {
      const cellStart = atHour(day, hour).getTime();
      const found = bookings.find((b) => {
        const s = new Date(b.startAt).getTime();
        const e = new Date(b.endAt).getTime();
        return cellStart >= s && cellStart < e;
      });
      if (found) {
        map.set(bookingGridKey(day, hour), found);
      }
    }
  }
  return map;
}

export type ScheduleSelection = {
  day: Date;
  startHour: number;
  hours: 1 | 2;
};

/** Pure reducer for a click on an open grid cell — mirrors prod's
 * `RadioSlotCalendar` onCellClick semantics: clicking a fresh cell starts a
 * 1h selection; clicking the hour immediately after the current selection
 * extends it (up to `maxHours`); clicking the selection's own start hour
 * again clears it; anything else replaces the selection. Booked cells are
 * handled by the caller before this (existing bookings never reach here). */
export function nextSelectionOnCellClick(
  current: ScheduleSelection | null,
  day: Date,
  hour: number,
  maxHours: number,
): ScheduleSelection | null {
  if (
    current &&
    isSameLocalDay(current.day, day) &&
    hour === current.startHour + current.hours &&
    current.hours < maxHours
  ) {
    return { ...current, hours: (current.hours + 1) as 1 | 2 };
  }
  if (
    current &&
    isSameLocalDay(current.day, day) &&
    hour === current.startHour
  ) {
    return null;
  }
  return { day, startHour: hour, hours: 1 };
}

/** Minutes before a booking's start, and after its end, that the artist's
 * green room should be surfaced to a viewer as "open for this show" — long
 * enough to catch early arrivals and an after-set wind-down chat, short
 * enough that it doesn't linger as relevant hours away from the actual slot. */
export const GREEN_ROOM_WINDOW_BEFORE_MINUTES = 30;
export const GREEN_ROOM_WINDOW_AFTER_MINUTES = 15;

/** Whether a booking's green room should be surfaced right now — i.e. the
 * booking is imminent, live, or just wrapped up (see the window constants
 * above). Pure function of `now` so it's trivially testable without mocking
 * the clock globally. */
export function isGreenRoomWindow(
  booking: Pick<StudioShowBooking, 'startAt' | 'endAt'>,
  now: number = Date.now(),
): boolean {
  const opensAt =
    new Date(booking.startAt).getTime() -
    GREEN_ROOM_WINDOW_BEFORE_MINUTES * 60_000;
  const closesAt =
    new Date(booking.endAt).getTime() +
    GREEN_ROOM_WINDOW_AFTER_MINUTES * 60_000;
  return now >= opensAt && now <= closesAt;
}

export function selectionRange(selection: ScheduleSelection): {
  startAt: string;
  endAt: string;
} {
  return {
    startAt: atHour(selection.day, selection.startHour).toISOString(),
    endAt: atHour(
      selection.day,
      selection.startHour + selection.hours,
    ).toISOString(),
  };
}
