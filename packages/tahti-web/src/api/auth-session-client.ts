import {
  AuthSession,
  createBrowserCookieStorage,
  createInjectedStorage,
} from '@tahti-player/auth-session';

import { getNativeAuthStorage } from '../lib/nativeAuthStorage';
import { apiBase } from './http';

let session: AuthSession | null = null;
let restored: Promise<boolean> | null = null;

function createSession(): AuthSession {
  const native = getNativeAuthStorage();
  if (native) {
    return new AuthSession({
      apiBase: apiBase(),
      storage: createInjectedStorage(native),
      cookieRefresh: false,
    });
  }
  return new AuthSession({
    apiBase: apiBase(),
    storage: createBrowserCookieStorage(),
    cookieRefresh: true,
  });
}

export function getAuthSession(): AuthSession {
  if (!session) {
    session = createSession();
  }
  return session;
}

/** True when the refresh token is kept by the desktop app, not in a cookie. */
export function usesNativeAuthStorage(): boolean {
  return getNativeAuthStorage() !== null;
}

export function startAuthSession(): Promise<boolean> {
  const auth = getAuthSession();
  auth.start();
  if (!restored) {
    restored = auth.restore().catch(() => false);
  }
  return restored;
}

/** Resolves once a stored session (desktop) has been restored or given up on. */
export function whenAuthSessionRestored(): Promise<boolean> {
  return restored ?? Promise.resolve(false);
}

export function resetAuthSessionForTests(): void {
  session?.stop();
  session = null;
  restored = null;
}
