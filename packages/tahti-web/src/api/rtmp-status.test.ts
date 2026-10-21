import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchRtmpTargetStatuses } from './rtmp-status';

describe('fetchRtmpTargetStatuses', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads each destination's live state", async () => {
    const rows = [
      {
        id: 't1',
        provider: 'youtube',
        label: 'YT',
        enabled: true,
        status: 'connected',
      },
    ];
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(rows), { status: 200 }));
    await expect(fetchRtmpTargetStatuses('night-drive')).resolves.toMatchObject(
      {
        data: rows,
      },
    );
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/channels/night-drive/rtmp-status',
    );
  });

  it('returns nothing when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 403 }),
    );
    await expect(fetchRtmpTargetStatuses('x')).resolves.toMatchObject({
      data: null,
    });
  });
});
