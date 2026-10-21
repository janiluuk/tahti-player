import { afterEach, describe, expect, it, vi } from 'vitest';

import { exportSoundToHearthis } from './hearthis-export';

describe('exportSoundToHearthis', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('queues the export', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({ soundId: 's1', hearthisExportStatus: 'pending' }),
          { status: 202 },
        ),
      );
    await expect(exportSoundToHearthis('s1')).resolves.toEqual({
      ok: true,
      status: 'pending',
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/sound/s1/export/hearthis',
    );
    expect(fetchSpy.mock.calls[0]![1]!.method).toBe('POST');
  });

  it('passes on the API error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          error: 'Install the hearthis.at export plugin first',
        }),
        { status: 400 },
      ),
    );
    await expect(exportSoundToHearthis('s1')).resolves.toEqual({
      ok: false,
      error: 'Install the hearthis.at export plugin first',
    });
  });
});
