import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchPublicSoundDownload } from './client';

describe('fetchPublicSoundDownload', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockDownload() {
    return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          url: 'https://cdn.test/a.flac',
          filename: 'a.flac',
        }),
        { status: 200 },
      ),
    );
  }

  it('sends the share key so a download link works on a private track', async () => {
    const fetchSpy = mockDownload();
    await expect(
      fetchPublicSoundDownload('night-drive', 'snd1', 'tok en'),
    ).resolves.toEqual({
      ok: true,
      url: 'https://cdn.test/a.flac',
      filename: 'a.flac',
    });
    const url = String(fetchSpy.mock.calls[0]![0]);
    expect(url).toContain('/api/v1/c/night-drive/archive/snd1/download?');
    expect(url).toContain('&key=tok%20en');
  });

  it('leaves the key off without a share link', async () => {
    const fetchSpy = mockDownload();
    await fetchPublicSoundDownload('night-drive', 'snd1');
    expect(String(fetchSpy.mock.calls[0]![0])).not.toContain('key=');
  });
});
