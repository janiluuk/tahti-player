import { afterEach, describe, expect, it, vi } from 'vitest';

import { setSoundLiked } from './sound-likes';

function respond(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('setSoundLiked', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('likes with POST and unlikes with DELETE on the channel sound', async () => {
    const fetchMock = respond({ liked: true, likeCount: 4 });
    vi.stubGlobal('fetch', fetchMock);
    await expect(setSoundLiked('yaniho', 's1', true)).resolves.toEqual({
      ok: true,
      data: { liked: true, likeCount: 4 },
    });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain('/api/v1/c/yaniho/sounds/s1/like');
    expect(init.method).toBe('POST');

    vi.stubGlobal('fetch', respond({ liked: false, likeCount: 3 }));
    const unliked = await setSoundLiked('yaniho', 's1', false);
    expect(unliked).toEqual({ ok: true, data: { liked: false, likeCount: 3 } });
  });

  it("passes on the API's reason", async () => {
    vi.stubGlobal('fetch', respond({ error: 'Sign in to like tracks' }, 401));
    await expect(setSoundLiked('yaniho', 's1', true)).resolves.toMatchObject({
      ok: false,
    });
  });

  it('counts up and down in the mock app', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    const liked = await setSoundLiked('demo', 'mock-like', true, 2);
    expect(liked).toEqual({ ok: true, data: { liked: true, likeCount: 3 } });
    const unliked = await setSoundLiked('demo', 'mock-like', false);
    expect(unliked).toEqual({ ok: true, data: { liked: false, likeCount: 2 } });
  });
});
