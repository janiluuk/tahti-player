import { describe, expect, it } from 'vitest';

import { buildBroadcastAgenda } from './broadcastAgenda';

const NOW = Date.parse('2026-11-02T12:00:00Z');

const show = (id: string, startAt: string) => ({
  id,
  seriesId: `series-${id}`,
  startAt,
  episodeNumber: 1,
  title: `Show ${id}`,
  description: null,
  tagline: null,
  venue: 'Kaiku',
  location: null,
  artworkUrl: null,
  showType: 'LIVE' as never,
  visibility: 'PUBLIC' as const,
  autoPublish: false,
});

describe('buildBroadcastAgenda', () => {
  it('merges upcoming shows, events and parties soonest first, live party on top', () => {
    const agenda = buildBroadcastAgenda(
      {
        shows: [
          show('past', '2026-11-01T12:00:00Z'),
          show('a', '2026-11-05T20:00:00Z'),
        ],
        events: [
          {
            id: 'e1',
            title: 'Release show',
            description: '',
            place: 'Ääniwalli',
            location: 'Helsinki',
            eventUrl: null,
            startAt: '2026-11-03T18:00:00Z',
          },
        ],
        parties: [
          {
            id: 'p1',
            state: 'LIVE',
            startAt: '2026-11-02T11:00:00Z',
            endAt: '2026-11-02T13:00:00Z',
            release: { id: 'r1', title: 'Night EP', artworkUrl: null },
            channel: { slug: 'demo', name: 'Demo' },
          },
          {
            id: 'p2',
            state: 'ENDED',
            startAt: '2026-11-04T11:00:00Z',
            endAt: '2026-11-04T13:00:00Z',
            release: { id: 'r2', title: 'Gone', artworkUrl: null },
            channel: { slug: 'demo', name: 'Demo' },
          },
        ],
      },
      NOW,
    );
    expect(agenda.map((item) => item.id)).toEqual([
      'party:p1',
      'event:e1',
      'show:a',
    ]);
    expect(agenda[0].live).toBe(true);
    expect(agenda[1].place).toBe('Ääniwalli, Helsinki');
    expect(agenda[2].params).toEqual({ id: 'series-a' });
    expect(agenda[0]).toMatchObject({ to: '/party/$id', params: { id: 'p1' } });
    expect(agenda[1]).toMatchObject({
      to: '/studio/events/$eventId',
      params: { eventId: 'e1' },
    });
  });

  it('is empty when nothing is coming up', () => {
    expect(buildBroadcastAgenda({}, NOW)).toEqual([]);
  });
});
