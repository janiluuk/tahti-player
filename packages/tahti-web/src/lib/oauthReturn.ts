import type { ParseKeys } from '@tahti-player/i18n';

import {
  isOAuthProvider,
  oauthErrorCode,
  oauthStartUrl,
  type OAuthErrorCode,
  type OAuthProvider,
} from '../api/oauth';

export const OAUTH_ERROR_KEYS: Record<OAuthErrorCode, ParseKeys<'web'>> = {
  cancelled: 'oauthLogin.errorCancelled',
  email_in_use: 'oauthLogin.errorEmailInUse',
  already_linked: 'oauthLogin.errorAlreadyLinked',
  not_configured: 'oauthLogin.errorNotConfigured',
  email_required: 'oauthLogin.errorEmailRequired',
  failed: 'oauthLogin.errorFailed',
};

const PENDING_KEY = 'tahti-oauth-pending';

export type PendingOAuth = { provider: OAuthProvider; link: boolean };

export type OAuthReturn =
  | { kind: 'ok'; search: string }
  | { kind: 'totp'; challengeId: string; search: string }
  | { kind: 'error'; code: OAuthErrorCode; search: string };

/** Reads `?oauth=ok`, `?oauth=totp&challengeId=<id>` or `?oauth_error=<code>`
 * from a location search string.
 * `search` is what stays once those params are removed (with its `?`). */
export function readOAuthReturn(search: string): OAuthReturn | null {
  const params = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  );
  const oauth = params.get('oauth');
  const ok = oauth === 'ok';
  const challengeId = oauth === 'totp' ? params.get('challengeId') : null;
  const error = params.get('oauth_error');
  if (!ok && oauth !== 'totp' && error === null) {
    return null;
  }
  params.delete('oauth');
  params.delete('oauth_error');
  if (oauth === 'totp') {
    params.delete('challengeId');
  }
  const rest = params.toString();
  const remaining = rest ? `?${rest}` : '';
  if (error !== null) {
    return { kind: 'error', code: oauthErrorCode(error), search: remaining };
  }
  if (oauth === 'totp') {
    return challengeId
      ? { kind: 'totp', challengeId, search: remaining }
      : { kind: 'error', code: 'failed', search: remaining };
  }
  return { kind: 'ok', search: remaining };
}

function rememberPending(pending: PendingOAuth): void {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    // Without storage the return toast just leaves out the provider name.
  }
}

/** The provider a sign-in was started with in this tab, read once. */
export function takePendingOAuth(): PendingOAuth | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<PendingOAuth>;
    return isOAuthProvider(parsed.provider)
      ? { provider: parsed.provider, link: parsed.link === true }
      : null;
  } catch {
    return null;
  }
}

/** Leaves the app for the provider's sign-in page. */
export function beginOAuth(
  provider: OAuthProvider,
  options: { returnTo: string; link?: boolean },
): void {
  rememberPending({ provider, link: options.link === true });
  window.location.assign(oauthStartUrl(provider, options));
}

/** Where a sign-in should come back to: this page, minus old return params. */
export function currentReturnTo(): string {
  const { pathname, search } = window.location;
  const rest = readOAuthReturn(search)?.search ?? search;
  return `${pathname}${rest}`;
}
