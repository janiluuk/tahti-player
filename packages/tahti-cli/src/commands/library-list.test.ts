import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchLibrarySounds,
  formatDuration,
  formatLibraryTable,
  runLibraryList,
} from './library-list.mjs';

describe('formatDuration', () => {
  it('formats seconds as m:ss', () => {
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(5)).toBe('0:05');
    expect(formatDuration(600)).toBe('10:00');
  });

  it('falls back to a placeholder when duration is unknown', () => {
    expect(formatDuration(null)).toBe('--:--');
    expect(formatDuration(undefined)).toBe('--:--');
    expect(formatDuration(Number.NaN)).toBe('--:--');
  });
});

describe('formatLibraryTable', () => {
  it('renders an aligned header + rows table', () => {
    const table = formatLibraryTable([
      { id: 'a1', title: 'Short', status: 'READY', durationSec: 61 },
      {
        id: 'b2',
        title: 'A much longer title',
        status: 'PROCESSING',
        durationSec: null,
      },
    ]);
    const lines = table.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('ID  TITLE                STATUS      DURATION');
    expect(lines[1]).toContain('Short');
    expect(lines[1]).toContain('1:01');
    expect(lines[2]).toContain('A much longer title');
    expect(lines[2]).toContain('--:--');
  });
});

describe('fetchLibrarySounds', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls GET /api/me/sound with the bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'a1', title: 'Track', status: 'READY' }],
    });
    vi.stubGlobal('fetch', fetchMock);

    const sounds = await fetchLibrarySounds({
      apiUrl: 'https://api.example.test',
      token: 'tahti_test',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/me/sound',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer tahti_test',
        }),
      }),
    );
    expect(sounds).toEqual([{ id: 'a1', title: 'Track', status: 'READY' }]);
  });

  it('rejects with a clear error when no token is configured', async () => {
    await expect(
      fetchLibrarySounds({ apiUrl: 'https://api.example.test', token: null }),
    ).rejects.toThrow(/TAHTI_API_TOKEN/);
  });
});

describe('runLibraryList', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('prints a friendly message for an empty library', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => [] }),
    );
    const output = await runLibraryList({
      apiUrl: 'https://api.example.test',
      token: 'tahti_test',
    });
    expect(output).toBe('No library items yet.');
  });

  it('returns JSON when --json is requested', async () => {
    const sounds = [{ id: 'a1', title: 'Track', status: 'READY' }];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => sounds }),
    );
    const output = await runLibraryList(
      { apiUrl: 'https://api.example.test', token: 'tahti_test' },
      { json: true },
    );
    expect(JSON.parse(output)).toEqual(sounds);
  });
});
