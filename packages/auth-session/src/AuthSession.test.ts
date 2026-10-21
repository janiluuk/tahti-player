import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthSession } from './AuthSession';
import { createMemoryStorage } from './storage';

describe('AuthSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('single-flights parallel refresh calls', async () => {
    let calls = 0;
    const fetchMock = vi.fn(async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 20));
      return new Response(
        JSON.stringify({
          accessToken: 'a2',
          expiresIn: 900,
          refreshToken: 'r2',
        }),
        { status: 200 },
      );
    });
    const session = new AuthSession({
      apiBase: 'https://api.test',
      storage: createMemoryStorage('r1'),
      fetch: fetchMock as unknown as typeof fetch,
      now: () => Date.now(),
    });
    await session.setFromLogin({
      accessToken: 'a1',
      expiresIn: 1,
      refreshToken: 'r1',
    });
    const p1 = session.refresh();
    const p2 = session.refresh();
    await vi.advanceTimersByTimeAsync(25);
    const [t1, t2] = await Promise.all([p1, p2]);
    expect(t1).toBe('a2');
    expect(t2).toBe('a2');
    expect(calls).toBe(1);
  });

  it('retries once after 401 when refresh succeeds', async () => {
    let n = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/auth/token/refresh')) {
        return new Response(
          JSON.stringify({ accessToken: 'a2', expiresIn: 900 }),
          { status: 200 },
        );
      }
      n += 1;
      if (n === 1) {
        return new Response('nope', { status: 401 });
      }
      return new Response('ok', { status: 200 });
    });
    const session = new AuthSession({
      apiBase: 'https://api.test',
      storage: createMemoryStorage('r1'),
      fetch: fetchMock as unknown as typeof fetch,
    });
    await session.setFromLogin({
      accessToken: 'a1',
      expiresIn: 900,
      refreshToken: 'r1',
    });
    const res = await session.fetchWithAuth('https://api.test/api/auth/me');
    expect(res.status).toBe(200);
    expect(session.getAccessToken()).toBe('a2');
  });

  it('does not refresh when signed out', async () => {
    const fetchMock = vi.fn(async () => new Response('nope', { status: 401 }));
    const session = new AuthSession({
      apiBase: 'https://api.test',
      storage: createMemoryStorage(null),
      fetch: fetchMock as unknown as typeof fetch,
    });
    const res = await session.fetchWithAuth('https://api.test/api/v1/search');
    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]![0])).toContain('/api/v1/search');
  });

  it('signs out when refresh returns 401', async () => {
    const fetchMock = vi.fn(async () => new Response('nope', { status: 401 }));
    const storage = createMemoryStorage('r1');
    const session = new AuthSession({
      apiBase: 'https://api.test',
      storage,
      fetch: fetchMock as unknown as typeof fetch,
    });
    await session.setFromLogin({
      accessToken: 'a1',
      expiresIn: 900,
      refreshToken: 'r1',
    });
    const events: string[] = [];
    session.onChange((s) => events.push(s.status));
    const token = await session.refresh();
    expect(token).toBeNull();
    expect(session.getState().status).toBe('signed-out');
    expect(await storage.getRefreshToken()).toBeNull();
    expect(events).toContain('signed-out');
  });

  it('keeps state on network errors', async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    const session = new AuthSession({
      apiBase: 'https://api.test',
      storage: createMemoryStorage('r1'),
      fetch: fetchMock as unknown as typeof fetch,
    });
    await session.setFromLogin({
      accessToken: 'a1',
      expiresIn: 900,
      refreshToken: 'r1',
    });
    const token = await session.refresh();
    expect(token).toBeNull();
    expect(session.getState().status).toBe('signed-in');
    expect(session.getAccessToken()).toBe('a1');
  });

  it('proactively refreshes near expiry', async () => {
    let now = 1_000_000;
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ accessToken: 'a2', expiresIn: 900 }), {
          status: 200,
        }),
    );
    const session = new AuthSession({
      apiBase: 'https://api.test',
      storage: createMemoryStorage('r1'),
      fetch: fetchMock as unknown as typeof fetch,
      now: () => now,
      accessTokenTtlSkewSec: 60,
    });
    await session.setFromLogin({
      accessToken: 'a1',
      expiresIn: 90,
      refreshToken: 'r1',
    });
    session.start();
    now = 1_000_000 + 30_000;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetchMock).toHaveBeenCalled();
    expect(session.getAccessToken()).toBe('a2');
    session.stop();
  });
});
