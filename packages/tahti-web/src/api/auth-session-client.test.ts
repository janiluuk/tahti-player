import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { NativeAuthStorage } from '../lib/nativeAuthStorage';
import {
  getAuthSession,
  resetAuthSessionForTests,
  startAuthSession,
} from './auth-session-client';
import { fetchAuthMe, loginRequest } from './client-auth';

type Call = { url: string; init?: RequestInit };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function keychain(initial: string | null) {
  let value = initial;
  const storage: NativeAuthStorage & { current: () => string | null } = {
    getRefreshToken: vi.fn(async () => value),
    setRefreshToken: vi.fn(async (token: string | null) => {
      value = token;
    }),
    current: () => value,
  };
  return storage;
}

const user = {
  id: 'u1',
  email: 'artist@tahti.live',
  username: 'artist',
  displayName: 'Artist',
  tier: 'STUDIO',
};

let calls: Call[];

function stubFetch(handler: (url: string, init?: RequestInit) => Response) {
  calls = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, init });
      return handler(url, init);
    }),
  );
}

function header(call: Call | undefined, name: string): string | null {
  return new Headers(call?.init?.headers).get(name);
}

describe('auth session client', () => {
  beforeEach(() => {
    resetAuthSessionForTests();
  });

  afterEach(() => {
    resetAuthSessionForTests();
    vi.unstubAllGlobals();
    delete globalThis.__TAHTI_NATIVE_AUTH_STORAGE__;
  });

  describe('in the desktop app (keychain storage)', () => {
    it('restores the session from the keychain and sends the access token to /me', async () => {
      const storage = keychain('rfr_saved');
      globalThis.__TAHTI_NATIVE_AUTH_STORAGE__ = storage;
      stubFetch((url) =>
        url.endsWith('/api/auth/token/refresh')
          ? json({
              accessToken: 'access-1',
              expiresIn: 900,
              refreshToken: 'rfr_rotated',
            })
          : json(user),
      );

      expect(await startAuthSession()).toBe(true);
      const me = await fetchAuthMe();

      expect(me.data?.username).toBe('artist');
      expect(storage.current()).toBe('rfr_rotated');
      const refreshCall = calls.find((c) => c.url.endsWith('/token/refresh'));
      expect(JSON.parse(String(refreshCall?.init?.body))).toEqual({
        refreshToken: 'rfr_saved',
      });
      const meCall = calls.find((c) => c.url.endsWith('/api/auth/me'));
      expect(header(meCall, 'Authorization')).toBe('Bearer access-1');
    });

    it('clears a rejected refresh token and treats the visitor as signed out', async () => {
      const storage = keychain('rfr_expired');
      globalThis.__TAHTI_NATIVE_AUTH_STORAGE__ = storage;
      stubFetch((url) =>
        url.endsWith('/api/auth/token/refresh')
          ? json({ error: 'Invalid refresh token' }, 401)
          : json({ error: 'Unauthorized' }, 401),
      );

      expect(await startAuthSession()).toBe(false);
      const me = await fetchAuthMe();

      expect(me.data).toBeNull();
      expect(storage.current()).toBeNull();
      const meCall = calls.find((c) => c.url.endsWith('/api/auth/me'));
      expect(header(meCall, 'Authorization')).toBeNull();
    });

    it('asks for the refresh token in the login body and keeps it in the keychain', async () => {
      const storage = keychain(null);
      globalThis.__TAHTI_NATIVE_AUTH_STORAGE__ = storage;
      stubFetch(() =>
        json({
          user,
          accessToken: 'access-1',
          expiresIn: 900,
          refreshToken: 'rfr_login',
        }),
      );

      const result = await loginRequest('artist@tahti.live', 'pw');

      expect(result.ok).toBe(true);
      expect(JSON.parse(String(calls[0]?.init?.body))).toMatchObject({
        refreshTokenDelivery: 'body',
      });
      expect(storage.current()).toBe('rfr_login');
      expect(getAuthSession().getAccessToken()).toBe('access-1');
    });
  });

  describe('in the browser (HttpOnly cookie)', () => {
    it('does not ask for the refresh token in the login body', async () => {
      stubFetch(() => json({ user, accessToken: 'access-1', expiresIn: 900 }));

      await loginRequest('artist@tahti.live', 'pw');

      expect(JSON.parse(String(calls[0]?.init?.body))).not.toHaveProperty(
        'refreshTokenDelivery',
      );
    });

    it('does not call the refresh endpoint on start', async () => {
      stubFetch(() => json(user));
      expect(await startAuthSession()).toBe(false);
      expect(calls).toHaveLength(0);
    });
  });
});
