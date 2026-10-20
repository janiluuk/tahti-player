import type { AuthSessionStorage } from './types';

export function createInjectedStorage(handlers: {
  getRefreshToken: AuthSessionStorage['getRefreshToken'];
  setRefreshToken: AuthSessionStorage['setRefreshToken'];
}): AuthSessionStorage {
  return {
    getRefreshToken: () => handlers.getRefreshToken(),
    setRefreshToken: (token) => handlers.setRefreshToken(token),
  };
}
