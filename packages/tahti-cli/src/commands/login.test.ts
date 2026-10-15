import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveConfig } from '../api-client.mjs';
import { readSavedConfig } from '../config-file.mjs';
import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import { readToken, runLogin, runLogout } from './login.mjs';

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
    expect(resolveConfig(env)).toEqual({
      apiUrl: 'http://localhost:4000',
      token: 'tahti_abc',
    });
    expect(resolveConfig({ ...env, TAHTI_API_TOKEN: 'tahti_env' }).token).toBe(
      'tahti_env',
    );
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
      'still works until you revoke it',
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
