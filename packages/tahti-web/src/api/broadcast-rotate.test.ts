import { afterEach, describe, expect, it, vi } from 'vitest';

import { rotateIcecastPassword, rotateRtmpStreamKey } from './broadcast';

describe('ingest credential rotation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts to the rotate routes and returns the new secrets', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ rtmpStreamKey: 'slug__new' }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ liveSourcePass: 'new-pass' }), {
          status: 200,
        }),
      );
    await expect(rotateRtmpStreamKey()).resolves.toEqual({
      ok: true,
      streamKey: 'slug__new',
    });
    await expect(rotateIcecastPassword()).resolves.toEqual({
      ok: true,
      password: 'new-pass',
    });
    expect(
      fetchSpy.mock.calls.map(([url, init]) => [url, init?.method]),
    ).toEqual([
      ['/tahti-api/api/me/stream-settings/rtmp/rotate', 'POST'],
      ['/tahti-api/api/me/stream-settings/icecast/rotate', 'POST'],
    ]);
  });

  it('passes the API error through', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Channel not found' }), {
        status: 404,
      }),
    );
    await expect(rotateRtmpStreamKey()).resolves.toEqual({
      ok: false,
      error: 'Channel not found',
    });
  });
});
