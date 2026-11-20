import { afterEach, describe, expect, it, vi } from 'vitest';

import { updateEvent } from './events';

describe('updateEvent', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('PATCHes the changed fields to the event', async () => {
    const saved = {
      id: 'evt 1',
      title: 'Release show',
      description: '',
      place: 'Kaiku',
      location: 'Helsinki',
      eventUrl: null,
      startAt: '2026-11-01T18:00:00.000Z',
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(saved)));
    vi.stubGlobal('fetch', fetchMock);

    expect(
      await updateEvent('evt 1', {
        startAt: saved.startAt,
        eventUrl: '',
      }),
    ).toMatchObject({ ok: true, data: { ...saved, gallery: [] } });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      '/tahti-api/api/me/events/evt%201',
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'PATCH',
      body: JSON.stringify({ startAt: saved.startAt, eventUrl: '' }),
    });
  });

  it('sends the whole gallery and reads it back', async () => {
    const gallery = [
      { url: 'https://cdn.example/1.jpg', caption: 'Doors' },
      { url: 'https://cdn.example/2.jpg', caption: '' },
    ];
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'e1',
          title: 'Show',
          place: 'Kaiku',
          location: 'Helsinki',
          startAt: '2026-11-01T18:00:00.000Z',
          gallery,
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const result = await updateEvent('e1', { gallery });
    expect(result).toMatchObject({ ok: true, data: { gallery } });
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      body: JSON.stringify({ gallery }),
    });
  });

  it('returns the API error instead of throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Event not found' }), {
          status: 404,
        }),
      ),
    );
    expect(await updateEvent('gone', { title: 'x' })).toEqual({
      ok: false,
      error: 'Event not found',
    });
  });
});
