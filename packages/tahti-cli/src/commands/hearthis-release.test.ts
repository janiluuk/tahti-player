import { readFileSync } from 'node:fs';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TEST_CONFIG } from '../test-helpers';
import {
  hearthisToRelease,
  releaseUrl,
  runHearthisRelease,
  stateFilePath,
} from './hearthis-release.mjs';

const CONFIG = { ...TEST_CONFIG, apiUrl: 'https://api.tahti.test' };
const API = CONFIG.apiUrl;
const SET_URL = 'https://hearthis.at/set/378936-9675121/';

const fixture = (name: string) =>
  JSON.parse(
    readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'),
  );

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

type Calls = { method: string; url: string; body: unknown }[];

function stubApis({
  catalog = fixture('tahti-hearthis-set-tracks.json'),
  releases = [] as { id: string; title: string }[],
  failUploadOf = null as string | null,
} = {}) {
  const calls: Calls = [];
  let uploads = 0;
  const preparedTitles = new Map<string, string>();
  const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
    const method = init.method ?? 'GET';
    const body =
      typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
    calls.push({ method, url, body });
    if (url.startsWith(`${API}/api/v1/imports/hearthis/sets/`)) {
      return json(catalog);
    }
    if (url.startsWith('https://api-v2.hearthis.at/')) {
      return json(fixture('hearthis-track.json'));
    }
    if (url.startsWith(`${API}/api/me/releases?`)) {
      return json({ releases, total: releases.length, page: 1, limit: 100 });
    }
    if (url.startsWith('https://hearthis.app/')) {
      return new Response(`audio:${url}`, {
        headers: { 'content-type': 'audio/wav' },
      });
    }
    if (url === `${API}/api/uploads/prepare`) {
      const id = `up-${++uploads}`;
      preparedTitles.set(id, (body as { title: string }).title);
      if (failUploadOf && (body as { title: string }).title === failUploadOf) {
        return json({ error: 'Storage is full' }, 507);
      }
      return json({ uploadId: id, uploadUrl: `https://storage.test/${id}` });
    }
    if (url.startsWith('https://storage.test/')) {
      return new Response(null, { headers: { etag: '"e"' } });
    }
    if (url === `${API}/api/uploads/complete`) {
      const { uploadId } = body as { uploadId: string };
      return json({ itemId: `sound-${uploadId.slice(3)}` });
    }
    if (url.startsWith(`${API}/api/me/sound/`)) {
      const id = decodeURIComponent(url.split('/').pop() ?? '');
      return json({ id, title: `title of ${id}`, durationSec: null });
    }
    if (url === `${API}/api/me/releases` && method === 'POST') {
      return json({ id: 'rel-1', title: (body as { title: string }).title });
    }
    if (url === `${API}/api/me/releases/rel-1/artwork/from-url`) {
      return json({ artworkUrl: 'https://cdn.tahti.test/a.jpg' });
    }
    throw new Error(`unexpected ${method} ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return { calls, preparedTitles };
}

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
    const { calls } = stubApis();

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
