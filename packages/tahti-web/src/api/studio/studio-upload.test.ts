import { afterEach, describe, expect, it, vi } from 'vitest';

import { NOT_AUDIO_MESSAGE, uploadSoundFile } from './studio-upload';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

const bodyOf = (call: unknown[]) =>
  JSON.parse(String((call[1] as RequestInit).body)) as Record<string, unknown>;

describe('uploadSoundFile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('names an untitled upload after its file on prepare and complete', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        json({
          uploadId: 'raw/me/abc.wav',
          uploadUrl: 'https://s3.example/put',
          title: 'Night Drive final',
        }),
      )
      .mockResolvedValueOnce(
        new Response(null, { status: 200, headers: { ETag: '"e1"' } }),
      )
      .mockResolvedValueOnce(json({ itemId: 's1' }, 201));

    const result = await uploadSoundFile({
      file: new File(['RIFF'], 'Night_Drive_final.wav', { type: 'audio/wav' }),
    });

    expect(result).toMatchObject({ ok: true, itemId: 's1' });
    expect(bodyOf(fetchSpy.mock.calls[0]!).title).toBe('Night_Drive_final');
    expect(bodyOf(fetchSpy.mock.calls[2]!).title).toBe('Night Drive final');
  });

  it('shows the API validation message instead of "Validation error"', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      json(
        {
          error: 'Validation error',
          issues: [{ path: ['contentType'], message: 'Invalid' }],
        },
        400,
      ),
    );

    const result = await uploadSoundFile({
      file: new File(['x'], 'clip.mp4', { type: 'video/mp4' }),
    });

    expect(result).toEqual({ ok: false, error: 'contentType: Invalid' });
  });

  it('says a file is not audio when the API refuses it, not "not_audio"', async () => {
    const respond = (complete: unknown) =>
      vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(
          json({
            uploadId: 'raw/me/x.mp3',
            uploadUrl: 'https://s3.example/put',
          }),
        )
        .mockResolvedValueOnce(new Response(null, { status: 200 }))
        .mockResolvedValueOnce(json(complete, 415));
    const file = new File(['%PDF'], 'song.mp3', { type: 'audio/mpeg' });

    respond({ error: 'not_audio', message: 'This file is not an audio file.' });
    expect(await uploadSoundFile({ file })).toEqual({
      ok: false,
      error: 'This file is not an audio file.',
    });

    vi.restoreAllMocks();
    respond({ error: 'not_audio' });
    expect(await uploadSoundFile({ file })).toEqual({
      ok: false,
      error: NOT_AUDIO_MESSAGE,
    });
  });
});
