import type { CalendarEvent } from '../../api/event-calendar';

export type EventsRange = 'upcoming' | 'week' | 'month' | 'next3months';
export type EventsView = 'list' | 'calendar';

export type EventsFilters = {
  range: EventsRange;
  past: boolean;
  city: string;
  venue: string;
  q: string;
  view: EventsView;
};

/** URL form of `EventsFilters` under `/discover?tab=events`; defaults are
 * left out so the plain tab URL stays `?tab=events`. */
export type EventsSearch = {
  range?: Exclude<EventsRange, 'upcoming'>;
  past?: true;
  city?: string;
  venue?: string;
  q?: string;
  view?: 'calendar';
};

export const DEFAULT_EVENTS_FILTERS: EventsFilters = {
  range: 'upcoming',
  past: false,
  city: '',
  venue: '',
  q: '',
  view: 'list',
};

const DAY = 86_400_000;
/** `GET /api/v1/events` rejects windows longer than this. */
export const MAX_WINDOW_DAYS = 92;

function text(value: unknown): string | undefined {
  const raw = typeof value === 'number' ? String(value) : value;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

export function parseEventsSearch(search: Record<string, unknown>) {
  const range = search.range;
  const out: EventsSearch = {};
  if (range === 'week' || range === 'month' || range === 'next3months') {
    out.range = range;
  }
  if (search.past === true || search.past === 'true' || search.past === '1') {
    out.past = true;
  }
  const city = text(search.city);
  const venue = text(search.venue);
  const q = text(search.q);
  if (city) {
    out.city = city;
  }
  if (venue) {
    out.venue = venue;
  }
  if (q) {
    out.q = q;
  }
  if (search.view === 'calendar') {
    out.view = 'calendar';
  }
  return out;
}

export function eventsFiltersFromSearch(search: EventsSearch): EventsFilters {
  return {
    range: search.range ?? 'upcoming',
    past: search.past === true,
    city: search.city ?? '',
    venue: search.venue ?? '',
    q: search.q ?? '',
    view: search.view ?? 'list',
  };
}

export function eventsFiltersToSearch(filters: EventsFilters): EventsSearch {
  return parseEventsSearch({
    range: filters.range,
    past: filters.past || undefined,
    city: filters.city,
    venue: filters.venue,
    q: filters.q,
    view: filters.view,
  });
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Fetch window for the calendar endpoint. Forward ranges start at local
 * midnight today, the past view ends there, so today is never in both. */
export function eventsWindow(
  filters: Pick<EventsFilters, 'range' | 'past'>,
  now: Date = new Date(),
): { from: Date; to: Date } {
  const today = startOfDay(now);
  const max = MAX_WINDOW_DAYS * DAY;
  if (filters.past) {
    return { from: new Date(today.getTime() - max), to: today };
  }
  let to: Date;
  switch (filters.range) {
    case 'week': {
      const daysToMonday = 7 - ((today.getDay() + 6) % 7);
      to = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + daysToMonday,
      );
      break;
    }
    case 'month':
      to = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      break;
    case 'next3months':
      to = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
      break;
    default:
      to = new Date(today.getTime() + max);
  }
  return {
    from: today,
    to: new Date(Math.min(to.getTime(), today.getTime() + max)),
  };
}

/** City of an event: the venue's city, else the first part of the typed
 * location ("Helsinki, Finland" → "Helsinki"). */
export function eventCity(event: CalendarEvent): string {
  return (
    event.venue?.city?.trim() ||
    (event.location ?? '').split(',')[0]?.trim() ||
    ''
  );
}

export function eventVenueName(event: CalendarEvent): string {
  return event.venue?.name?.trim() || (event.place ?? '').trim();
}

function same(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: 'base' }) === 0;
}

function uniqueSorted(values: string[], locale: string, keep: string) {
  const out: string[] = [];
  for (const value of [...values, keep]) {
    if (value && !out.some((existing) => same(existing, value))) {
      out.push(value);
    }
  }
  return out.sort((a, b) => a.localeCompare(b, locale));
}

export function cityOptions(
  events: CalendarEvent[],
  locale: string,
  selected = '',
): string[] {
  return uniqueSorted(events.map(eventCity), locale, selected);
}

/** Venues of the loaded events, only those in `city` when one is chosen. */
export function venueOptions(
  events: CalendarEvent[],
  locale: string,
  city = '',
  selected = '',
): string[] {
  const inCity = city
    ? events.filter((event) => same(eventCity(event), city))
    : events;
  return uniqueSorted(inCity.map(eventVenueName), locale, selected);
}

export function matchesQuery(event: CalendarEvent, q: string): boolean {
  const terms = q.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return true;
  }
  const haystack = [
    event.title,
    event.place,
    event.venue?.name,
    event.artistDisplayName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase();
  return terms.every((term) => haystack.includes(term));
}

export function hasActiveFilters(
  filters: Pick<EventsFilters, 'city' | 'venue' | 'q'>,
) {
  return Boolean(filters.city || filters.venue || filters.q.trim());
}

/** Listable events matching city, venue and text; soonest first, or
 * newest first in the past view. */
export function filterEvents(
  events: CalendarEvent[],
  filters: Pick<EventsFilters, 'city' | 'venue' | 'q' | 'past'>,
): CalendarEvent[] {
  return events
    .filter(
      (event) =>
        event.status === 'PUBLISHED' &&
        event.visibility === 'PUBLIC' &&
        (!filters.city || same(eventCity(event), filters.city)) &&
        (!filters.venue || same(eventVenueName(event), filters.venue)) &&
        matchesQuery(event, filters.q),
    )
    .sort((a, b) =>
      filters.past
        ? b.startAt.localeCompare(a.startAt)
        : a.startAt.localeCompare(b.startAt),
    );
}
