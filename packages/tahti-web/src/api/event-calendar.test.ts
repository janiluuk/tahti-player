import { describe, expect, it } from 'vitest';

import { parseDiscoverSearch } from '../lib/discoverTabs';
import { googleCalendarUrl } from './event-calendar';
import { normalizeEvent } from './events';

describe('event calendar helpers', () => {
  it('fills the fields an older API leaves out', () => {
    const event = normalizeEvent({
      id: 'e1',
      title: 'Show',
      place: 'Kaiku',
      location: 'Helsinki',
      startAt: '2026-12-01T18:00:00.000Z',
    });
    expect(event.status).toBe('PUBLISHED');
    expect(event.participants).toEqual([]);
    expect(event.endAt).toBeNull();
  });

  it('builds a Google Calendar link with a two-hour default end', () => {
    const url = new URL(
      googleCalendarUrl({
        title: 'Show',
        startAt: '2026-12-01T18:00:00.000Z',
        endAt: null,
        place: 'Kaiku',
        location: 'Helsinki',
        description: '',
      }),
    );
    expect(url.searchParams.get('dates')).toBe(
      '20261201T180000Z/20261201T200000Z',
    );
    expect(url.searchParams.get('location')).toBe('Kaiku, Helsinki');
  });

  it('keeps the calendar view only under the Feed tab', () => {
    expect(parseDiscoverSearch({ tab: 'feed', view: 'calendar' })).toEqual({
      tab: 'feed',
      view: 'calendar',
    });
    expect(parseDiscoverSearch({ tab: 'artists', view: 'calendar' })).toEqual({
      tab: 'artists',
    });
  });
});
