import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchAutoPublishBroadcast,
  setAutoPublishBroadcast,
} from './publish-defaults';

describe('publish defaults', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads and saves the auto-publish default', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ autoPublishBroadcast: true }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ autoPublishBroadcast: false }), {
          status: 200,
        }),
      );
    await expect(fetchAutoPublishBroadcast()).resolves.toEqual({
      ok: true,
      autoPublish: true,
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/channel/publish-defaults',
    );
    await expect(setAutoPublishBroadcast(false)).resolves.toEqual({
      ok: true,
      autoPublish: false,
    });
    const init = fetchSpy.mock.calls[1]![1]!;
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual({
      autoPublishBroadcast: false,
    });
  });

  it('passes on the API error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Channel not found' }), {
        status: 404,
      }),
    );
    await expect(fetchAutoPublishBroadcast()).resolves.toEqual({
      ok: false,
      error: 'Channel not found',
    });
  });
});
