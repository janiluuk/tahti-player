import { afterEach, describe, expect, it, runSetLiked, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import { runLikes, runSetLiked } from './likes.mjs';

const LIKES = {
  items: [
    {
      id: 's_9',
      title: 'Night Drive',
      bannerUrl: null,
      audioUrl: 'https://storage.example.test/signed',
      channelSlug: 'aurora',
      artistUsername: 'aurora',
      artistDisplayName: 'aurora@example.com',
      likedAt: '2026-10-13T20:00:00.000Z',
      url: '/channel/aurora',
    },
  ],
};

describe('runLikes', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists loved tracks without signed links or emails', async () => {
    const fetchMock = mockFetchJson(LIKES);
    const output = await runLikes(TEST_CONFIG, { limit: '10' });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.example.test/api/me/likes?limit=10',
    );
    expect(output).toContain('2026-10-13');
    expect(output).toContain('Night Drive');
    expect(output).toContain('s_9');
    expect(output).not.toContain('@example.com');
    expect(output).not.toContain('signed');
  });

  it('says when there are none', async () => {
    mockFetchJson({ items: [] });
    expect(await runLikes(TEST_CONFIG)).toBe(
      'You have not loved any tracks yet.',
    );
  });

  it('rejects a --limit over 100', async () => {
    await expect(runLikes(TEST_CONFIG, { limit: '101' })).rejects.toThrow(
      'Invalid --limit',
    );
  });

  it('loves and unloves a track by channel and id', async () => {
    const fetchMock = mockFetchJson({ liked: true, likeCount: 4 });
    expect(await runSetLiked(TEST_CONFIG, '@yaniho', 's1', true)).toBe(
      'Loved. The track has 4 likes.',
    );
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.example.test/api/v1/c/yaniho/sounds/s1/like');
    expect(init.method).toBe('POST');
    mockFetchJson({ liked: false, likeCount: 1 });
    expect(await runSetLiked(TEST_CONFIG, 'yaniho', 's1', false)).toBe(
      'Unloved. The track has 1 like.',
    );
  });

  it('needs a channel and a track id', async () => {
    await expect(runSetLiked(TEST_CONFIG, 'yaniho', '', true)).rejects.toThrow(
      'Give the channel and the track id',
    );
  });
});
