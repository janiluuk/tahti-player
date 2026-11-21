import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearGetCache } from './getCache';
import {
  fetchOAuthAccounts,
  fetchOAuthProviders,
  oauthErrorCode,
  oauthStartUrl,
  unlinkOAuthAccount,
} from './oauth';

function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('oauth api', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '0');
    vi.stubEnv('VITE_ALLOW_MOCK_FALLBACK', '0');
    vi.stubEnv('VITE_TAHTI_API_URL', '');
    clearGetCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('builds the start URL with an encoded returnTo', () => {
    expect(oauthStartUrl('google', { returnTo: '/release/a b?t=1&x=ä' })).toBe(
      '/tahti-api/api/auth/oauth/google/start?returnTo=%2Frelease%2Fa+b%3Ft%3D1%26x%3D%C3%A4',
    );
  });

  it('adds link=1 when linking while signed in', () => {
    expect(
      oauthStartUrl('facebook', { returnTo: '/settings/security', link: true }),
    ).toBe(
      '/tahti-api/api/auth/oauth/facebook/start?returnTo=%2Fsettings%2Fsecurity&link=1',
    );
  });

  it('keeps returnTo on this site', () => {
    expect(oauthStartUrl('google', { returnTo: '//evil.example' })).toBe(
      '/tahti-api/api/auth/oauth/google/start?returnTo=%2F',
    );
    expect(oauthStartUrl('google', { returnTo: 'https://evil.example' })).toBe(
      '/tahti-api/api/auth/oauth/google/start?returnTo=%2F',
    );
  });

  it('uses the absolute API URL when one is configured', () => {
    vi.stubEnv('VITE_TAHTI_API_URL', 'https://api.tahti.live/');
    expect(oauthStartUrl('google', { returnTo: '/' })).toBe(
      'https://api.tahti.live/api/auth/oauth/google/start?returnTo=%2F',
    );
  });

  it('goes straight back with oauth=ok in mock mode', () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    expect(oauthStartUrl('google', { returnTo: '/feed' })).toBe(
      '/feed?oauth=ok',
    );
    expect(oauthStartUrl('google', { returnTo: '/feed?a=1' })).toBe(
      '/feed?a=1&oauth=ok',
    );
  });

  it('lists only known providers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(200, { providers: ['google', 'github', 'facebook'] }),
      ),
    );
    const { data } = await fetchOAuthProviders();
    expect(data).toEqual(['google', 'facebook']);
  });

  it('returns no providers when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(500, { error: 'down' })),
    );
    const { data, meta } = await fetchOAuthProviders();
    expect(data).toEqual([]);
    expect(meta.reason).toBeTruthy();
  });

  it('reads linked accounts', async () => {
    const accounts = [
      { provider: 'google', email: 'a@gmail.com', linkedAt: '2026-01-01' },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(200, { accounts })),
    );
    const { data } = await fetchOAuthAccounts();
    expect(data).toEqual(accounts);
  });

  it('passes the 409 message when the last login cannot be removed', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(409, { error: 'Set a password before disconnecting.' }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const result = await unlinkOAuthAccount('google');
    expect(result).toEqual({
      ok: false,
      error: 'Set a password before disconnecting.',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/tahti-api/api/me/oauth-accounts/google',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('treats unknown error codes as failed', () => {
    expect(oauthErrorCode('email_in_use')).toBe('email_in_use');
    expect(oauthErrorCode('something_new')).toBe('failed');
  });
});
