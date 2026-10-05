import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  downloadHearthisSet,
  runHearthisDownloadSet,
} from './hearthis-download-set.mjs';

function catalogResponse() {
  return {
    permalink: '378936-9675121',
    url: 'https://hearthis.at/set/378936-9675121/',
    set: {
      id: '378936',
      permalink: '378936-9675121',
      url: 'https://hearthis.at/set/378936-9675121/',
      title: 'Euphorizer LP',
      description: '',
      trackCount: 2,
      coverUrl: null,
      username: 'Yaniho',
      userPermalink: 'yaniho',
      year: 2024,
    },
    tracks: [
      {
        position: 1,
        id: '1',
        title: 'Hysterizer',
        username: 'Yaniho',
        durationSec: 300,
        downloadable: true,
        downloadUrl: 'https://hearthis.example/dl/1',
        downloadFilename: 'Hysterizer.wav',
        releaseDate: '2024-01-01',
      },
      {
        position: 2,
        id: '2',
        title: 'Stream Only',
        username: 'Yaniho',
        durationSec: 120,
        downloadable: false,
        downloadUrl: null,
        downloadFilename: null,
        releaseDate: '2024-01-02',
      },
    ],
  };
}

describe('downloadHearthisSet', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('dry-runs downloadable tracks into Artist/Album (year)/NN - Title.ext', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => catalogResponse(),
      }),
    );

    const result = await downloadHearthisSet(
      { apiUrl: 'https://api.example.test', token: 'tahti_test' },
      '378936-9675121',
      { dryRun: true, outDir: '/tmp/discog-out' },
    );

    expect(result.artist).toBe('Yaniho');
    expect(result.albumTitle).toBe('Euphorizer LP');
    expect(result.year).toBe(2024);
    expect(result.rows[0]).toMatchObject({
      status: 'would-download',
      path: 'Yaniho/Euphorizer LP (2024)/01 - Hysterizer.wav',
    });
    expect(result.rows[1]).toMatchObject({
      status: 'skipped',
      reason: 'not downloadable',
    });
  });

  it('downloads the original file and skips existing paths unless --force', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tahti-hearthis-dl-'));
    const existing = join(
      dir,
      'Yaniho/Euphorizer LP (2024)/01 - Hysterizer.wav',
    );
    await writeFile(join(dir, '.keep'), '');
    // Pre-create nested file via a first download mock
    const audio = Buffer.from('RIFF....WAVE');
    const fetchMock = vi
      .fn()
      // catalog
      .mockResolvedValueOnce({
        ok: true,
        json: async () => catalogResponse(),
      })
      // first download body
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'audio/wav' }),
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(audio);
            controller.close();
          },
        }),
      })
      // second catalog for skip check
      .mockResolvedValueOnce({
        ok: true,
        json: async () => catalogResponse(),
      });
    vi.stubGlobal('fetch', fetchMock);

    const first = await downloadHearthisSet(
      { apiUrl: 'https://api.example.test', token: 'tahti_test' },
      '378936-9675121',
      { outDir: dir },
    );
    expect(first.rows[0].status).toBe('downloaded');
    expect(await readFile(existing)).toEqual(audio);

    const second = await downloadHearthisSet(
      { apiUrl: 'https://api.example.test', token: 'tahti_test' },
      '378936-9675121',
      { outDir: dir },
    );
    expect(second.rows[0]).toMatchObject({
      status: 'skipped',
      reason: 'already exists',
    });
  });
});

describe('runHearthisDownloadSet', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns exitCode 0 for a clean dry-run', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => catalogResponse(),
      }),
    );

    const result = await runHearthisDownloadSet(
      { apiUrl: 'https://api.example.test', token: 'tahti_test' },
      '378936-9675121',
      { dryRun: true },
    );
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain('would download');
    expect(result.output).toContain('download_url');
  });
});
