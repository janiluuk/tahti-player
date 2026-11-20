import { describe, expect, it } from 'vitest';

import { parseDiscoverSearch } from '../lib/discoverTabs';
import { googleCalendarUrl } from './event-calendar';
import { normalizeEvent, normalizeEventGallery } from './events';

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
    expect(event.gallery).toEqual([]);
  });

  it('keeps gallery images with a url and defaults a missing caption', () => {
    expect(
      normalizeEventGallery([
        { url: 'https://cdn.example/1.jpg', caption: 'Doors' },
        { url: 'https://cdn.example/2.jpg' },
        { caption: 'no url' },
        null,
        'https://cdn.example/3.jpg',
      ]),
    ).toEqual([
      { url: 'https://cdn.example/1.jpg', caption: 'Doors' },
      { url: 'https://cdn.example/2.jpg', caption: '' },
    ]);
    expect(normalizeEventGallery(undefined)).toEqual([]);
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
