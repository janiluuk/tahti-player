import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import { formatSearchTable, runSearch } from './search.mjs';

const NO_TOKEN = { apiUrl: TEST_CONFIG.apiUrl, token: null };

function track(index: number, extra: Record<string, unknown> = {}) {
  return {
    id: `snd_${index}`,
    title: `Track ${index}`,
    durationSec: 60 + index,
    artistName: 'DJ Night',
    channelSlug: 'djnight',
    ...extra,
  };
}

function tracks(count: number) {
  return Array.from({ length: count }, (_, index) => track(index + 1));
}

describe('formatSearchTable', () => {
  it('renders one row per track', () => {
    const lines = formatSearchTable([track(1)]).split('\n');
    expect(lines[0]).toBe('ID     TITLE    ARTIST    DURATION  CHANNEL');
    expect(lines[1]).toBe('snd_1  Track 1  DJ Night  1:01      djnight');
  });

  it('falls back to the channel username, never an email, as the artist', () => {
    const output = formatSearchTable([
      track(1, { artistName: 'someone@example.test', channelSlug: 'someone' }),
      track(2, { artistName: '  ', channelSlug: 'blank' }),
    ]);
    expect(output).not.toContain('@');
    const lines = output.split('\n');
    expect(lines[1]).toMatch(/Track 1\s+someone\s/);
    expect(lines[2]).toMatch(/Track 2\s+blank\s/);
  });
});

describe('runSearch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls the public search route without a token', async () => {
    const fetchMock = mockFetchJson({ tracks: [track(1)], hasMore: false });
    const output = await runSearch(NO_TOKEN, 'night drive');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/search/tracks?q=night+drive',
      { headers: { Accept: 'application/json' } },
    );
    expect(output).toContain('Track 1');
  });

  it('never sends a configured token to the public route', async () => {
    const fetchMock = mockFetchJson({ tracks: [], hasMore: false });
    await runSearch(TEST_CONFIG, 'x');
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).not.toHaveProperty('Authorization');
  });

  it('maps --page and --limit to an offset and trims the page', async () => {
    const fetchMock = mockFetchJson({ tracks: tracks(20), hasMore: true });
    const output = await runSearch(NO_TOKEN, 'x', { page: '3', limit: '5' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/search/tracks?q=x&offset=10',
      expect.anything(),
    );
    expect(output.split('\n')).toHaveLength(1 + 5 + 2);
    expect(output).toContain('Showing 11-15. Use --page 4 to see more.');
  });

  it('shows a more hint when the API page is larger than --limit', async () => {
    mockFetchJson({ tracks: tracks(6), hasMore: false });
    const output = await runSearch(NO_TOKEN, 'x', { limit: '5' });
    expect(output).toContain('Showing 1-5. Use --page 2 to see more.');
  });

  it('omits the hint on the last page', async () => {
    mockFetchJson({ tracks: tracks(3), hasMore: false });
    const output = await runSearch(NO_TOKEN, 'x');
    expect(output).not.toContain('Showing');
  });

  it('reports empty results', async () => {
    mockFetchJson({ tracks: [], hasMore: false });
    expect(await runSearch(NO_TOKEN, 'zzz')).toBe('No tracks found.');
    expect(await runSearch(NO_TOKEN, 'zzz', { page: '2' })).toBe(
      'No more tracks on page 2.',
    );
  });

  it('prints the API response unchanged with --json', async () => {
    const body = { tracks: tracks(20), hasMore: true };
    mockFetchJson(body);
    const output = await runSearch(NO_TOKEN, 'x', { json: true, limit: '2' });
    expect(JSON.parse(output)).toEqual(body);
  });

  it('rejects bad input without calling the API', async () => {
    const fetchMock = mockFetchJson({ tracks: [], hasMore: false });
    await expect(runSearch(NO_TOKEN, '  ')).rejects.toThrow(
      'Missing search query',
    );
    await expect(runSearch(NO_TOKEN, 'a'.repeat(101))).rejects.toThrow(
      /too long/,
    );
    await expect(runSearch(NO_TOKEN, 'x', { limit: '21' })).rejects.toThrow(
      'Invalid --limit "21". Expected 1-20.',
    );
    await expect(runSearch(NO_TOKEN, 'x', { page: '0' })).rejects.toThrow(
      /Invalid --page/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the API message for a 400', async () => {
    mockFetchJson({ error: 'Invalid query' }, 400);
    await expect(runSearch(NO_TOKEN, 'x')).rejects.toThrow(
      'Invalid query (HTTP 400)',
    );
  });

  it('names the API URL on network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    );
    await expect(runSearch(NO_TOKEN, 'x')).rejects.toThrow(
      'Could not reach the Tahti API at https://api.example.test: ECONNREFUSED',
    );
  });
});
