import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TEST_CONFIG } from '../test-helpers';
import {
  findAudioFiles,
  importFolder,
  runImport,
  titleFromFilename,
} from './import.mjs';

type Call = { url: string; method: string; body?: unknown };

/** Stands in for the API and the storage PUT. `library` is what
 * GET /api/me/sound returns; `failPut` makes one file's upload fail. */
function mockApi({
  library = [] as Array<{ title: string }>,
  failPut = '',
} = {}) {
  const calls: Call[] = [];
  let counter = 0;
  const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
    const method = init.method ?? 'GET';
    const json = (body: unknown, status = 200) => ({
      ok: status < 300,
      status,
      headers: new Headers({ etag: '"etag-1"' }),
      json: async () => body,
    });
    if (url.endsWith('/api/me/sound')) {
      calls.push({ url, method });
      return json(library);
    }
    if (url.endsWith('/api/uploads/prepare')) {
      const body = JSON.parse(String(init.body));
      calls.push({ url, method, body });
      counter += 1;
      return json({
        uploadId: `raw/demo/${counter}`,
        uploadUrl: `https://storage.example.test/${body.filename}`,
      });
    }
    if (url.startsWith('https://storage.example.test/')) {
      calls.push({ url, method });
      return json({}, failPut && url.endsWith(failPut) ? 500 : 200);
    }
    if (url.endsWith('/api/uploads/complete')) {
      const body = JSON.parse(String(init.body));
      calls.push({ url, method, body });
      return json({ itemId: `snd_${body.uploadId.split('/').pop()}` });
    }
    throw new Error(`unexpected request ${method} ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return calls;
}

describe('tahti import', () => {
  let folder: string;

  beforeEach(async () => {
    folder = await mkdtemp(join(tmpdir(), 'tahti-import-'));
    await writeFile(join(folder, '01_night_drive.flac'), 'flac-bytes');
    await writeFile(join(folder, 'Blue Hour.mp3'), 'mp3-bytes');
    await writeFile(join(folder, 'cover.jpg'), 'not audio');
    await writeFile(join(folder, '.hidden.mp3'), 'hidden');
    await writeFile(join(folder, 'empty.wav'), '');
    await mkdir(join(folder, 'live'));
    await writeFile(join(folder, 'live', 'set.ogg'), 'ogg-bytes');
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await rm(folder, { recursive: true, force: true });
  });

  it('titles a sound after its file name', () => {
    expect(titleFromFilename('/music/01_night_drive.flac')).toBe(
      '01 night drive',
    );
    expect(titleFromFilename('Blue Hour.mp3')).toBe('Blue Hour');
  });

  it('finds audio files, skipping hidden files and other types', async () => {
    const top = await findAudioFiles(folder);
    expect(top.map((path) => path.slice(folder.length + 1))).toEqual([
      '01_night_drive.flac',
      'Blue Hour.mp3',
      'empty.wav',
    ]);
    const all = await findAudioFiles(folder, { recursive: true });
    expect(all).toHaveLength(4);
    await expect(findAudioFiles(join(folder, 'nope'))).rejects.toThrow(
      'Folder not found',
    );
  });

  it('uploads each new file: prepare, PUT, complete', async () => {
    const calls = mockApi();
    const results = await importFolder(TEST_CONFIG, folder);

    expect(results.map((r) => [r.file, r.status, r.id])).toEqual([
      ['01_night_drive.flac', 'uploaded', 'snd_1'],
      ['Blue Hour.mp3', 'uploaded', 'snd_2'],
      ['empty.wav', 'skipped', null],
    ]);
    const prepare = calls.filter((c) => c.url.endsWith('/prepare'));
    expect(prepare[0]?.body).toEqual({
      filename: '01_night_drive.flac',
      contentType: 'audio/flac',
      fileSizeBytes: 10,
      title: '01 night drive',
    });
    expect(calls.filter((c) => c.method === 'PUT')).toHaveLength(2);
    const complete = calls.filter((c) => c.url.endsWith('/complete'));
    expect(complete[0]?.body).toEqual({
      uploadId: 'raw/demo/1',
      etag: 'etag-1',
      title: '01 night drive',
    });
  });

  it('skips titles already in the library unless forced', async () => {
    mockApi({ library: [{ title: 'blue hour' }] });
    const results = await importFolder(TEST_CONFIG, folder);
    expect(results.find((r) => r.file === 'Blue Hour.mp3')).toMatchObject({
      status: 'skipped',
      error: 'already in your library',
    });

    const calls = mockApi({ library: [{ title: 'blue hour' }] });
    const forced = await importFolder(TEST_CONFIG, folder, { force: true });
    expect(forced.find((r) => r.file === 'Blue Hour.mp3')?.status).toBe(
      'uploaded',
    );
    expect(calls.some((c) => c.url.endsWith('/api/me/sound'))).toBe(false);
  });

  it('sends nothing on a dry run', async () => {
    const calls = mockApi();
    const result = await runImport(TEST_CONFIG, folder, {
      dryRun: true,
      recursive: true,
    });
    expect(calls.every((c) => c.method === 'GET')).toBe(true);
    expect(result).toMatchObject({ exitCode: 0 });
    const output = (result as { output: string }).output;
    expect(output).toContain('would upload');
    expect(output).toContain('3 to upload, 1 skipped');
  });

  it('keeps going after a failed file and exits with 1', async () => {
    mockApi({ failPut: 'Blue Hour.mp3' });
    const result = (await runImport(TEST_CONFIG, folder)) as {
      output: string;
      exitCode: number;
    };
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('1 uploaded, 1 skipped, 1 failed');
    expect(result.output).toContain('Upload failed (HTTP 500)');
  });

  it('needs a token even for a dry run', async () => {
    mockApi();
    await expect(
      runImport({ ...TEST_CONFIG, token: null }, folder, { dryRun: true }),
    ).rejects.toThrow('Missing API token');
  });
});
