import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveConfig } from '../api-client.mjs';
import { readSavedConfig } from '../config-file.mjs';
import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import { readToken, runDeviceLogin, runLogin, runLogout } from './login.mjs';

const USER = { username: 'aurora', displayName: 'Aurora' };

describe('login and logout', () => {
  let home: string;
  let env: Record<string, string>;

  beforeEach(async () => {
    home = await mkdtemp(join(tmpdir(), 'tahti-login-'));
    env = { XDG_CONFIG_HOME: home };
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await rm(home, { recursive: true, force: true });
  });

  it('checks the token, then saves it readable only by you', async () => {
    const fetchMock = mockFetchJson(USER);
    const output = await runLogin(TEST_CONFIG, {
      token: ' tahti_abc ',
      env,
    });
    const path = join(home, 'tahti', 'config.json');
    expect(output).toBe(
      `Signed in as Aurora (@aurora). Token saved to ${path}.`,
    );
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      'Bearer tahti_abc',
    );
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual({
      token: 'tahti_abc',
    });
    expect((await stat(path)).mode & 0o777).toBe(0o600);
    expect(resolveConfig(env).token).toBe('tahti_abc');
  });

  it('keeps an API URL override and lets the environment win', async () => {
    mockFetchJson(USER);
    const output = await runLogin(
      { apiUrl: 'http://localhost:4000', token: null },
      {
        read: async () => 'tahti_abc',
        env: {
          ...env,
          TAHTI_API_URL: 'http://localhost:4000',
          TAHTI_API_TOKEN: 'tahti_env',
        },
      },
    );
    expect(output).toContain('still wins over the saved token');
    expect(readSavedConfig(env)).toEqual({
      token: 'tahti_abc',
      apiUrl: 'http://localhost:4000',
    });
    expect(resolveConfig(env)).toMatchObject({
      apiUrl: 'http://localhost:4000',
      token: 'tahti_abc',
      refreshToken: null,
    });
    expect(resolveConfig({ ...env, TAHTI_API_TOKEN: 'tahti_env' }).token).toBe(
      'tahti_env',
    );
  });

  it('device login saves access and refresh tokens at mode 0600', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        accessToken: 'jwt-access',
        refreshToken: 'jwt-refresh',
        expiresIn: 900,
        user: USER,
      }),
    });
    const output = await runDeviceLogin(TEST_CONFIG, {
      email: 'aurora@example.com',
      password: 'secret',
      env,
      fetchImpl: fetchMock,
      deviceLabel: 'test-cli',
    });
    const path = join(home, 'tahti', 'config.json');
    expect(output).toBe(
      `Signed in as Aurora (@aurora) (device session). Credentials saved to ${path}.`,
    );
    expect(fetchMock.mock.calls[0][0]).toBe(
      `${TEST_CONFIG.apiUrl}/api/auth/login`,
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      email: 'aurora@example.com',
      password: 'secret',
      deviceLabel: 'test-cli',
    });
    const saved = JSON.parse(await readFile(path, 'utf8'));
    expect(saved.accessToken).toBe('jwt-access');
    expect(saved.refreshToken).toBe('jwt-refresh');
    expect(saved.expiresAt).toBeGreaterThan(Date.now());
    expect((await stat(path)).mode & 0o777).toBe(0o600);
    expect(resolveConfig(env).token).toBe('jwt-access');
    expect(resolveConfig(env).refreshToken).toBe('jwt-refresh');
  });

  it('device login rejects TOTP challenges', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ requiresTotp: true, challengeId: 'c1' }),
    });
    await expect(
      runDeviceLogin(TEST_CONFIG, {
        email: 'a@b.c',
        password: 'x',
        env,
        fetchImpl: fetchMock,
      }),
    ).rejects.toThrow(/TOTP/);
    expect(readSavedConfig(env)).toEqual({});
  });

  it('saves nothing when the API rejects the token', async () => {
    mockFetchJson({ error: 'Invalid or expired API token' }, 401);
    await expect(
      runLogin(TEST_CONFIG, { token: 'tahti_bad', env }),
    ).rejects.toThrow('Token invalid or missing scope');
    expect(readSavedConfig(env)).toEqual({});
  });

  it('rejects an empty or foreign token before calling the API', async () => {
    await expect(
      runLogin(TEST_CONFIG, { read: async () => '', env }),
    ).rejects.toThrow('No token given');
    await expect(
      runLogin(TEST_CONFIG, { token: 'ghp_123', env }),
    ).rejects.toThrow('start with tahti_');
  });

  it('logout removes the saved token', async () => {
    mockFetchJson(USER);
    await runLogin(TEST_CONFIG, { token: 'tahti_abc', env });
    expect(await runLogout({ env })).toContain(
      'still work until you revoke them',
    );
    expect(readSavedConfig(env)).toEqual({});
    expect(await runLogout({ env: {} })).toBe('No saved token.');
  });

  it('reads a piped token from stdin', async () => {
    const stdin = Object.assign(Readable.from(['tahti_piped\n']), {
      isTTY: false,
    });
    expect(await readToken({ stdin } as never)).toBe('tahti_piped');
  });
});
