import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import { runFeed } from './feed.mjs';

const ARTIST = {
  username: 'aurora',
  displayName: 'aurora@example.com',
  avatarUrl: null,
};

const FEED = {
  followingCount: 3,
  items: [
    {
      kind: 'post',
      id: 'p_1',
      date: '2026-10-14T10:00:00.000Z',
      artist: ARTIST,
      title: 'Tour',
      body: 'Dates are\nout',
    },
    {
      kind: 'track',
      id: 't_1',
      date: '2026-10-13T10:00:00.000Z',
      artist: ARTIST,
      title: 'Night Drive',
      bannerUrl: null,
      channelSlug: 'aurora',
    },
    {
      kind: 'release',
      id: 'r_1',
      date: '2026-10-12T10:00:00.000Z',
      artist: ARTIST,
      title: 'Afterhours',
      releaseType: 'EP',
      artworkUrl: null,
      smartLinkSlug: null,
    },
  ],
};

describe('runFeed', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists posts, tracks and releases', async () => {
    const fetchMock = mockFetchJson(FEED);
    const output = await runFeed(TEST_CONFIG);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.example.test/api/me/feed',
    );
    expect(output).toContain('Tour: Dates are out');
    expect(output).toContain('Night Drive');
    expect(output).toMatch(/ep\s+Afterhours/);
    expect(output).not.toContain('@example.com');
  });

  it('trims to --limit', async () => {
    mockFetchJson(FEED);
    const output = await runFeed(TEST_CONFIG, { limit: '1' });
    expect(output).toContain('Tour');
    expect(output).not.toContain('Night Drive');
  });

  it('explains an empty feed', async () => {
    mockFetchJson({ followingCount: 0, items: [] });
    expect(await runFeed(TEST_CONFIG)).toContain('You do not follow anyone');
    mockFetchJson({ followingCount: 4, items: [] });
    expect(await runFeed(TEST_CONFIG)).toBe(
      'Nothing new from the 4 artists you follow.',
    );
  });
});
