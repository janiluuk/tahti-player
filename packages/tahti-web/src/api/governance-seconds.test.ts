import { afterEach, describe, expect, it, vi } from 'vitest';

import { secondMotion, withdrawMotionSecond } from './governance-seconds';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('motion seconds', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('posts a second without a body and returns the new count', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ok: true, secondCount: 3 }, 201));
    vi.stubGlobal('fetch', fetchMock);

    await expect(secondMotion('m 1')).resolves.toEqual({
      ok: true,
      secondCount: 3,
    });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain('/api/v1/governance/motions/m%201/second');
    expect(init.method).toBe('POST');
    expect(init.body).toBeUndefined();
  });

  it('withdraws a second with DELETE', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ok: true, secondCount: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(withdrawMotionSecond('m1')).resolves.toEqual({
      ok: true,
      secondCount: 0,
    });
    expect(fetchMock.mock.calls[0]![1].method).toBe('DELETE');
  });

  it("passes on the API's reason when a second is refused", async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ error: 'You cannot second your own motion' }, 409),
        ),
    );

    await expect(secondMotion('m1')).resolves.toEqual({
      ok: false,
      error: 'You cannot second your own motion',
    });
  });

  it('counts a second on a draft in the mock app', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');

    const first = await secondMotion('motion-5');
    expect(first).toEqual({ ok: true, secondCount: 2 });
    await expect(withdrawMotionSecond('motion-5')).resolves.toEqual({
      ok: true,
      secondCount: 1,
    });
    await expect(secondMotion('motion-2')).resolves.toEqual({
      ok: false,
      error: 'Only a draft motion can be seconded',
    });
  });
});
