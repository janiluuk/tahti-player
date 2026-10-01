import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderAnnouncementTrim } from './announcements';

const TRIM = { startSec: 1, endSec: 9.5, fadeInSec: 0.5, fadeOutSec: 1 };

describe('renderAnnouncementTrim', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('queues the trim render', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true, renderStatus: 'PROCESSING' }), {
        status: 200,
      }),
    );
    await expect(renderAnnouncementTrim('a1', TRIM)).resolves.toEqual({
      ok: true,
      renderStatus: 'PROCESSING',
    });
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('/tahti-api/api/me/announcements/a1/editor/render');
    expect(JSON.parse(init!.body as string)).toEqual(TRIM);
  });

  it('passes on the API error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'End must be after start' }), {
        status: 400,
      }),
    );
    await expect(renderAnnouncementTrim('a1', TRIM)).resolves.toEqual({
      ok: false,
      error: 'End must be after start',
    });
  });
});
