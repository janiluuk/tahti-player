import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { API, CONFIG, fixture, SET_URL, stubApis } from './hearthis-api-stub';
import {
  hearthisToRelease,
  releaseUrl,
  runHearthisRelease,
  stateFilePath,
} from './hearthis-release.mjs';
import { LEDGER_FILENAME } from './hearthis-sounds.mjs';

describe('hearthisToRelease', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tahti-release-'));
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await rm(dir, { recursive: true, force: true });
  });

  it('downloads, uploads in Set order, creates the release and sets the cover', async () => {
    const { calls } = stubApis();

    const result = await hearthisToRelease(CONFIG, SET_URL, { outDir: dir });

    const prepares = calls.filter((call) =>
      call.url.endsWith('/api/uploads/prepare'),
    );
    expect(
      prepares.map((call) => (call.body as { title: string }).title),
    ).toEqual(
      fixture('tahti-hearthis-set-tracks.json').tracks.map(
        (track: { title: string }) => track.title,
      ),
    );
    const complete = calls.find((call) =>
      call.url.endsWith('/api/uploads/complete'),
    );
    expect((complete?.body as { metadata: unknown }).metadata).toMatchObject({
      genre: 'Trance',
      tags: ['Trance'],
      releasedAt: '2025-11-09T00:00:00.000Z',
    });

    const create = calls.find(
      (call) => call.url === `${API}/api/me/releases` && call.method === 'POST',
    );
    expect(create?.body).toMatchObject({
      title: 'Recorded sets from gigs',
      type: 'EP',
      releaseDate: '2023-04-10',
      tracks: [
        { soundId: 'sound-1', title: 'title of sound-1', durationSec: 2219 },
        { soundId: 'sound-2' },
        { soundId: 'sound-3' },
      ],
    });
    const cover = calls.find((call) => call.url.endsWith('/artwork/from-url'));
    expect((cover?.body as { sourceUrl: string }).sourceUrl).toContain(
      'w1000_h1000',
    );
    expect(result.releaseUrl).toBe('https://tahti.test/studio/releases/rel-1');

    const state = JSON.parse(
      await readFile(stateFilePath(dir, '378936-9675121'), 'utf8'),
    );
    expect(state.releaseId).toBe('rel-1');
    expect(Object.keys(state.sounds)).toHaveLength(3);
  });

  it('resumes: skips sounds already uploaded and only downloads the rest', async () => {
    const tracks = fixture('tahti-hearthis-set-tracks.json').tracks;
    await writeFile(
      stateFilePath(dir, '378936-9675121'),
      JSON.stringify({
        releaseId: null,
        sounds: {
          [tracks[0].id]: { soundId: 'old-1' },
          [tracks[1].id]: { soundId: 'old-2' },
        },
      }),
    );
    const { calls } = stubApis({
      library: [
        { id: 'old-1', title: tracks[0].title, durationSec: 1 },
        { id: 'old-2', title: tracks[1].title, durationSec: 1 },
      ],
    });

    const result = await hearthisToRelease(CONFIG, SET_URL, { outDir: dir });

    expect(
      calls.filter((call) => call.url.startsWith('https://hearthis.app/')),
    ).toHaveLength(1);
    expect(
      calls.filter((call) => call.url.endsWith('/api/uploads/prepare')),
    ).toHaveLength(1);
    const create = calls.find(
      (call) => call.url === `${API}/api/me/releases` && call.method === 'POST',
    );
    expect(
      (create?.body as { tracks: { soundId: string }[] }).tracks.map(
        (track) => track.soundId,
      ),
    ).toEqual(['old-1', 'old-2', 'sound-1']);
    expect(result.rows.map((row) => row.status)).toEqual([
      'uploaded before',
      'uploaded before',
      'uploaded',
    ]);
  });

  it('does not create the release twice', async () => {
    await writeFile(
      stateFilePath(dir, '378936-9675121'),
      JSON.stringify({ releaseId: 'rel-9', sounds: {} }),
    );
    const { calls } = stubApis();

    const run = await runHearthisRelease(CONFIG, SET_URL, {
      outDir: dir,
      log: () => {},
    });

    expect(run.exitCode).toBe(0);
    expect(run.output).toContain('already created (rel-9)');
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('stops when a release with the same title exists unless --force-new', async () => {
    const { calls } = stubApis({
      releases: [{ id: 'rel-old', title: 'recorded sets from gigs' }],
    });

    const run = await runHearthisRelease(CONFIG, SET_URL, {
      outDir: dir,
      log: () => {},
    });

    expect(run.exitCode).toBe(1);
    expect(run.output).toContain(
      'already have a release titled "Recorded sets from gigs" (rel-old)',
    );
    expect(calls.some((call) => call.method === 'POST')).toBe(false);

    const forced = await hearthisToRelease(CONFIG, SET_URL, {
      outDir: dir,
      forceNew: true,
    });
    expect(forced.release?.id).toBe('rel-1');
  });

  it('dry-run lists the release without downloading or sending anything', async () => {
    const { calls } = stubApis();

    const run = await runHearthisRelease(CONFIG, SET_URL, {
      outDir: dir,
      dryRun: true,
      log: () => {},
    });

    expect(run.exitCode).toBe(0);
    expect(run.output).toContain('Recorded sets from gigs (ep, 2023-04-10)');
    expect(run.output).toContain('would upload');
    expect(calls.every((call) => call.method === 'GET')).toBe(true);
    expect(calls.some((call) => call.url.includes('hearthis.app'))).toBe(false);
    expect(await readdir(dir)).toEqual([]);
  });

  it('stops before downloading when a chosen track is not downloadable', async () => {
    const catalog = fixture('tahti-hearthis-set-tracks.json');
    catalog.tracks[1] = {
      ...catalog.tracks[1],
      downloadable: false,
      downloadUrl: null,
    };
    const { calls } = stubApis({ catalog });

    const result = await hearthisToRelease(CONFIG, SET_URL, { outDir: dir });

    expect(result.stopped).toMatch(/not downloadable .*\(2\).*--tracks/);
    expect(calls.some((call) => call.url.includes('hearthis.app'))).toBe(false);

    const picked = await hearthisToRelease(CONFIG, SET_URL, {
      outDir: dir,
      tracks: '1,3',
    });
    expect(picked.release?.id).toBe('rel-1');
  });

  it('keeps finished uploads and creates no release when one upload fails', async () => {
    const titles = fixture('tahti-hearthis-set-tracks.json').tracks.map(
      (track: { title: string }) => track.title,
    );
    const { calls } = stubApis({ failUploadOf: titles[1] });

    const run = await runHearthisRelease(CONFIG, SET_URL, {
      outDir: dir,
      log: () => {},
    });

    expect(run.exitCode).toBe(1);
    expect(run.output).toContain('Storage is full');
    expect(
      calls.some(
        (call) =>
          call.url === `${API}/api/me/releases` && call.method === 'POST',
      ),
    ).toBe(false);
    const state = JSON.parse(
      await readFile(stateFilePath(dir, '378936-9675121'), 'utf8'),
    );
    expect(Object.keys(state.sounds)).toHaveLength(2);
  });

  it('turns a single track URL into a one-track single', async () => {
    const { calls } = stubApis();

    const result = await hearthisToRelease(
      CONFIG,
      'https://hearthis.at/yaniho/nightriders-vol-43-set-of-melodic-trance-8112025/',
      { outDir: dir },
    );

    const create = calls.find(
      (call) => call.url === `${API}/api/me/releases` && call.method === 'POST',
    );
    expect(create?.body).toMatchObject({
      type: 'SINGLE',
      releaseDate: '2025-11-09',
      tracks: [{ soundId: 'sound-1' }],
    });
    expect(result.plan.title).toMatch(/^Nightriders vol. 43/);
  });
});

describe('hearthisToRelease with the upload ledger', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tahti-release-ledger-'));
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await rm(dir, { recursive: true, force: true });
  });

  it('records every upload in the ledger by hearthis.at track id', async () => {
    stubApis();

    await hearthisToRelease(CONFIG, SET_URL, { outDir: dir });

    const ledger = JSON.parse(
      await readFile(join(dir, LEDGER_FILENAME), 'utf8'),
    );
    const ids = fixture('tahti-hearthis-set-tracks.json').tracks.map(
      (track: { id: string }) => track.id,
    );
    expect(Object.keys(ledger.sounds).sort()).toEqual([...ids].sort());
    expect(ledger.sounds[ids[0]]).toMatchObject({
      soundId: 'sound-1',
      from: 'upload',
    });
  });

  it('reuses a library upload with the same title and length instead of uploading it', async () => {
    const tracks = fixture('tahti-hearthis-set-tracks.json').tracks;
    const { calls } = stubApis({
      library: [
        {
          id: 'mine-2',
          title: `  ${tracks[1].title.toUpperCase()} `,
          durationSec: tracks[1].durationSec + 1,
          status: 'READY',
          embedProvider: null,
        },
      ],
    });

    const result = await hearthisToRelease(CONFIG, SET_URL, { outDir: dir });

    expect(
      calls.filter((call) => call.url.endsWith('/api/uploads/prepare')),
    ).toHaveLength(2);
    expect(result.rows[1]).toMatchObject({
      status: 'in library',
      soundId: 'mine-2',
      matchedBy: 'title + duration',
    });
  });

  it('does not stop on a non-downloadable track that is already uploaded', async () => {
    const catalog = fixture('tahti-hearthis-set-tracks.json');
    catalog.tracks[1] = {
      ...catalog.tracks[1],
      downloadable: false,
      downloadUrl: null,
    };
    await writeFile(
      join(dir, LEDGER_FILENAME),
      JSON.stringify({
        sounds: { [catalog.tracks[1].id]: { soundId: 'kept-2' } },
      }),
    );
    stubApis({
      catalog,
      library: [{ id: 'kept-2', title: 'x', durationSec: 5 }],
    });

    const result = await hearthisToRelease(CONFIG, SET_URL, { outDir: dir });

    expect(result.stopped).toBeNull();
    expect(result.rows.map((row) => row.soundId)).toEqual([
      'sound-1',
      'kept-2',
      'sound-2',
    ]);
  });

  it('dry-run says how many tracks are new and how many are reused', async () => {
    const tracks = fixture('tahti-hearthis-set-tracks.json').tracks;
    await writeFile(
      join(dir, LEDGER_FILENAME),
      JSON.stringify({ sounds: { [tracks[0].id]: { soundId: 'kept-1' } } }),
    );
    stubApis({
      library: [
        { id: 'kept-1', title: 'x', durationSec: 5 },
        {
          id: 'mine-3',
          title: tracks[2].title,
          durationSec: tracks[2].durationSec,
        },
      ],
    });

    const run = await runHearthisRelease(CONFIG, SET_URL, {
      outDir: dir,
      dryRun: true,
      log: () => {},
    });

    expect(run.output).toContain(
      'would upload 1, reuse 1 from the ledger and 1 from your library',
    );
    const ledger = JSON.parse(
      await readFile(join(dir, LEDGER_FILENAME), 'utf8'),
    );
    expect(Object.keys(ledger.sounds)).toEqual([tracks[0].id]);
  });
});

describe('releaseUrl', () => {
  it('points at Studio on the web host next to the API', () => {
    expect(
      releaseUrl({ apiUrl: 'https://api.tahti.live', env: {} }, 'r1'),
    ).toBe('https://tahti.live/studio/releases/r1');
    expect(
      releaseUrl(
        {
          apiUrl: 'http://localhost:3000',
          env: { TAHTI_WEB_URL: 'http://localhost:5173/' },
        },
        'r1',
      ),
    ).toBe('http://localhost:5173/studio/releases/r1');
    expect(releaseUrl({ apiUrl: 'http://localhost:3000', env: {} }, 'r1')).toBe(
      null,
    );
  });
});
