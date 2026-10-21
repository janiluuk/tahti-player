import { afterEach, describe, expect, it, vi } from 'vitest';

import * as xhr from '../../lib/putWithProgress';
import {
  isReleaseTrackProcessing,
  uploadReleaseTrackAudio,
} from './release-track-upload';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

const audio = (type = 'audio/wav') =>
  new File(['RIFF'], 'night-drive.wav', { type });

describe('uploadReleaseTrackAudio', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('presigns, uploads with progress, then finalizes', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        json({
          uploadUrl: 'https://s3.example/put',
          sourceKey: 'releases/me/r1/t1-abc.wav',
          expiresAt: '2026-10-03T12:00:00.000Z',
        }),
      )
      .mockResolvedValueOnce(json({ trackId: 't1', status: 'scanning' }));
    const put = vi
      .spyOn(xhr, 'putWithProgress')
      .mockImplementation(async (_url, _file, options) => {
        options.onProgress?.(0.5);
        options.onProgress?.(1);
      });
    const onProgress = vi.fn();

    const result = await uploadReleaseTrackAudio('r1', 't1', audio(), {
      onProgress,
    });

    expect(result).toEqual({
      ok: true,
      sourceKey: 'releases/me/r1/t1-abc.wav',
      status: 'SCANNING',
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/releases/r1/tracks/t1/upload',
    );
    expect(JSON.parse(String(fetchSpy.mock.calls[0]![1]!.body))).toEqual({
      filename: 'night-drive.wav',
      contentType: 'audio/wav',
    });
    expect(put.mock.calls[0]![0]).toBe('https://s3.example/put');
    expect(put.mock.calls[0]![2].contentType).toBe('audio/wav');
    expect(onProgress).toHaveBeenCalledWith(0.5);
    expect(fetchSpy.mock.calls[1]![0]).toBe(
      '/tahti-api/api/me/releases/r1/tracks/t1/finalize',
    );
    expect(fetchSpy.mock.calls[1]![1]!.method).toBe('POST');
  });

  it('rejects unsupported formats before calling the API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await expect(
      uploadReleaseTrackAudio('r1', 't1', audio('video/mp4')),
    ).resolves.toEqual({
      ok: false,
      cancelled: false,
      error: 'Use WAV, FLAC, MP3, AAC or AIFF',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('passes on the API error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      json({ error: 'Uploads are paused on this account' }, 403),
    );
    await expect(uploadReleaseTrackAudio('r1', 't1', audio())).resolves.toEqual(
      {
        ok: false,
        cancelled: false,
        error: 'Uploads are paused on this account',
      },
    );
  });

  it('skips finalize when the storage PUT fails', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      json({
        uploadUrl: 'https://s3.example/put',
        sourceKey: 'k',
        expiresAt: 'x',
      }),
    );
    vi.spyOn(xhr, 'putWithProgress').mockRejectedValue(
      new Error('Upload failed (500)'),
    );
    await expect(uploadReleaseTrackAudio('r1', 't1', audio())).resolves.toEqual(
      {
        ok: false,
        cancelled: false,
        error: 'Upload failed (500)',
      },
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('reports a cancelled upload as cancelled', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      json({
        uploadUrl: 'https://s3.example/put',
        sourceKey: 'k',
        expiresAt: 'x',
      }),
    );
    vi.spyOn(xhr, 'putWithProgress').mockRejectedValue(
      new xhr.UploadAbortedError(),
    );
    await expect(uploadReleaseTrackAudio('r1', 't1', audio())).resolves.toEqual(
      {
        ok: false,
        cancelled: true,
        error: 'Upload cancelled',
      },
    );
  });
});

describe('isReleaseTrackProcessing', () => {
  it('is true only while scanning or transcoding', () => {
    expect(isReleaseTrackProcessing('SCANNING')).toBe(true);
    expect(isReleaseTrackProcessing('TRANSCODING')).toBe(true);
    expect(isReleaseTrackProcessing('READY')).toBe(false);
    expect(isReleaseTrackProcessing('FAILED')).toBe(false);
    expect(isReleaseTrackProcessing(undefined)).toBe(false);
  });
});
