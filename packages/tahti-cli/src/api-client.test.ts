import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  apiGet,
  buildQuery,
  CliError,
  describeHttpError,
  parsePositiveInt,
  refreshAccessToken,
  resolveConfig,
} from './api-client.mjs';
import { writeSavedConfig } from './config-file.mjs';
import { mockFetchJson, TEST_CONFIG } from './test-helpers';

describe('resolveConfig', () => {
  it('defaults the API URL and strips a trailing slash from overrides', () => {
    expect(resolveConfig({}).apiUrl).toBe('https://api.tahti.live');
    expect(
      resolveConfig({ TAHTI_API_URL: 'http://localhost:4000/' }).apiUrl,
    ).toBe('http://localhost:4000');
  });

  it('prefers a personal API token, then a saved access token', () => {
    expect(
      resolveConfig(
        { TAHTI_API_TOKEN: 'tahti_env' },
        { token: 'tahti_saved', accessToken: 'jwt' },
      ).token,
    ).toBe('tahti_env');
    expect(
      resolveConfig({}, { token: 'tahti_saved', accessToken: 'jwt' }).token,
    ).toBe('tahti_saved');
    expect(resolveConfig({}, { accessToken: 'jwt' }).token).toBe('jwt');
    expect(resolveConfig({}, { refreshToken: 'r1' }).refreshToken).toBe('r1');
  });
});

describe('buildQuery', () => {
  it('skips empty values and encodes the rest', () => {
    expect(buildQuery({})).toBe('');
    expect(buildQuery({ sort: undefined, page: 2, q: 'a b' })).toBe(
      '?page=2&q=a+b',
    );
  });
});

describe('describeHttpError', () => {
  it('maps 401 and 403 to a token hint', () => {
    expect(
      describeHttpError(401, '/x', 'Invalid or expired API token'),
    ).toMatch(
      /^Token invalid or missing scope \(Invalid or expired API token\)/,
    );
    expect(describeHttpError(403, '/x', null)).toMatch(
      /^Token invalid or missing scope/,
    );
  });

  it('shows a 403 that is not about the token as the API wrote it', () => {
    expect(
      describeHttpError(403, '/x', 'This account is no longer available'),
    ).toBe('This account is no longer available');
    expect(
      describeHttpError(403, '/x', 'This API token does not have write access'),
    ).toMatch(/^Token invalid or missing scope/);
  });

  it('prefers the API message for 404 and other statuses', () => {
    expect(describeHttpError(404, '/x', 'Sound item not found')).toBe(
      'Sound item not found',
    );
    expect(describeHttpError(404, '/x', null)).toBe('Not found: /x');
    expect(describeHttpError(500, '/x', null)).toBe('/x → HTTP 500');
  });
});

describe('parsePositiveInt', () => {
  it('passes undefined through and enforces the range', () => {
    expect(parsePositiveInt('--page', undefined)).toBeUndefined();
    expect(parsePositiveInt('--page', '7')).toBe(7);
    expect(() => parsePositiveInt('--page', '1.5')).toThrow(
      'Invalid --page "1.5". Expected a positive integer.',
    );
    expect(() => parsePositiveInt('--limit', '21', 20)).toThrow(
      'Invalid --limit "21". Expected 1-20.',
    );
  });
});

describe('apiGet', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects before fetching when no token is configured', async () => {
    const fetchMock = mockFetchJson({});
    await expect(
      apiGet('/api/x', { ...TEST_CONFIG, token: null }),
    ).rejects.toThrow(/TAHTI_API_TOKEN/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips the token check and header for public routes', async () => {
    const fetchMock = mockFetchJson({ ok: true });
    await apiGet('/api/x', { ...TEST_CONFIG, token: null }, { auth: false });
    await apiGet('/api/x', TEST_CONFIG, { auth: false });
    for (const [, init] of fetchMock.mock.calls) {
      expect(init).toEqual({ headers: { Accept: 'application/json' } });
    }
  });

  it('turns a 401 into a token-invalid error', async () => {
    mockFetchJson({ error: 'Invalid or expired API token' }, 401);
    await expect(apiGet('/api/x', TEST_CONFIG)).rejects.toThrow(
      /Token invalid or missing scope/,
    );
  });

  it('refreshes a device session once on 401 then retries', async () => {
    const home = await mkdtemp(join(tmpdir(), 'tahti-refresh-'));
    const env = { XDG_CONFIG_HOME: home };
    writeSavedConfig(env, {
      apiUrl: TEST_CONFIG.apiUrl,
      accessToken: 'old-access',
      refreshToken: 'old-refresh',
      expiresAt: Date.now() - 1000,
    });
    const config = resolveConfig(env);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'expired' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
          expiresIn: 900,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      });
    vi.stubGlobal('fetch', fetchMock);
    await expect(apiGet('/api/x', config)).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe(
      `${config.apiUrl}/api/auth/token/refresh`,
    );
    expect(config.token).toBe('new-access');
    expect(config.refreshToken).toBe('new-refresh');
    const saved = JSON.parse(
      await readFile(join(home, 'tahti', 'config.json'), 'utf8'),
    );
    expect(saved.accessToken).toBe('new-access');
    expect(saved.refreshToken).toBe('new-refresh');
    await rm(home, { recursive: true, force: true });
  });

  it('falls back to the status line when the error body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => {
          throw new SyntaxError('Unexpected token <');
        },
      }),
    );
    await expect(apiGet('/api/x', TEST_CONFIG)).rejects.toThrow(
      '/api/x → HTTP 502',
    );
  });

  it('wraps network failures in a CliError naming the API URL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('fetch failed')),
    );
    const error = await apiGet('/api/x', TEST_CONFIG).catch((e: Error) => e);
    expect(error).toBeInstanceOf(CliError);
    expect(error.message).toBe(
      'Could not reach the Tahti API at https://api.example.test: fetch failed',
    );
  });
});

describe('refreshAccessToken', () => {
  it('returns null when there is no refresh token', async () => {
    expect(
      await refreshAccessToken({ ...TEST_CONFIG, refreshToken: null }),
    ).toBeNull();
  });
});
