import { afterEach, describe, expect, it, vi } from 'vitest';

import { createClipFromSound } from './sound-clip';

describe('createClipFromSound', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('asks for a clip of the chosen range', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          clipId: 'c1',
          title: 'Night Drive (clip)',
          durationSec: 10,
          renderStatus: 'PROCESSING',
        }),
        { status: 202 },
      ),
    );
    await expect(
      createClipFromSound('s1', { startSec: 5, endSec: 15, title: '  ' }),
    ).resolves.toMatchObject({ ok: true, data: { clipId: 'c1' } });
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('/tahti-api/api/me/sound/s1/editor/create-clip');
    expect(JSON.parse(init!.body as string)).toEqual({
      startSec: 5,
      endSec: 15,
    });
  });

  it('passes on the API error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ error: 'Sound item is not ready for editing' }),
        { status: 409 },
      ),
    );
    await expect(
      createClipFromSound('s1', { startSec: 0, endSec: 10 }),
    ).resolves.toEqual({
      ok: false,
      error: 'Sound item is not ready for editing',
    });
  });
});
