import { afterEach, describe, expect, it, vi } from 'vitest';

import { downloadReleaseTrack } from './release-download';

vi.mock('../lib/listenerFingerprint', () => ({
  listenerFingerprint: () => 'fp_test',
}));

function respond(status: number, body: unknown) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('downloadReleaseTrack', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('passes the listener fingerprint so a recorded share counts', async () => {
    const fetchMock = respond(200, { url: 'https://minio.test/a.opus' });
    await expect(downloadReleaseTrack('nights', 't1')).resolves.toEqual({
      ok: true,
      url: 'https://minio.test/a.opus',
    });
    expect(String(fetchMock.mock.calls[0]![0])).toContain(
      '/api/v1/releases/nights/tracks/t1/download?fp=fp_test',
    );
  });

  it('returns the sound to unlock when a follow or share gate refuses it', async () => {
    respond(403, {
      error: 'Follow this artist to download',
      gates: ['follow'],
      soundId: 'sound-9',
    });
    await expect(downloadReleaseTrack('nights', 't1')).resolves.toEqual({
      ok: false,
      error: 'Follow this artist to download',
      unlockSoundId: 'sound-9',
    });
  });

  it('passes other refusals through without an unlock target', async () => {
    respond(403, {
      error: 'Subscribe to this artist to download',
      gate: 'SUBSCRIBERS_ONLY',
    });
    await expect(downloadReleaseTrack('nights', 't1')).resolves.toEqual({
      ok: false,
      error: 'Subscribe to this artist to download',
    });
  });
});
