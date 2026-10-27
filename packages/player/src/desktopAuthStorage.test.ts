import { describe, expect, it, vi } from 'vitest';

import { createDesktopAuthStorage } from './desktopAuthStorage';

vi.mock('./services/tauri/bindings', () => ({ commands: {} }));

function keychain(overrides: {
  get?: () => Promise<
    { status: 'ok'; data: string | null } | { status: 'error'; error: string }
  >;
  set?: (
    token: string | null,
  ) => Promise<
    { status: 'ok'; data: null } | { status: 'error'; error: string }
  >;
}) {
  return {
    authRefreshTokenGet: vi.fn(
      overrides.get ?? (async () => ({ status: 'ok' as const, data: null })),
    ),
    authRefreshTokenSet: vi.fn(
      overrides.set ?? (async () => ({ status: 'ok' as const, data: null })),
    ),
  };
}

describe('createDesktopAuthStorage', () => {
  it('reads and writes the refresh token through the keychain commands', async () => {
    const commands = keychain({
      get: async () => ({ status: 'ok', data: 'rfr_saved' }),
    });
    const storage = createDesktopAuthStorage(commands);

    expect(await storage.getRefreshToken()).toBe('rfr_saved');
    await storage.setRefreshToken('rfr_next');
    await storage.setRefreshToken(null);

    expect(commands.authRefreshTokenSet).toHaveBeenNthCalledWith(1, 'rfr_next');
    expect(commands.authRefreshTokenSet).toHaveBeenNthCalledWith(2, null);
  });

  it('rejects when the keychain is unavailable so the web app can fall back', async () => {
    const storage = createDesktopAuthStorage(
      keychain({
        get: async () => ({
          status: 'error',
          error: 'No OS keychain is available',
        }),
        set: async () => ({
          status: 'error',
          error: 'The OS keychain is locked or denied access',
        }),
      }),
    );

    await expect(storage.getRefreshToken()).rejects.toThrow(
      'No OS keychain is available',
    );
    await expect(storage.setRefreshToken('rfr_x')).rejects.toThrow(
      'The OS keychain is locked or denied access',
    );
  });
});
