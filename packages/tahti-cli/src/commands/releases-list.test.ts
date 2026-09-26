import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import { formatReleasesTable, runReleasesList } from './releases-list.mjs';

const RELEASE = {
  id: 'rel_1',
  title: 'First EP',
  type: 'EP',
  state: 'PUBLISHED',
  releaseDate: '2026-05-01T00:00:00.000Z',
  tracks: [{ id: 't1' }, { id: 't2' }],
  _count: { tracks: 2 },
};

function page(releases: unknown[], extra: Record<string, number> = {}) {
  return { page: 1, limit: 100, total: releases.length, releases, ...extra };
}

describe('formatReleasesTable', () => {
  it('renders one row per release with the track count', () => {
    const lines = formatReleasesTable([RELEASE]).split('\n');
    expect(lines[0]).toBe(
      'ID     TITLE     TYPE  STATE      RELEASE DATE  TRACKS',
    );
    expect(lines[1]).toBe('rel_1  First EP  EP    PUBLISHED  2026-05-01    2');
  });
});

describe('runReleasesList', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls GET /api/me/releases with page and limit', async () => {
    const fetchMock = mockFetchJson(page([RELEASE]));
    await runReleasesList(TEST_CONFIG, { page: '2', limit: '10' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/me/releases?page=2&limit=10',
      expect.anything(),
    );
  });

  it('omits the query when no paging flags are given', async () => {
    const fetchMock = mockFetchJson(page([]));
    expect(await runReleasesList(TEST_CONFIG)).toBe('No releases yet.');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/me/releases',
      expect.anything(),
    );
  });

  it('adds a paging hint when more releases exist', async () => {
    mockFetchJson(page([RELEASE], { limit: 1, total: 3 }));
    const output = await runReleasesList(TEST_CONFIG, { limit: '1' });
    expect(output).toContain('Showing 1-1 of 3. Use --page to see more.');
  });

  it('prints the API response unchanged with --json', async () => {
    const body = page([RELEASE]);
    mockFetchJson(body);
    const output = await runReleasesList(TEST_CONFIG, { json: true });
    expect(JSON.parse(output)).toEqual(body);
  });

  it('rejects invalid paging flags without calling the API', async () => {
    const fetchMock = mockFetchJson(page([]));
    await expect(
      runReleasesList(TEST_CONFIG, { limit: '500' }),
    ).rejects.toThrow('Invalid --limit "500". Expected 1-100.');
    await expect(runReleasesList(TEST_CONFIG, { page: '0' })).rejects.toThrow(
      /Invalid --page/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports an invalid token on 401', async () => {
    mockFetchJson({ error: 'Invalid or expired API token' }, 401);
    await expect(runReleasesList(TEST_CONFIG)).rejects.toThrow(
      /Token invalid or missing scope/,
    );
  });
});
