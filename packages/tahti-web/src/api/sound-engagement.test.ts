import { afterEach, describe, expect, it, vi } from 'vitest';

import { forgetMockLike, rememberMockLike } from './likes';
import { fetchSoundEngagement, setSoundEngagement } from './sound-engagement';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('sound likes', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the count and whether the listener liked it', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(json({ liked: true, likeCount: 7 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchSoundEngagement('like', 'night', 's1')).toEqual({
      active: true,
      count: 7,
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      '/tahti-api/api/v1/c/night/sounds/s1/like',
    );
  });

  it('likes with POST and unlikes with DELETE', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ liked: true, likeCount: 1 }))
      .mockResolvedValueOnce(json({ liked: false, likeCount: 0 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await setSoundEngagement('like', 'night', 's1', true)).toEqual({
      ok: true,
      data: { active: true, count: 1 },
    });
    expect(await setSoundEngagement('like', 'night', 's1', false)).toEqual({
      ok: true,
      data: { active: false, count: 0 },
    });
    expect(fetchMock.mock.calls.map((c) => c[1]?.method)).toEqual([
      'POST',
      'DELETE',
    ]);
  });

  it("returns the API's error", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(json({ error: 'Sound item not found' }, 404)),
    );
    expect(await setSoundEngagement('like', 'night', 'x', true)).toEqual({
      ok: false,
      error: 'Sound item not found',
    });
    expect(await fetchSoundEngagement('like', 'night', 'x')).toBeNull();
  });

  it('reads and toggles reposts through the same module', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ reposted: false, repostCount: 2 }))
      .mockResolvedValueOnce(json({ reposted: true, repostCount: 3 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchSoundEngagement('repost', 'night', 's1')).toEqual({
      active: false,
      count: 2,
    });
    expect(await setSoundEngagement('repost', 'night', 's1', true)).toEqual({
      ok: true,
      data: { active: true, count: 3 },
    });
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      '/tahti-api/api/v1/c/night/sounds/s1/repost',
    );
  });

  it('reports a mock like kept from before a reload as liked', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    localStorage.removeItem('tahti-web:mock-likes');
    rememberMockLike({
      id: 'kept-after-reload',
      title: 'Kept',
      bannerUrl: null,
      audioUrl: null,
      channelSlug: 'night',
      artistUsername: 'night',
      artistDisplayName: 'Night',
      likedAt: '2026-10-01T12:00:00.000Z',
      url: '/t/kept-after-reload',
    });
    expect(
      await fetchSoundEngagement('like', 'night', 'kept-after-reload'),
    ).toEqual({ active: true, count: 1 });
    expect(
      await fetchSoundEngagement('repost', 'night', 'kept-after-reload'),
    ).toEqual({ active: false, count: 0 });
    forgetMockLike('kept-after-reload');
    expect(
      await fetchSoundEngagement('like', 'night', 'kept-after-reload'),
    ).toEqual({ active: false, count: 0 });
    vi.unstubAllEnvs();
  });
});
