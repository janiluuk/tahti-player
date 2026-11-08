import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TEST_CONFIG } from '../test-helpers';
import { parseTags, runSoundsUpload, uploadSounds } from './sounds-upload.mjs';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function stubUploadApi() {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/api/uploads/prepare')) {
      return json({ uploadId: 'up-1', uploadUrl: 'https://storage.test/put' });
    }
    if (url === 'https://storage.test/put') {
      return new Response(null, { status: 200, headers: { etag: '"abc"' } });
    }
    if (url.endsWith('/api/uploads/complete')) {
      return json({ itemId: 'sound-1' });
    }
    throw new Error(`unexpected ${init?.method ?? 'GET'} ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('parseTags', () => {
  it('splits, trims and de-duplicates tags', () => {
    expect(parseTags(['Trance, live', 'trance', ' '])).toEqual([
      'Trance',
      'live',
    ]);
  });
});

describe('uploadSounds', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tahti-sounds-'));
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await rm(dir, { recursive: true, force: true });
  });

  it('prepares, puts and completes one file with the given metadata', async () => {
    const path = join(dir, 'night_drive.wav');
    await writeFile(path, 'RIFF');
    const fetchMock = stubUploadApi();

    const results = await uploadSounds(TEST_CONFIG, [path], {
      genre: 'Trance',
      tags: ['live'],
    });

    expect(results).toEqual([
      expect.objectContaining({
        title: 'night drive',
        status: 'uploaded',
        id: 'sound-1',
      }),
    ]);
    const prepare = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(prepare).toEqual({
      filename: 'night_drive.wav',
      contentType: 'audio/wav',
      fileSizeBytes: 4,
      title: 'night drive',
    });
    const complete = JSON.parse(String(fetchMock.mock.calls[2][1]?.body));
    expect(complete).toEqual({
      uploadId: 'up-1',
      etag: 'abc',
      title: 'night drive',
      metadata: { genre: 'Trance', tags: ['live'] },
    });
  });

  it('fails a non-audio file without calling the API', async () => {
    const path = join(dir, 'notes.txt');
    await writeFile(path, 'hi');
    const fetchMock = stubUploadApi();

    const results = await uploadSounds(TEST_CONFIG, [path]);

    expect(results[0]).toMatchObject({ status: 'failed' });
    expect(results[0].error).toMatch(/not an audio file/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('only takes --title with a single file', async () => {
    await expect(
      uploadSounds(TEST_CONFIG, ['a.wav', 'b.wav'], { title: 'X' }),
    ).rejects.toThrow(/single file/);
  });

  it('exits with 1 when a file is missing', async () => {
    stubUploadApi();
    const result = await runSoundsUpload(TEST_CONFIG, [join(dir, 'gone.wav')]);
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('file not found');
  });
});
