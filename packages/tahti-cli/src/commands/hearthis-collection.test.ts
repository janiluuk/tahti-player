import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  API,
  collectionOrder,
  CONFIG,
  fixture,
  SET_URL,
  stubApis,
} from './hearthis-api-stub';
import {
  collectionStatePath,
  hearthisToCollection,
  runHearthisCollection,
} from './hearthis-collection.mjs';
import { hearthisToRelease } from './hearthis-release.mjs';
import { LEDGER_FILENAME } from './hearthis-sounds.mjs';

const PERMALINK = '378936-9675121';
const TRACKS = fixture('tahti-hearthis-set-tracks.json').tracks as {
  id: string;
  title: string;
  durationSec: number;
}[];

const posts = (calls: { method: string; url: string }[], path: string) =>
  calls.filter(
    (call) => call.method === 'POST' && call.url === `${API}${path}`,
  );

describe('hearthisToCollection', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tahti-collection-'));
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await rm(dir, { recursive: true, force: true });
  });

  it('uploads, creates the collection with the Set cover and adds the sounds in Set order', async () => {
    const { calls, collections } = stubApis();

    const run = await runHearthisCollection(CONFIG, SET_URL, {
      outDir: dir,
      type: 'mix-series',
      private: true,
      log: () => {},
    });

    expect(run.exitCode).toBe(0);
    expect(posts(calls, '/api/uploads/prepare')).toHaveLength(3);
    const [create] = posts(calls, '/api/me/collections');
    expect(create.body).toEqual({
      name: 'Recorded sets from gigs',
      type: 'MIX_SERIES',
      description: 'Recordings of past sets 2001-2026',
      visibility: 'DRAFT',
    });
    const cover = calls.find((call) => call.url.endsWith('/cover/from-url'));
    expect((cover?.body as { sourceUrl: string }).sourceUrl).toContain(
      'w1000_h1000',
    );
    expect(collectionOrder(collections[0])).toEqual([
      'sound-1',
      'sound-2',
      'sound-3',
    ]);
    expect(run.output).toContain(
      'Created collection "Recorded sets from gigs" (yaniho-recorded-sets-from-gigs): added 3, 0 already there.',
    );
    expect(run.output).toContain(
      'https://tahti.test/studio/collections/yaniho-recorded-sets-from-gigs',
    );
    const state = JSON.parse(
      await readFile(collectionStatePath(dir, PERMALINK), 'utf8'),
    );
    expect(state.slug).toBe('yaniho-recorded-sets-from-gigs');
  });

  it('a rerun neither uploads nor creates anything again', async () => {
    stubApis();
    await hearthisToCollection(CONFIG, SET_URL, { outDir: dir });

    const { calls, collections } = stubApis({
      library: ['sound-1', 'sound-2', 'sound-3'].map((id) => ({
        id,
        title: id,
        durationSec: 1,
      })),
      collections: [
        {
          slug: 'yaniho-recorded-sets-from-gigs',
          name: 'Recorded sets from gigs',
          items: ['sound-1', 'sound-2', 'sound-3'].map((soundId, index) => ({
            id: `i${index}`,
            soundId,
            position: index + 1,
          })),
        },
      ],
    });

    const run = await runHearthisCollection(CONFIG, SET_URL, {
      outDir: dir,
      log: () => {},
    });

    expect(run.exitCode).toBe(0);
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
    expect(collections[0].items).toHaveLength(3);
    expect(run.output).toContain('added 0, 3 already there');
  });

  it('reuses sounds a release run already uploaded, through the shared ledger', async () => {
    const { calls } = stubApis();
    await hearthisToRelease(CONFIG, SET_URL, { outDir: dir });
    const uploadsBefore = posts(calls, '/api/uploads/prepare').length;

    const result = await hearthisToCollection(CONFIG, SET_URL, {
      outDir: dir,
    });

    expect(posts(calls, '/api/uploads/prepare')).toHaveLength(uploadsBefore);
    expect(result.rows.map((row) => row.status)).toEqual([
      'uploaded before',
      'uploaded before',
      'uploaded before',
    ]);
    expect(result.rows.map((row) => row.item)).toEqual([
      'added',
      'added',
      'added',
    ]);
  });

  it('reuses a track another Set already uploaded, with a custom ledger path', async () => {
    const ledgerPath = join(dir, 'shared', 'ledger.json');
    await mkdir(join(dir, 'shared'));
    await writeFile(
      ledgerPath,
      JSON.stringify({ sounds: { [TRACKS[2].id]: { soundId: 'other-set' } } }),
    );
    const { calls } = stubApis({
      library: [{ id: 'other-set', title: 'x', durationSec: 1 }],
    });

    const result = await hearthisToCollection(CONFIG, SET_URL, {
      outDir: join(dir, 'out'),
      ledgerPath,
    });

    expect(posts(calls, '/api/uploads/prepare')).toHaveLength(2);
    expect(result.rows[2]).toMatchObject({
      status: 'uploaded before',
      soundId: 'other-set',
    });
    const ledger = JSON.parse(await readFile(ledgerPath, 'utf8'));
    expect(Object.keys(ledger.sounds)).toHaveLength(3);
  });

  it('migrates the per-Set release state into the ledger', async () => {
    await writeFile(
      join(dir, '.tahti-release-other-set.json'),
      JSON.stringify({
        releaseId: 'rel-x',
        sounds: { [TRACKS[0].id]: { soundId: 'from-release' } },
      }),
    );
    const { calls } = stubApis({
      library: [{ id: 'from-release', title: 'x', durationSec: 1 }],
    });

    const result = await hearthisToCollection(CONFIG, SET_URL, {
      outDir: dir,
    });

    expect(posts(calls, '/api/uploads/prepare')).toHaveLength(2);
    expect(result.rows[0].soundId).toBe('from-release');
    const ledger = JSON.parse(
      await readFile(join(dir, LEDGER_FILENAME), 'utf8'),
    );
    expect(ledger.sounds[TRACKS[0].id]).toMatchObject({
      soundId: 'from-release',
      from: 'release state',
    });
  });

  it('uploads again when the ledger sound is gone from the library', async () => {
    await writeFile(
      join(dir, LEDGER_FILENAME),
      JSON.stringify({ sounds: { [TRACKS[0].id]: { soundId: 'deleted' } } }),
    );
    const { calls } = stubApis();

    const result = await hearthisToCollection(CONFIG, SET_URL, {
      outDir: dir,
    });

    expect(posts(calls, '/api/uploads/prepare')).toHaveLength(3);
    expect(result.rows[0].soundId).toBe('sound-1');
  });

  it('matches the library by hearthis export id, then title + duration, and skips a track that has an embed', async () => {
    const { calls } = stubApis({
      library: [
        {
          id: 'embed-1',
          title: TRACKS[0].title,
          durationSec: TRACKS[0].durationSec,
          embedProvider: 'HEARTHIS',
        },
        {
          id: 'native-2',
          title: TRACKS[1].title,
          durationSec: TRACKS[1].durationSec - 2,
          embedProvider: null,
          status: 'READY',
        },
        {
          id: 'exported-3',
          title: 'Renamed on Tahti',
          durationSec: 10,
          hearthisExportId: TRACKS[2].id,
        },
      ],
    });

    const result = await hearthisToCollection(CONFIG, SET_URL, {
      outDir: dir,
    });

    expect(posts(calls, '/api/uploads/prepare')).toHaveLength(0);
    expect(
      result.rows.map((row) => [row.status, row.soundId, row.matchedBy]),
    ).toEqual([
      ['possible duplicate', null, null],
      ['in library', 'native-2', 'title + duration'],
      ['in library', 'exported-3', 'hearthis export id'],
    ]);
  });

  it('skips a non-downloadable track, adds the rest and exits with 1', async () => {
    const catalog = fixture('tahti-hearthis-set-tracks.json');
    catalog.tracks[1] = {
      ...catalog.tracks[1],
      downloadable: false,
      downloadUrl: null,
    };
    const { collections } = stubApis({ catalog });

    const run = await runHearthisCollection(CONFIG, SET_URL, {
      outDir: dir,
      log: () => {},
    });

    expect(run.exitCode).toBe(1);
    expect(collectionOrder(collections[0])).toEqual(['sound-1', 'sound-2']);
    expect(run.output).toContain(
      'Skipped 1: #2 (not downloadable on hearthis.at).',
    );
  });

  it('--strict stops before changing anything when a track is not downloadable', async () => {
    const catalog = fixture('tahti-hearthis-set-tracks.json');
    catalog.tracks[1] = {
      ...catalog.tracks[1],
      downloadable: false,
      downloadUrl: null,
    };
    const { calls } = stubApis({ catalog });

    const run = await runHearthisCollection(CONFIG, SET_URL, {
      outDir: dir,
      strict: true,
      log: () => {},
    });

    expect(run.exitCode).toBe(1);
    expect(run.output).toMatch(
      /Stopped: 1 track\(s\) are not downloadable .*\(2\)/,
    );
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('skips a track whose upload fails and still adds the others', async () => {
    const { collections } = stubApis({ failUploadOf: TRACKS[0].title });

    const result = await hearthisToCollection(CONFIG, SET_URL, {
      outDir: dir,
    });

    expect(result.rows[0]).toMatchObject({ status: 'failed', item: 'skipped' });
    expect(result.rows[0].reason).toContain('Storage is full');
    expect(collectionOrder(collections[0])).toEqual(['sound-2', 'sound-3']);
  });

  it('dry-run reads only, and lists uploads, reuses, the new collection and the adds', async () => {
    await writeFile(
      join(dir, LEDGER_FILENAME),
      JSON.stringify({ sounds: { [TRACKS[0].id]: { soundId: 'kept-1' } } }),
    );
    const { calls } = stubApis({
      library: [{ id: 'kept-1', title: 'x', durationSec: 1 }],
    });

    const run = await runHearthisCollection(CONFIG, SET_URL, {
      outDir: dir,
      dryRun: true,
      type: 'album',
      log: () => {},
    });

    expect(run.exitCode).toBe(0);
    expect(calls.every((call) => call.method === 'GET')).toBe(true);
    expect(calls.some((call) => call.url.includes('hearthis.app'))).toBe(false);
    expect(await readdir(dir)).toEqual([LEDGER_FILENAME]);
    expect(run.output).toContain('Collection: new (album, public)');
    expect(run.output).toContain('would upload');
    expect(run.output).toContain(
      'Dry run: would upload 2, reuse 1 from the ledger and 0 from your library, create the collection, add 3 and skip 0.',
    );
  });

  it('stops when a collection with the same name exists, and fills it with --slug', async () => {
    const existing = {
      slug: 'my-gigs',
      name: 'RECORDED SETS FROM GIGS',
      items: [{ id: 'x', soundId: 'someone-else', position: 1 }],
    };
    const { calls, collections } = stubApis({ collections: [existing] });

    const stopped = await runHearthisCollection(CONFIG, SET_URL, {
      outDir: dir,
      log: () => {},
    });
    expect(stopped.exitCode).toBe(1);
    expect(stopped.output).toContain('Pass --slug my-gigs');
    expect(calls.some((call) => call.method === 'POST')).toBe(false);

    const filled = await hearthisToCollection(CONFIG, SET_URL, {
      outDir: dir,
      slug: 'my-gigs',
    });
    expect(filled.created).toBe(false);
    expect(collections).toHaveLength(1);
    expect(collectionOrder(collections[0])).toEqual([
      'sound-1',
      'sound-2',
      'sound-3',
      'someone-else',
    ]);
    const state = JSON.parse(
      await readFile(collectionStatePath(dir, PERMALINK), 'utf8'),
    );
    expect(state.slug).toBe('my-gigs');
  });

  it('fills a gap in Set order without moving the items already there', async () => {
    await writeFile(
      collectionStatePath(dir, PERMALINK),
      JSON.stringify({ slug: 'gigs' }),
    );
    await writeFile(
      join(dir, LEDGER_FILENAME),
      JSON.stringify({
        sounds: Object.fromEntries(
          TRACKS.map((track, index) => [
            track.id,
            { soundId: `s${index + 1}` },
          ]),
        ),
      }),
    );
    const { calls, collections } = stubApis({
      library: ['s1', 's2', 's3'].map((id) => ({
        id,
        title: id,
        durationSec: 1,
      })),
      collections: [
        {
          slug: 'gigs',
          name: 'Gigs',
          items: [
            { id: 'a', soundId: 's1', position: 1 },
            { id: 'b', soundId: 'extra', position: 2 },
            { id: 'c', soundId: 's3', position: 3 },
          ],
        },
      ],
    });

    await hearthisToCollection(CONFIG, SET_URL, { outDir: dir });

    expect(posts(calls, '/api/me/collections')).toHaveLength(0);
    expect(collectionOrder(collections[0])).toEqual([
      's1',
      's2',
      'extra',
      's3',
    ]);
  });

  it('leaves tracks still processing for the next run', async () => {
    const { collections, library } = stubApis({ stillProcessing: true });

    const run = await runHearthisCollection(CONFIG, SET_URL, {
      outDir: dir,
      wait: '0',
      log: () => {},
    });

    expect(run.exitCode).toBe(1);
    expect(collections[0].items).toHaveLength(0);
    expect(run.output).toContain('3 track(s) are still processing');

    for (const sound of library) {
      sound.status = 'READY';
    }
    const rerun = await runHearthisCollection(CONFIG, SET_URL, {
      outDir: dir,
      log: () => {},
    });
    expect(rerun.exitCode).toBe(0);
    expect(collections).toHaveLength(1);
    expect(collectionOrder(collections[0])).toEqual([
      'sound-1',
      'sound-2',
      'sound-3',
    ]);
  });

  it('stops when the collection in the state file is gone', async () => {
    await writeFile(
      collectionStatePath(dir, PERMALINK),
      JSON.stringify({ slug: 'deleted-one' }),
    );
    const { calls } = stubApis();

    const result = await hearthisToCollection(CONFIG, SET_URL, {
      outDir: dir,
    });

    expect(result.stopped).toContain('"deleted-one", which you no longer have');
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('refuses a single track URL', async () => {
    stubApis();

    await expect(
      hearthisToCollection(
        CONFIG,
        'https://hearthis.at/yaniho/nightriders-vol-43-set-of-melodic-trance-8112025/',
        { outDir: dir },
      ),
    ).rejects.toThrow(/made from a hearthis.at Set/);
  });

  it('rejects an unknown --type', async () => {
    stubApis();

    await expect(
      hearthisToCollection(CONFIG, SET_URL, { outDir: dir, type: 'podcast' }),
    ).rejects.toThrow(/Expected one of: mix-series, album, custom/);
  });
});
