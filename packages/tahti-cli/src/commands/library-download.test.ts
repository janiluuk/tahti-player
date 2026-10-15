import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TEST_CONFIG } from '../test-helpers';
import { runLibraryDownload } from './library-download.mjs';

const DOWNLOAD = {
  url: 'https://storage.example.test/raw/s_1.flac?sig=abc',
  filename: 'Night Drive / Edit.flac',
};

function mockDownload(body = 'FLACDATA', status = 200) {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => DOWNLOAD,
    })
    .mockResolvedValueOnce({
      ok: status === 200,
      status,
      body: new Response(body).body,
    });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('runLibraryDownload', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tahti-download-'));
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await rm(dir, { recursive: true, force: true });
  });

  it('saves the original under a safe file name', async () => {
    const fetchMock = mockDownload();
    const output = await runLibraryDownload(TEST_CONFIG, 's_1', {
      outDir: dir,
    });
    const target = join(dir, 'Night Drive Edit.flac');
    expect(output).toBe(`Saved ${target}`);
    expect(await readFile(target, 'utf8')).toBe('FLACDATA');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.example.test/api/me/sound/s_1/download',
    );
    expect(fetchMock.mock.calls[1]).toEqual([DOWNLOAD.url]);
  });

  it('keeps an existing file unless --force', async () => {
    const target = join(dir, 'Night Drive Edit.flac');
    await writeFile(target, 'OLD');
    mockDownload();
    await expect(
      runLibraryDownload(TEST_CONFIG, 's_1', { outDir: dir }),
    ).rejects.toThrow('already exists');
    expect(await readFile(target, 'utf8')).toBe('OLD');

    mockDownload('NEW');
    await runLibraryDownload(TEST_CONFIG, 's_1', { outDir: dir, force: true });
    expect(await readFile(target, 'utf8')).toBe('NEW');
  });

  it('prints only the signed URL with --url', async () => {
    const fetchMock = mockDownload();
    expect(await runLibraryDownload(TEST_CONFIG, 's_1', { url: true })).toBe(
      DOWNLOAD.url,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports a failed storage download and leaves no partial file', async () => {
    mockDownload('', 403);
    await expect(
      runLibraryDownload(TEST_CONFIG, 's_1', { outDir: dir }),
    ).rejects.toThrow('Download failed (HTTP 403)');
  });

  it('shows the API message when there is nothing to download yet', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ error: 'No downloadable file for this item yet' }),
      }),
    );
    await expect(runLibraryDownload(TEST_CONFIG, 's_1')).rejects.toThrow(
      'No downloadable file for this item yet',
    );
  });
});
