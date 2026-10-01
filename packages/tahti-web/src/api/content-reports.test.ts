import { afterEach, describe, expect, it, vi } from 'vitest';

import { submitContentReport } from './content-reports';

describe('submitContentReport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the report, leaving out empty details', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true, reportId: '1' }), {
        status: 201,
      }),
    );
    await expect(
      submitContentReport({
        targetType: 'CHANNEL',
        targetId: 'night-drive',
        reason: 'SPAM',
        details: '  ',
      }),
    ).resolves.toEqual({ ok: true });
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('/tahti-api/api/v1/reports');
    expect(JSON.parse(init!.body as string)).toEqual({
      targetType: 'CHANNEL',
      targetId: 'night-drive',
      reason: 'SPAM',
    });
  });

  it('passes on the API error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
      }),
    );
    await expect(
      submitContentReport({
        targetType: 'SOUND_ITEM',
        targetId: 's1',
        reason: 'OTHER',
      }),
    ).resolves.toEqual({ ok: false, error: 'Invalid request body' });
  });
});
