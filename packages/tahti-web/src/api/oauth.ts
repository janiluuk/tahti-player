import { requestJson } from './client-request';
import { apiBase } from './http';
import { isForceMock, withMockFallback, type FetchMeta } from './mode';

export const OAUTH_PROVIDERS = ['google', 'facebook'] as const;

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export type OAuthAccount = {
  provider: OAuthProvider;
  email: string | null;
  linkedAt: string;
};

export const OAUTH_ERROR_CODES = [
  'cancelled',
  'email_in_use',
  'already_linked',
  'not_configured',
  'failed',
] as const;

export type OAuthErrorCode = (typeof OAUTH_ERROR_CODES)[number];

export function isOAuthProvider(value: unknown): value is OAuthProvider {
  return (
    typeof value === 'string' &&
    (OAUTH_PROVIDERS as readonly string[]).includes(value)
  );
}

/** Unknown codes read as `failed`, so a new API code still shows a message. */
export function oauthErrorCode(value: string): OAuthErrorCode {
  return (OAUTH_ERROR_CODES as readonly string[]).includes(value)
    ? (value as OAuthErrorCode)
    : 'failed';
}

const MOCK_PROVIDERS: OAuthProvider[] = ['google', 'facebook'];

let mockAccounts: OAuthAccount[] = [
  {
    provider: 'google',
    email: 'demo.listener@gmail.com',
    linkedAt: '2026-10-02T09:30:00.000Z',
  },
];

export function resetOAuthMockForTests(): void {
  mockAccounts = [
    {
      provider: 'google',
      email: 'demo.listener@gmail.com',
      linkedAt: '2026-10-02T09:30:00.000Z',
    },
  ];
}

/** Providers the API has credentials for (`GET /api/auth/oauth/providers`);
 * empty when the request fails. */
export async function fetchOAuthProviders(): Promise<{
  data: OAuthProvider[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [...MOCK_PROVIDERS],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ providers?: unknown }>(
      '/api/auth/oauth/providers',
    );
    const providers = Array.isArray(data?.providers)
      ? data.providers.filter(isOAuthProvider)
      : [];
    return { data: providers, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(
      err,
      () => [...MOCK_PROVIDERS],
      () => [],
    );
  }
}

/** Only same-site relative paths, so the API never redirects off Tahti. */
export function safeReturnTo(returnTo: string | undefined): string {
  if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return '/';
  }
  return returnTo;
}

/** Where the browser goes to start a provider sign-in (a full-page
 * navigation, since the API redirects to the provider). In mock mode it
 * goes straight back as a successful return. */
export function oauthStartUrl(
  provider: OAuthProvider,
  options: { returnTo?: string; link?: boolean } = {},
): string {
  const returnTo = safeReturnTo(options.returnTo);
  if (isForceMock()) {
    return `${returnTo}${returnTo.includes('?') ? '&' : '?'}oauth=ok`;
  }
  const params = new URLSearchParams({ returnTo });
  if (options.link) {
    params.set('link', '1');
  }
  return `${apiBase()}/api/auth/oauth/${provider}/start?${params.toString()}`;
}

/** The signed-in user's linked Google/Facebook logins
 * (`GET /api/me/oauth-accounts`). */
export async function fetchOAuthAccounts(): Promise<{
  data: OAuthAccount[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockAccounts.map((account) => ({ ...account })),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ accounts?: OAuthAccount[] }>(
      '/api/me/oauth-accounts',
    );
    const accounts = Array.isArray(data?.accounts)
      ? data.accounts.filter((account) => isOAuthProvider(account.provider))
      : [];
    return { data: accounts, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(
      err,
      () => mockAccounts.map((account) => ({ ...account })),
      () => [],
    );
  }
}

/** Disconnects a provider (`DELETE /api/me/oauth-accounts/:provider`). The
 * API answers 409 with a message when it is the only way to sign in. */
export async function unlinkOAuthAccount(
  provider: OAuthProvider,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockAccounts = mockAccounts.filter(
      (account) => account.provider !== provider,
    );
    return { ok: true };
  }
  try {
    await requestJson<void>(`/api/me/oauth-accounts/${provider}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not disconnect',
    };
  }
}
