import { afterEach, describe, expect, it, vi } from 'vitest';

import { TEST_CONFIG } from '../test-helpers';
import { formatStats, runStats } from './stats.mjs';

const SUMMARY = {
  playsToday: 3,
  playsTotal: 120,
  downloadsToday: 1,
  downloadsTotal: 40,
  followerCount: 12,
};
const TOP = {
  items: [
    { soundId: 's_1', title: 'Night Drive', plays: 80 },
    { soundId: 's_2', title: 'Harbour', plays: 40 },
  ],
};

function mockStats(top: unknown = TOP) {
  const fetchMock = vi.fn(async (url: string) => ({
    ok: true,
    status: 200,
    json: async () => (url.includes('/summary') ? SUMMARY : top),
  }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('formatStats', () => {
  it('prints the counters and the top tracks', () => {
    const output = formatStats({ summary: SUMMARY, topTracks: TOP }, '30');
    expect(output).toContain('Plays total      120');
    expect(output).toContain('Followers        12');
    expect(output).toContain('Top tracks (last 30 days):');
    expect(output).toContain('1  Night Drive  80     s_1');
  });

  it('says when no track has plays yet', () => {
    expect(
      formatStats({ summary: SUMMARY, topTracks: { items: [] } }, 'all'),
    ).toContain('No track plays yet (all time).');
  });
});

describe('runStats', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls the summary and top-tracks routes with the range', async () => {
    const fetchMock = mockStats();
    await runStats(TEST_CONFIG, { range: '7' });
    const urls = fetchMock.mock.calls.map((call) => call[0]);
    expect(urls).toEqual([
      'https://api.example.test/api/me/stats/summary',
      'https://api.example.test/api/me/stats/top-tracks?range=7',
    ]);
  });

  it('defaults to all time', async () => {
    const fetchMock = mockStats();
    expect(await runStats(TEST_CONFIG)).toContain('Top tracks (all time):');
    expect(fetchMock.mock.calls[1][0]).toContain('range=all');
  });

  it('rejects an unknown range before calling the API', async () => {
    const fetchMock = mockStats();
    await expect(runStats(TEST_CONFIG, { range: '90' })).rejects.toThrow(
      'Expected one of: 1, 7, 30, all',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('prints both responses with --json', async () => {
    mockStats();
    expect(JSON.parse(await runStats(TEST_CONFIG, { json: true }))).toEqual({
      summary: SUMMARY,
      topTracks: TOP,
    });
  });
});
