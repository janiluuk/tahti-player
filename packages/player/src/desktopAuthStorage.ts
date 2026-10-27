import { commands } from './services/tauri/bindings';
import { unwrapResult } from './services/tauri/results';

export type DesktopAuthStorage = {
  getRefreshToken: () => Promise<string | null>;
  setRefreshToken: (token: string | null) => Promise<void>;
};

type KeychainCommands = Pick<
  typeof commands,
  'authRefreshTokenGet' | 'authRefreshTokenSet'
>;

/** Refresh-token storage in the OS keychain, for tahti-web's auth session.
 * Rejects when the keychain is unavailable so the caller can fall back. */
export function createDesktopAuthStorage(
  keychain: KeychainCommands = commands,
): DesktopAuthStorage {
  return {
    async getRefreshToken() {
      return unwrapResult(await keychain.authRefreshTokenGet());
    },
    async setRefreshToken(token) {
      unwrapResult(await keychain.authRefreshTokenSet(token));
    },
  };
}

export function installDesktopAuthStorage(): void {
  Object.assign(globalThis, {
    __TAHTI_NATIVE_AUTH_STORAGE__: createDesktopAuthStorage(),
  });
}
