import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import {
  formatReleaseDetails,
  formatTracklist,
  runReleasesShow,
} from './releases-show.mjs';

const RELEASE = {
  id: 'rel_1',
  title: 'First EP',
  type: 'EP',
  state: 'DRAFT',
  releaseDate: '2026-05-01T00:00:00.000Z',
  genre: 'ELECTRONIC',
  genreCustom: null,
  upc: null,
  labelImprint: 'Self-released',
  smartLinkSlug: 'artist-first-ep',
  smartLinkViewCount: 12,
  artistName: 'artist@example.test',
  tracks: [
    {
      id: 't1',
      position: 1,
      title: 'Opener',
      isrc: 'FIXXX2600001',
      status: 'READY',
      durationSec: 201,
      audioUrl: 'https://minio.example.test/signed?X-Amz-Signature=secret',
    },
    {
      id: 't2',
      position: 2,
      title: 'Closer',
      isrc: null,
      status: 'PENDING',
      durationSec: null,
      audioUrl: null,
    },
  ],
  _count: { tracks: 2 },
  checklist: [
    { id: 'metadata', label: 'Metadata', done: true },
    { id: 'identifiers', label: 'UPC / ISRC', done: false },
    { id: 'published', label: 'Published', done: false },
  ],
};

describe('formatReleaseDetails', () => {
  it('renders a key/value view with the checklist summary', () => {
    const output = formatReleaseDetails(RELEASE);
    expect(output).toContain('TITLE         First EP');
    expect(output).toContain('RELEASE DATE  2026-05-01');
    expect(output).toContain('UPC           -');
    expect(output).toContain('LINK VIEWS    12');
    expect(output).toContain(
      'CHECKLIST     1/3 done (open: UPC / ISRC, Published)',
    );
    expect(output).toContain('TRACKS        2');
  });
});

describe('formatTracklist', () => {
  it('renders one row per track in position order', () => {
    const lines = formatTracklist(RELEASE.tracks).split('\n');
    expect(lines[0]).toBe('#  TITLE   DURATION  STATUS   ISRC');
    expect(lines[1]).toBe('1  Opener  3:21      READY    FIXXX2600001');
    expect(lines[2]).toBe('2  Closer  --:--     PENDING  -');
  });
});

describe('runReleasesShow', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls GET /api/me/releases/:id with an encoded id and the token', async () => {
    const fetchMock = mockFetchJson(RELEASE);
    await runReleasesShow(TEST_CONFIG, 'a/b');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/me/releases/a%2Fb',
      {
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer tahti_test',
        },
      },
    );
  });

  it('prints details and tracklist without emails or signed audio URLs', async () => {
    mockFetchJson(RELEASE);
    const output = await runReleasesShow(TEST_CONFIG, 'rel_1');
    expect(output).toContain('First EP');
    expect(output).toContain('Opener');
    expect(output).not.toContain('@');
    expect(output).not.toContain('X-Amz-Signature');
  });

  it('says so when the release has no tracks', async () => {
    mockFetchJson({ ...RELEASE, tracks: [], _count: { tracks: 0 } });
    const output = await runReleasesShow(TEST_CONFIG, 'rel_1');
    expect(output).toMatch(/No tracks yet\.$/);
  });

  it('prints the API response unchanged with --json', async () => {
    mockFetchJson(RELEASE);
    const output = await runReleasesShow(TEST_CONFIG, 'rel_1', { json: true });
    expect(JSON.parse(output)).toEqual(RELEASE);
  });

  it('requires an id', async () => {
    const fetchMock = mockFetchJson(RELEASE);
    await expect(runReleasesShow(TEST_CONFIG, undefined)).rejects.toThrow(
      'Missing release id',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the API message on 404', async () => {
    mockFetchJson({ error: 'Release not found' }, 404);
    await expect(runReleasesShow(TEST_CONFIG, 'nope')).rejects.toThrow(
      /^Release not found$/,
    );
  });

  it('reports a missing scope on 403', async () => {
    mockFetchJson({ error: 'Forbidden' }, 403);
    await expect(runReleasesShow(TEST_CONFIG, 'rel_1')).rejects.toThrow(
      'Token invalid or missing scope (Forbidden): this token is not allowed to access /api/me/releases/rel_1.',
    );
  });
});
