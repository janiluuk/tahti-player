/** Refresh-token storage the desktop app provides (OS keychain). Both
 * methods reject when the keychain cannot be used. */
export type NativeAuthStorage = {
  getRefreshToken: () => Promise<string | null>;
  setRefreshToken: (token: string | null) => Promise<void>;
};

declare global {
  var __TAHTI_NATIVE_AUTH_STORAGE__: NativeAuthStorage | undefined;
}

export function getNativeAuthStorage(): NativeAuthStorage | null {
  return globalThis.__TAHTI_NATIVE_AUTH_STORAGE__ ?? null;
}
