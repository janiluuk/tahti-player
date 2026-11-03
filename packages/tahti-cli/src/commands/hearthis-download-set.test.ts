import { mkdir, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  downloadHearthisSet,
  parseTrackSelection,
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

describe('downloadHearthisSet --sync', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const config = { apiUrl: 'https://api.example.test', token: 'tahti_test' };

  function stubFetch(remoteSize: number) {
    const fetchMock = vi.fn(async (url: string, init?: { method?: string }) => {
      if (url.includes('/imports/hearthis/')) {
        const catalog = catalogResponse();
        catalog.set.coverUrl =
          'https://img.example/w500_h500_cover.jpg' as unknown as null;
        return { ok: true, json: async () => catalog };
      }
      if (init?.method === 'HEAD') {
        return {
          ok: true,
          headers: new Headers({ 'content-length': String(remoteSize) }),
        };
      }
      const body = url.includes('img.example')
        ? 'cover'
        : 'x'.repeat(remoteSize);
      return new Response(body, {
        headers: {
          'content-type': url.includes('img.example')
            ? 'image/jpeg'
            : 'audio/wav',
        },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  it('re-downloads a changed file, deletes stale ones and keeps the cover', async () => {
    const outDir = await mkdtemp(join(tmpdir(), 'hearthis-sync-'));
    const album = join(outDir, 'Yaniho', 'Euphorizer LP (2024)');
    await mkdir(album, { recursive: true });
    await writeFile(join(album, '01 - Hysterizer.wav'), 'old');
    await writeFile(join(album, '02 - Stream Only.mp3'), 'kept');
    await writeFile(join(album, '03 - Removed track.wav'), 'gone');
    await writeFile(join(album, 'notes.txt'), 'mine');
    const fetchMock = stubFetch(8);

    const result = await downloadHearthisSet(config, '378936-9675121', {
      outDir,
      sync: true,
    });

    expect(result.rows.map((row) => [row.title, row.status])).toEqual([
      ['Hysterizer', 'updated'],
      ['Stream Only', 'skipped'],
      ['03 - Removed track.wav', 'deleted'],
    ]);
    expect(await readFile(join(album, '01 - Hysterizer.wav'), 'utf8')).toBe(
      'xxxxxxxx',
    );
    expect((await readdir(album)).sort()).toEqual([
      '01 - Hysterizer.wav',
      '02 - Stream Only.mp3',
      'cover.jpg',
      'notes.txt',
    ]);
    expect(result.artwork).toEqual([
      { status: 'downloaded', path: join(album, 'cover.jpg') },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://img.example/w1000_h1000_cover.jpg',
    );
  });

  it('leaves a file alone when its size matches', async () => {
    const outDir = await mkdtemp(join(tmpdir(), 'hearthis-sync-'));
    const album = join(outDir, 'Yaniho', 'Euphorizer LP (2024)');
    await mkdir(album, { recursive: true });
    await writeFile(join(album, '01 - Hysterizer.wav'), 'same');
    stubFetch(4);

    const result = await downloadHearthisSet(config, '378936-9675121', {
      outDir,
      sync: true,
      dryRun: true,
    });

    expect(result.rows[0]).toMatchObject({
      status: 'skipped',
      reason: 'already exists',
    });
    expect(result.artwork[0].status).toBe('would-download');
  });

  it('plans a FLAC file for WAV sources and keeps an existing one', async () => {
    const outDir = await mkdtemp(join(tmpdir(), 'hearthis-sync-'));
    const album = join(outDir, 'Yaniho', 'Euphorizer LP (2024)');
    await mkdir(album, { recursive: true });
    await writeFile(join(album, '01 - Hysterizer.flac'), 'flac');
    stubFetch(99);

    const result = await downloadHearthisSet(config, '378936-9675121', {
      outDir,
      sync: true,
      flac: true,
      dryRun: true,
      artwork: false,
    });

    expect(result.rows[0]).toMatchObject({
      status: 'skipped',
      path: 'Yaniho/Euphorizer LP (2024)/01 - Hysterizer.flac',
    });
    expect(result.rows).toHaveLength(2);
  });
});

describe('downloadHearthisSet --flac with an MP3 original', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps an MP3 as MP3 and never deletes the old copy first', async () => {
    const outDir = await mkdtemp(join(tmpdir(), 'hearthis-mp3-'));
    const album = join(outDir, 'Yaniho', 'Euphorizer LP (2024)');
    await mkdir(album, { recursive: true });
    await writeFile(join(album, '01 - Hysterizer.mp3'), 'mp3data!');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: { method?: string }) => {
        if (url.includes('/imports/hearthis/')) {
          return { ok: true, json: async () => catalogResponse() };
        }
        if (init?.method === 'HEAD') {
          return { ok: true, headers: new Headers({ 'content-length': '8' }) };
        }
        return new Response('mp3data!', {
          headers: { 'content-type': 'audio/mpeg' },
        });
      }),
    );

    const result = await downloadHearthisSet(
      { apiUrl: 'https://api.example.test', token: 'tahti_test' },
      '378936-9675121',
      { outDir, sync: true, flac: true, artwork: false },
    );

    expect(result.rows[0]).toMatchObject({ status: 'skipped' });
    expect((await readdir(album)).sort()).toEqual(['01 - Hysterizer.mp3']);
  });
});

describe('runHearthisDownloadSet progress', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('logs one line per track as it goes, but not for --json', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => catalogResponse(),
      }),
    );
    const config = { apiUrl: 'https://api.example.test', token: 'tahti_test' };
    const log = vi.fn();
    await runHearthisDownloadSet(config, '378936-9675121', {
      dryRun: true,
      outDir: '/tmp/progress-out',
      log,
    });
    expect(log.mock.calls.map(([line]) => line)).toEqual([
      '  01 Hysterizer: would-download',
      '  02 Stream Only: skipped',
    ]);

    const quiet = vi.fn();
    await runHearthisDownloadSet(config, '378936-9675121', {
      dryRun: true,
      json: true,
      outDir: '/tmp/progress-out',
      log: quiet,
    });
    expect(quiet).not.toHaveBeenCalled();
  });
});

describe('downloadHearthisSet selection and cover name', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses track selections and rejects junk', () => {
    expect([...parseTrackSelection('1,3-5')]).toEqual([1, 3, 4, 5]);
    expect(() => parseTrackSelection('1,a')).toThrow(/--tracks/);
  });

  it('skips excluded tracks without deleting their files on --sync', async () => {
    const outDir = await mkdtemp(join(tmpdir(), 'hearthis-exclude-'));
    const album = join(outDir, 'Yaniho', 'Euphorizer LP (2024)');
    await mkdir(album, { recursive: true });
    await writeFile(join(album, '01 - Hysterizer.wav'), 'keep');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/imports/hearthis/')) {
          const catalog = catalogResponse();
          catalog.set.coverUrl = 'https://img.example/c.jpg' as unknown as null;
          return { ok: true, json: async () => catalog };
        }
        return new Response('img', {
          headers: { 'content-type': 'image/jpeg' },
        });
      }),
    );

    const result = await downloadHearthisSet(
      { apiUrl: 'https://api.example.test', token: 'tahti_test' },
      '378936-9675121',
      { outDir, sync: true, exclude: '^hyster', coverName: 'folder' },
    );

    expect(result.rows[0]).toMatchObject({
      status: 'skipped',
      reason: 'not selected',
    });
    expect((await readdir(album)).sort()).toEqual([
      '01 - Hysterizer.wav',
      'folder.jpg',
    ]);
  });
});
