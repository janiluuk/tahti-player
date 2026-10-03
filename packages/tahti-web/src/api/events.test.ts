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
    ).toEqual({ ok: true, data: saved });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      '/tahti-api/api/me/events/evt%201',
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'PATCH',
      body: JSON.stringify({ startAt: saved.startAt, eventUrl: '' }),
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
