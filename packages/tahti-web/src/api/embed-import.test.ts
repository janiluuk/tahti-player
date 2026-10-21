import { afterEach, describe, expect, it, vi } from 'vitest';

import { importHearthisEmbedAudio } from './embed-import';

describe('importHearthisEmbedAudio', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts the import', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ status: 'importing' }), { status: 202 }),
      );
    await expect(importHearthisEmbedAudio('s1')).resolves.toEqual({ ok: true });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/sound/s1/import-embed',
    );
    expect(fetchSpy.mock.calls[0]![1]!.method).toBe('POST');
  });

  it('passes on why hearthis.at refused', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          error:
            'The artist has not enabled downloads for this track on hearthis.at',
        }),
        { status: 409 },
      ),
    );
    await expect(importHearthisEmbedAudio('s1')).resolves.toEqual({
      ok: false,
      error:
        'The artist has not enabled downloads for this track on hearthis.at',
    });
  });
});
