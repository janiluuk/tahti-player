import { afterEach, describe, expect, it, vi } from 'vitest';

import { exportTrack } from './export-status';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('exportTrack', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalises the queued status', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(json({ mixUploadId: 'm1', status: 'pending' }, 202)),
    );
    expect(await exportTrack('s1', 'mixcloud')).toEqual({
      ok: true,
      status: { status: 'PENDING', url: null, error: null },
    });
  });

  it('returns the connect URL when Mixcloud is configured but not connected', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          json({ error: 'Connect your Mixcloud account first' }, 403),
        )
        .mockResolvedValueOnce(json({ error: 'No Mixcloud upload found' }, 404))
        .mockResolvedValueOnce(json({ connected: false, configured: true })),
    );
    expect(await exportTrack('s1', 'mixcloud')).toEqual({
      ok: false,
      error: 'Connect your Mixcloud account first',
      connectUrl: '/tahti-api/api/me/mixcloud/oauth/start',
    });
  });

  it('returns only the error for other failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          json({ error: 'Sound item is not ready for upload' }, 409),
        )
        .mockResolvedValueOnce(json({ error: 'No Mixcloud upload found' }, 404))
        .mockResolvedValueOnce(json({ connected: true, configured: true })),
    );
    expect(await exportTrack('s1', 'mixcloud')).toEqual({
      ok: false,
      error: 'Sound item is not ready for upload',
    });
  });
});
