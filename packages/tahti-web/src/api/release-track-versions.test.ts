import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  activateReleaseTrackVersion,
  fetchReleaseTrackVersions,
  uploadReleaseTrackVersion,
} from './release-track-versions';

const V1 = {
  id: 'v1',
  versionNumber: 1,
  versionLabel: 'Original',
  status: 'READY',
  isActive: true,
  durationSec: 200,
  createdAt: '2026-09-01T12:00:00.000Z',
};

describe('release track versions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists a track's versions", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify([V1]), { status: 200 }));
    await expect(fetchReleaseTrackVersions('r1', 't1')).resolves.toMatchObject({
      data: [V1],
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/releases/r1/tracks/t1/versions',
    );
  });

  it('switches the active version and passes on the API error', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify([V1]), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Version is not ready yet' }), {
          status: 400,
        }),
      );
    await expect(
      activateReleaseTrackVersion('r1', 't1', 'v1'),
    ).resolves.toEqual({ ok: true, data: [V1] });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/releases/r1/tracks/t1/versions/v1/activate',
    );
    expect(fetchSpy.mock.calls[0]![1]!.method).toBe('POST');
    await expect(
      activateReleaseTrackVersion('r1', 't1', 'v2'),
    ).resolves.toEqual({ ok: false, error: 'Version is not ready yet' });
  });
});

describe('uploadReleaseTrackVersion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prepares, uploads and completes a new version', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            uploadId: 'up-1',
            uploadUrl: 'https://s3.example/put',
            expiresAt: '2026-09-30T13:00:00.000Z',
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            versionId: 'v2',
            versionNumber: 2,
            versionLabel: 'Remaster',
            status: 'PENDING',
          }),
          { status: 201 },
        ),
      );
    const file = new File(['x'], 'master.wav', { type: 'audio/wav' });
    const result = await uploadReleaseTrackVersion(
      'r1',
      't1',
      file,
      ' Remaster ',
    );
    expect(result).toMatchObject({
      ok: true,
      data: { id: 'v2', versionNumber: 2, status: 'PENDING', isActive: false },
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/releases/r1/tracks/t1/versions/prepare',
    );
    expect(fetchSpy.mock.calls[1]![0]).toBe('https://s3.example/put');
    expect(fetchSpy.mock.calls[1]![1]!.method).toBe('PUT');
    expect(JSON.parse(fetchSpy.mock.calls[2]![1]!.body as string)).toEqual({
      uploadId: 'up-1',
      versionLabel: 'Remaster',
    });
  });

  it('refuses formats the API does not take', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const file = new File(['x'], 'demo.ogg', { type: 'audio/ogg' });
    await expect(
      uploadReleaseTrackVersion('r1', 't1', file, ''),
    ).resolves.toEqual({ ok: false, error: 'Use WAV, FLAC, MP3, AAC or AIFF' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
