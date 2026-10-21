import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  addMyRadioStation,
  fetchMyRadioStations,
  removeMyRadioStation,
} from './my-radio-stations';

describe('my radio stations', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists my stations', async () => {
    const station = { id: 'r1', name: 'Radio', streamUrl: 'https://a/b' };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ stations: [station] }), { status: 200 }),
      );
    await expect(fetchMyRadioStations()).resolves.toMatchObject({
      data: [station],
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe('/tahti-api/api/me/internet-radio');
  });

  it('returns no list when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 401 }),
    );
    await expect(fetchMyRadioStations()).resolves.toMatchObject({
      data: null,
    });
  });

  it('adds and removes a station', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'r2', name: 'New' }), {
          status: 201,
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(
      addMyRadioStation({ name: 'New', streamUrl: 'https://a/b' }),
    ).resolves.toMatchObject({ ok: true, data: { id: 'r2' } });
    expect(JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string)).toEqual({
      name: 'New',
      streamUrl: 'https://a/b',
    });
    await expect(removeMyRadioStation('r2')).resolves.toEqual({ ok: true });
    expect(fetchSpy.mock.calls[1]![0]).toBe(
      '/tahti-api/api/me/internet-radio/r2',
    );
    expect(fetchSpy.mock.calls[1]![1]!.method).toBe('DELETE');
  });
});
