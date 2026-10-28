import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import { runTrack } from './track.mjs';

const TRACK = {
  id: 's1',
  title: 'Moody Electronica vol. 40',
  artistName: null,
  durationSec: 2763,
  genre: 'Progressive House',
  releasedAt: '2026-10-17T12:00:00.000Z',
  playCount: 31,
  likeCount: 3,
  downloadCount: 15,
  commentCount: 2,
  channel: { user: { username: 'yaniho', displayName: 'yaniho@example.com' } },
};

describe('tahti track', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows a track and its public totals from an id or a link', async () => {
    const fetchMock = mockFetchJson(TRACK);
    const output = await runTrack(TEST_CONFIG, 'https://tahti.live/t/s1?x=1');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.example.test/api/v1/tracks/s1',
    );
    expect(output).toContain('Moody Electronica vol. 40');
    expect(output).toContain('yaniho');
    expect(output).not.toContain('@example.com');
    expect(output).toContain('Progressive House');
    expect(output).toMatch(/Plays\s+31/);
    expect(output).toMatch(/Downloads\s+15/);
  });

  it('needs an id', async () => {
    await expect(runTrack(TEST_CONFIG, '')).rejects.toThrow('Give a track id');
  });
});
