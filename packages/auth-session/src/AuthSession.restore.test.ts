import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthSession } from './AuthSession';
import { createInjectedStorage } from './injectedStorage';
import { createMemoryStorage } from './storage';
import type { AuthSessionState, AuthSessionStorage } from './types';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function tracked(initial: string | null) {
  const inner = createMemoryStorage(initial);
  const storage: AuthSessionStorage & { current: () => string | null } = {
    getRefreshToken: () => inner.getRefreshToken(),
    setRefreshToken: (token) => inner.setRefreshToken(token),
    current: () => inner.getRefreshToken() as string | null,
  };
  return storage;
}

function session(storage: AuthSessionStorage, fetchMock: unknown) {
  return new AuthSession({
    apiBase: 'https://api.test',
    storage,
    fetch: fetchMock as typeof fetch,
  });
}

describe('AuthSession.restore (stored refresh token)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('signs in on cold start and stores the rotated refresh token', async () => {
    const storage = tracked('rfr_saved');
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        expect(JSON.parse(String(init?.body))).toEqual({
          refreshToken: 'rfr_saved',
        });
        return json({
          accessToken: 'a1',
          expiresIn: 900,
          refreshToken: 'rfr_rotated',
        });
      },
    );
    const auth = session(storage, fetchMock);

    expect(await auth.restore()).toBe(true);
    expect(auth.getAccessToken()).toBe('a1');
    expect(storage.current()).toBe('rfr_rotated');
  });

  it('does nothing without a stored token', async () => {
    const fetchMock = vi.fn();
    const auth = session(tracked(null), fetchMock);
    expect(await auth.restore()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(auth.getState()).toEqual({ status: 'signed-out' });
  });

  it('clears an expired or revoked refresh token and stays signed out', async () => {
    const storage = tracked('rfr_expired');
    const states: AuthSessionState['status'][] = [];
    const auth = session(
      storage,
      vi.fn(async () => json({ error: 'Invalid refresh token' }, 401)),
    );
    auth.onChange((state) => states.push(state.status));

    expect(await auth.restore()).toBe(false);
    expect(storage.current()).toBeNull();
    expect(auth.getAccessToken()).toBeNull();
    expect(states).toEqual(['refreshing', 'signed-out']);
  });

  it('keeps the token while offline and retries when the network returns', async () => {
    const win = new EventTarget();
    vi.stubGlobal('window', win);
    const storage = tracked('rfr_saved');
    let online = false;
    const fetchMock = vi.fn(async () => {
      if (!online) {
        throw new TypeError('Failed to fetch');
      }
      return json({ accessToken: 'a1', expiresIn: 900, refreshToken: 'rfr_2' });
    });
    const auth = session(storage, fetchMock);
    auth.start();

    expect(await auth.restore()).toBe(false);
    expect(storage.current()).toBe('rfr_saved');
    expect(auth.getState()).toEqual({ status: 'signed-out' });

    online = true;
    win.dispatchEvent(new Event('online'));
    await vi.waitFor(() => expect(auth.getAccessToken()).toBe('a1'));
    expect(storage.current()).toBe('rfr_2');
    auth.stop();
  });

  it('keeps the token when the server fails, without signing in', async () => {
    const storage = tracked('rfr_saved');
    const auth = session(
      storage,
      vi.fn(async () => json({ error: 'down' }, 503)),
    );
    expect(await auth.restore()).toBe(false);
    expect(storage.current()).toBe('rfr_saved');
    expect(auth.getAccessToken()).toBeNull();
  });

  it('stays signed out without calling the API when the keychain cannot be read', async () => {
    const fetchMock = vi.fn();
    const auth = session(
      createInjectedStorage({
        getRefreshToken: async () => {
          throw new Error('No OS keychain is available');
        },
        setRefreshToken: async () => undefined,
      }),
      fetchMock,
    );
    expect(await auth.restore()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('is a no-op for cookie-refresh clients', async () => {
    const fetchMock = vi.fn();
    const auth = new AuthSession({
      apiBase: 'https://api.test',
      storage: createMemoryStorage(),
      cookieRefresh: true,
      fetch: fetchMock as unknown as typeof fetch,
    });
    expect(await auth.restore()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('AuthSession expiry with a stored refresh token', () => {
  it('signs out once, clears the token and returns the 401 when refresh is rejected', async () => {
    const storage = tracked('rfr_1');
    const fetchMock = vi.fn(async (input: RequestInfo | URL) =>
      String(input).includes('/token/refresh')
        ? json({ error: 'Refresh token reuse detected' }, 401)
        : json({ error: 'expired' }, 401),
    );
    const auth = session(storage, fetchMock);
    await auth.setFromLogin({
      accessToken: 'expired-access',
      expiresIn: 900,
      refreshToken: 'rfr_1',
    });
    const signedOut = vi.fn();
    auth.onChange((state) => {
      if (state.status === 'signed-out') {
        signedOut();
      }
    });

    const res = await auth.fetchWithAuth('https://api.test/api/me');
    expect(res.status).toBe(401);
    expect(signedOut).toHaveBeenCalledTimes(1);
    expect(storage.current()).toBeNull();

    const again = await auth.fetchWithAuth('https://api.test/api/me');
    expect(again.status).toBe(401);
    expect(signedOut).toHaveBeenCalledTimes(1);
    expect(
      fetchMock.mock.calls.filter(([url]) =>
        String(url).includes('/token/refresh'),
      ),
    ).toHaveLength(1);
  });

  it('signs out (fail closed) when the rotated token cannot be saved', async () => {
    const auth = session(
      createInjectedStorage({
        getRefreshToken: async () => 'rfr_1',
        setRefreshToken: async (token) => {
          if (token) {
            throw new Error('The OS keychain is locked or denied access');
          }
        },
      }),
      vi.fn(async () =>
        json({ accessToken: 'a2', expiresIn: 900, refreshToken: 'rfr_2' }),
      ),
    );
    expect(await auth.refresh()).toBeNull();
    expect(auth.getState()).toEqual({ status: 'signed-out' });
  });
});
