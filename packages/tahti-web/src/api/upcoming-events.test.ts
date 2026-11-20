import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchUpcomingEvents } from './upcoming-events';

describe('fetchUpcomingEvents', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults a missing gallery to an empty list', async () => {
    const row = {
      id: 'e1',
      title: 'Show',
      description: null,
      place: 'Kaiku',
      location: 'Helsinki',
      eventUrl: null,
      startAt: '2026-11-01T18:00:00.000Z',
      artistDisplayName: 'Demo',
      artistUsername: 'demo',
      channelSlug: null,
      avatarUrl: null,
    };
    const gallery = [{ url: 'https://cdn.example/1.jpg', caption: 'Doors' }];
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify([row, { ...row, id: 'e2', gallery }])),
        ),
    );
    const { data } = await fetchUpcomingEvents(2);
    expect(data.map((event) => event.gallery)).toEqual([[], gallery]);
  });
});
