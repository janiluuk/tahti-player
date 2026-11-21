import { describe, expect, it } from 'vitest';

import type { CalendarEvent } from '../../api/event-calendar';
import { normalizeEvent } from '../../api/events';
import {
  cityOptions,
  DEFAULT_EVENTS_FILTERS,
  eventCity,
  eventsFiltersFromSearch,
  eventsFiltersToSearch,
  eventsWindow,
  eventVenueName,
  filterEvents,
  hasActiveFilters,
  matchesQuery,
  parseEventsSearch,
  venueOptions,
} from './eventFilters';

function event(id: string, patch: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    ...normalizeEvent({
      id,
      title: `Event ${id}`,
      place: '',
      location: '',
      startAt: '2030-06-01T18:00:00.000Z',
    }),
    artistDisplayName: 'Host',
    artistUsername: 'host',
    channelSlug: null,
    avatarUrl: null,
    ...patch,
  };
}

const kaiku = event('a', {
  title: 'Rooftop closing set',
  venue: { id: 'v1', slug: 'kaiku', name: 'Kaiku', city: 'Helsinki' },
  startAt: '2030-06-03T18:00:00.000Z',
  artistDisplayName: 'Northern Lights',
});
const garage = event('b', {
  title: 'Garage jam',
  place: 'Garage',
  location: 'Tampere, Finland',
  startAt: '2030-06-01T18:00:00.000Z',
});
const tavastia = event('c', {
  title: 'Club night',
  place: 'Tavastia',
  location: 'helsinki',
  startAt: '2030-06-02T18:00:00.000Z',
});
const oulu = event('d', { place: 'Ääniwalli', location: 'Älvsjö' });

describe('eventsWindow', () => {
  const now = new Date(2030, 5, 12, 15, 30);
  const today = new Date(2030, 5, 12).getTime();
  const DAY = 86_400_000;

  it('starts forward ranges at local midnight today', () => {
    const { from, to } = eventsWindow({ range: 'upcoming', past: false }, now);
    expect(from.getTime()).toBe(today);
    expect(to.getTime()).toBe(today + 92 * DAY);
  });

  it('ends this week at the coming Monday', () => {
    const { to } = eventsWindow({ range: 'week', past: false }, now);
    expect(to).toEqual(new Date(2030, 5, 17));
  });

  it('ends this month at the first of next month', () => {
    const { to } = eventsWindow({ range: 'month', past: false }, now);
    expect(to).toEqual(new Date(2030, 6, 1));
  });

  it('runs next 3 months to the same day three months on, at most 92 days', () => {
    const start = new Date(2030, 6, 1);
    const { to } = eventsWindow({ range: 'next3months', past: false }, start);
    expect(to).toEqual(new Date(2030, 9, 1));
    expect(to.getTime() - start.getTime()).toBeLessThanOrEqual(92 * DAY);
    const short = eventsWindow(
      { range: 'next3months', past: false },
      new Date(2030, 1, 1),
    );
    expect(short.to).toEqual(new Date(2030, 4, 1));
  });

  it('covers the last 92 days up to today for the past view', () => {
    const { from, to } = eventsWindow({ range: 'week', past: true }, now);
    expect(to.getTime()).toBe(today);
    expect(from.getTime()).toBe(today - 92 * DAY);
  });
});

describe('city and venue', () => {
  it('reads the venue city, else the first part of the location', () => {
    expect(eventCity(kaiku)).toBe('Helsinki');
    expect(eventCity(garage)).toBe('Tampere');
    expect(eventVenueName(kaiku)).toBe('Kaiku');
    expect(eventVenueName(garage)).toBe('Garage');
  });

  it('dedups cities case-insensitively and sorts them for the locale', () => {
    expect(cityOptions([tavastia, garage, kaiku, oulu], 'fi-FI')).toEqual([
      'helsinki',
      'Tampere',
      'Älvsjö',
    ]);
    expect(cityOptions([garage], 'en', 'Turku')).toEqual(['Tampere', 'Turku']);
  });

  it('narrows venues to the chosen city', () => {
    const events = [kaiku, garage, tavastia];
    expect(venueOptions(events, 'en')).toEqual(['Garage', 'Kaiku', 'Tavastia']);
    expect(venueOptions(events, 'en', 'Helsinki')).toEqual([
      'Kaiku',
      'Tavastia',
    ]);
  });
});

describe('matchesQuery', () => {
  it('matches every term against title, place, venue and host', () => {
    expect(matchesQuery(kaiku, 'rooftop')).toBe(true);
    expect(matchesQuery(kaiku, 'kaiku northern')).toBe(true);
    expect(matchesQuery(garage, 'GARAGE')).toBe(true);
    expect(matchesQuery(kaiku, 'garage')).toBe(false);
    expect(matchesQuery(kaiku, '  ')).toBe(true);
  });
});

describe('filterEvents', () => {
  const events = [kaiku, garage, tavastia];

  it('sorts soonest first, or newest first in the past view', () => {
    const ids = (past: boolean) =>
      filterEvents(events, { ...DEFAULT_EVENTS_FILTERS, past }).map(
        (row) => row.id,
      );
    expect(ids(false)).toEqual(['b', 'c', 'a']);
    expect(ids(true)).toEqual(['a', 'c', 'b']);
  });

  it('applies city, venue and text together', () => {
    const run = (patch: Partial<typeof DEFAULT_EVENTS_FILTERS>) =>
      filterEvents(events, { ...DEFAULT_EVENTS_FILTERS, ...patch }).map(
        (row) => row.id,
      );
    expect(run({ city: 'helsinki' })).toEqual(['c', 'a']);
    expect(run({ city: 'Helsinki', venue: 'Kaiku' })).toEqual(['a']);
    expect(run({ q: 'club' })).toEqual(['c']);
    expect(run({ city: 'Tampere', q: 'club' })).toEqual([]);
  });

  it('leaves out drafts, cancelled and fans-only events', () => {
    const rows = [
      kaiku,
      event('x', { status: 'DRAFT' }),
      event('y', { status: 'CANCELLED' }),
      event('z', { visibility: 'FANS' }),
    ];
    expect(
      filterEvents(rows, DEFAULT_EVENTS_FILTERS).map((row) => row.id),
    ).toEqual(['a']);
  });

  it('knows when a filter is active', () => {
    expect(hasActiveFilters(DEFAULT_EVENTS_FILTERS)).toBe(false);
    expect(hasActiveFilters({ city: '', venue: 'Kaiku', q: '' })).toBe(true);
  });
});

describe('URL search', () => {
  it('parses valid params and drops the rest', () => {
    expect(
      parseEventsSearch({
        range: 'month',
        past: true,
        city: ' Helsinki ',
        venue: '',
        q: 'jam',
        view: 'calendar',
        extra: 'x',
      }),
    ).toEqual({
      range: 'month',
      past: true,
      city: 'Helsinki',
      q: 'jam',
      view: 'calendar',
    });
    expect(
      parseEventsSearch({ range: 'year', past: 'no', view: 'grid', q: 2030 }),
    ).toEqual({ q: '2030' });
  });

  it('round-trips filters and leaves defaults out of the URL', () => {
    expect(eventsFiltersToSearch(DEFAULT_EVENTS_FILTERS)).toEqual({});
    const filters = {
      range: 'week' as const,
      past: true,
      city: 'Helsinki',
      venue: 'Kaiku',
      q: 'set',
      view: 'calendar' as const,
    };
    expect(eventsFiltersFromSearch(eventsFiltersToSearch(filters))).toEqual(
      filters,
    );
  });
});
