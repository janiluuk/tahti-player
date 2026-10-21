import { afterEach, describe, expect, it, vi } from 'vitest';

import { publishSoundToRelease } from './publish-to-release';

describe('publishSoundToRelease', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds the sound, or a version of it, to the release', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({ ok: true, trackId: 't9', status: 'SCANNING' }),
          { status: 201 },
        ),
      );
    await expect(
      publishSoundToRelease('s1', {
        releaseId: 'r1',
        versionId: 'v2',
        title: ' ',
      }),
    ).resolves.toEqual({
      ok: true,
      data: { trackId: 't9', status: 'SCANNING' },
    });
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('/tahti-api/api/me/sound/s1/editor/publish-to-release');
    expect(JSON.parse(init!.body as string)).toEqual({
      releaseId: 'r1',
      versionId: 'v2',
    });
  });

  it('passes on the API error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Version is not ready yet' }), {
        status: 400,
      }),
    );
    await expect(
      publishSoundToRelease('s1', { releaseId: 'r1', versionId: 'v2' }),
    ).resolves.toEqual({ ok: false, error: 'Version is not ready yet' });
  });
});
