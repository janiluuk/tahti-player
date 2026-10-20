import type { AuthSessionStorage } from './types';

export function createMemoryStorage(
  initial: string | null = null,
): AuthSessionStorage {
  let value = initial;
  return {
    getRefreshToken: () => value,
    setRefreshToken: (token) => {
      value = token;
    },
  };
}

export function createBrowserCookieStorage(): AuthSessionStorage {
  return {
    getRefreshToken: () => null,
    setRefreshToken: () => undefined,
  };
}
