import { afterEach, describe, expect, it, vi } from 'vitest';

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
});
