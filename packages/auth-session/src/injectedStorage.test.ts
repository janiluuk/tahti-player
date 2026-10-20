import { describe, expect, it, vi } from 'vitest';

import { createInjectedStorage } from './injectedStorage';

describe('createInjectedStorage', () => {
  it('delegates get/set to the host (desktop keychain bridge)', async () => {
    let stored: string | null = 'seed';
    const storage = createInjectedStorage({
      getRefreshToken: () => stored,
      setRefreshToken: (token) => {
        stored = token;
      },
    });
    expect(await storage.getRefreshToken()).toBe('seed');
    await storage.setRefreshToken('next');
    expect(stored).toBe('next');
    await storage.setRefreshToken(null);
    expect(stored).toBeNull();
  });

  it('awaits async host handlers', async () => {
    const getRefreshToken = vi.fn(async () => 'async-token');
    const setRefreshToken = vi.fn(async () => undefined);
    const storage = createInjectedStorage({ getRefreshToken, setRefreshToken });
    expect(await storage.getRefreshToken()).toBe('async-token');
    await storage.setRefreshToken('x');
    expect(setRefreshToken).toHaveBeenCalledWith('x');
  });
});
