import {
  AuthSession,
  createBrowserCookieStorage,
} from '@tahti-player/auth-session';

import { apiBase } from './http';

let session: AuthSession | null = null;

export function getAuthSession(): AuthSession {
  if (!session) {
    session = new AuthSession({
      apiBase: apiBase(),
      storage: createBrowserCookieStorage(),
      cookieRefresh: true,
    });
  }
  return session;
}

export function startAuthSession(): void {
  getAuthSession().start();
}
