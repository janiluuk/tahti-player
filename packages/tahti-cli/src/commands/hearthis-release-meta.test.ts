import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TEST_CONFIG } from '../test-helpers';
import {
  buildReleasePlan,
  defaultReleaseType,
  fetchHearthisCatalog,
  fetchHearthisTrackCatalog,
  mapHearthisTrack,
  parseHearthisSource,
  releaseCreateBody,
  selectOwnTracks,
  soundMetadataFor,
} from './hearthis-release-meta.mjs';

const fixture = (name: string) =>
  JSON.parse(
    readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'),
  );

describe('parseHearthisSource', () => {
  it('reads Set links, bare Set permalinks and track links', () => {
    expect(
      parseHearthisSource('https://hearthis.at/set/378936-9675121/'),
    ).toEqual({ kind: 'set', permalink: '378936-9675121' });
    expect(parseHearthisSource('378936-9675121')).toEqual({
      kind: 'set',
      permalink: '378936-9675121',
    });
    expect(
      parseHearthisSource('https://hearthis.at/yaniho/night-drive/'),
    ).toEqual({ kind: 'track', user: 'yaniho', track: 'night-drive' });
  });

  it('rejects other hosts and profile links', () => {
    expect(parseHearthisSource('https://example.com/set/1-2/')).toBeNull();
    expect(parseHearthisSource('https://hearthis.at/yaniho/')).toBeNull();
    expect(parseHearthisSource('')).toBeNull();
  });
});

describe('mapHearthisTrack', () => {
  it('maps a recorded hearthis.at track with description, tags and BPM', () => {
    const track = mapHearthisTrack(fixture('hearthis-track.json'), 1);
    expect(track).toMatchObject({
      id: '13068863',
      position: 1,
      userPermalink: 'yaniho',
      durationSec: 2219,
      genre: 'Trance',
      tags: ['Trance'],
      bpm: 126,
      kind: 'DJ-Set',
      downloadable: true,
      downloadFilename:
        'Nightriders vol. 43 - Set of melodic trance, 8.11.2025.wav',
    });
    expect(track.description).toMatch(/^Younger Brother/);
  });

  it('hides the download link of a track that is not downloadable', () => {
    const track = mapHearthisTrack(
      { ...fixture('hearthis-track.json'), downloadable: '0' },
      1,
    );
    expect(track.downloadable).toBe(false);
    expect(track.downloadUrl).toBeNull();
  });
});

describe('fetchHearthisTrackCatalog', () => {
  it('reads one track from the public API as a one-track catalog', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => fixture('hearthis-track.json'),
    });
    const catalog = await fetchHearthisTrackCatalog('yaniho', 'nightriders', {
      fetchImpl,
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api-v2.hearthis.at/yaniho/nightriders/',
    );
    expect(catalog).toMatchObject({
      kind: 'track',
      permalink: 'yaniho-nightriders',
      set: null,
    });
    expect(catalog.tracks).toHaveLength(1);
  });

  it('turns an in-band hearthis.at error into a clear message', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'error', message: 'Content Gone' }),
    });
    await expect(
      fetchHearthisTrackCatalog('yaniho', 'gone', { fetchImpl }),
    ).rejects.toThrow(/no track at .*\(Content Gone\)/);
  });
});

describe('fetchHearthisCatalog', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads a Set through the Tahti API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => fixture('tahti-hearthis-set-tracks.json'),
    });
    vi.stubGlobal('fetch', fetchMock);
    const catalog = await fetchHearthisCatalog(
      TEST_CONFIG,
      'https://hearthis.at/set/378936-9675121/',
    );
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.example.test/api/v1/imports/hearthis/sets/378936-9675121/tracks',
    );
    expect(catalog.kind).toBe('set');
    expect(catalog.tracks).toHaveLength(3);
  });

  it('rejects input that is neither a Set nor a track', async () => {
    await expect(
      fetchHearthisCatalog(TEST_CONFIG, 'https://example.com/x/'),
    ).rejects.toThrow(/Not a hearthis.at Set or track/);
  });
});

describe('buildReleasePlan', () => {
  const setCatalog = () => ({
    kind: 'set',
    ...fixture('tahti-hearthis-set-tracks.json'),
  });

  it('maps a recorded Set to release metadata in Set order', () => {
    const plan = buildReleasePlan(setCatalog());
    expect(plan).toMatchObject({
      title: 'Recorded sets from gigs',
      type: 'EP',
      releaseDate: '2023-04-10',
      description: 'Recordings of past sets 2001-2026',
      genre: 'Trance',
      excludedOthers: 0,
    });
    expect(plan.coverUrl).toContain('w1000_h1000');
    expect(plan.tracks.map((track) => track.position)).toEqual([1, 2, 3]);
    expect(releaseCreateBody(plan)).toEqual({
      title: 'Recorded sets from gigs',
      type: 'EP',
      releaseDate: '2023-04-10',
      description: 'Recordings of past sets 2001-2026',
      genre: 'Trance',
    });
  });

  it("leaves out tracks by other accounts and numbers the owner's tracks", () => {
    const catalog = setCatalog();
    catalog.tracks.splice(1, 0, {
      ...catalog.tracks[0],
      id: 'guest',
      userPermalink: 'guest',
    });
    const plan = buildReleasePlan(catalog, { tracks: '2-3' });
    expect(plan.excludedOthers).toBe(1);
    expect(plan.tracks.map((track) => [track.position, track.id])).toEqual([
      [2, catalog.tracks[2].id],
      [3, catalog.tracks[3].id],
    ]);
  });

  it('takes title, type and date overrides', () => {
    const plan = buildReleasePlan(setCatalog(), {
      title: 'Live Archive',
      type: 'album',
      date: '2026-01-02',
    });
    expect(plan).toMatchObject({
      title: 'Live Archive',
      type: 'ALBUM',
      releaseDate: '2026-01-02',
    });
  });

  it('makes a single track a one-track single with its own description', () => {
    const track = mapHearthisTrack(fixture('hearthis-track.json'), 1);
    const plan = buildReleasePlan({
      kind: 'track',
      permalink: 'yaniho-nightriders',
      url: track.url,
      set: null,
      tracks: [track],
    });
    expect(plan.type).toBe('SINGLE');
    expect(plan.title).toBe(track.title);
    expect(plan.releaseDate).toBe('2025-11-09');
    expect(plan.description).toMatch(/^Younger Brother/);
  });

  it('refuses more tracks than a release holds', () => {
    const catalog = setCatalog();
    catalog.tracks = Array.from({ length: 51 }, (_, index) => ({
      ...catalog.tracks[0],
      id: String(index),
    }));
    expect(() => buildReleasePlan(catalog)).toThrow(/--tracks 1-50/);
  });

  it('rejects a --tracks list that matches nothing', () => {
    expect(() => buildReleasePlan(setCatalog(), { tracks: '9' })).toThrow(
      /matches no track/,
    );
  });
});

describe('defaultReleaseType', () => {
  it('is single, EP or album by track count', () => {
    expect(defaultReleaseType(1)).toBe('SINGLE');
    expect(defaultReleaseType(6)).toBe('EP');
    expect(defaultReleaseType(7)).toBe('ALBUM');
  });
});

describe('soundMetadataFor', () => {
  it('carries genre, tags, BPM, description and the release day', () => {
    const track = mapHearthisTrack(fixture('hearthis-track.json'), 1);
    const metadata = soundMetadataFor(track);
    expect(metadata).toMatchObject({
      genre: 'Trance',
      tags: ['Trance'],
      bpm: 126,
      releasedAt: '2025-11-09T00:00:00.000Z',
    });
    expect(metadata.description.length).toBeLessThanOrEqual(2000);
  });

  it('falls back to the genre as a tag and drops BPM out of range', () => {
    expect(
      soundMetadataFor({
        genre: 'House',
        tags: [],
        bpm: 20,
        releaseDate: null,
      }),
    ).toEqual({ genre: 'House', tags: ['House'] });
  });
});

describe('selectOwnTracks', () => {
  it('plans a track listed twice in a Set only once', () => {
    const track = (id: string) => ({ id, title: id, userPermalink: 'yaniho' });
    const result = selectOwnTracks({
      kind: 'set',
      url: 'https://hearthis.at/set/1/',
      set: { userPermalink: 'yaniho' },
      tracks: [track('a'), track('b'), track('a')],
    });
    expect(result.planned.map((t: { id: string }) => t.id)).toEqual(['a', 'b']);
    expect(
      result.repeated.map((t: { position: number }) => t.position),
    ).toEqual([3]);
  });
});
