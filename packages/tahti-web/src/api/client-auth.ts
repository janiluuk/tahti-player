import { requestJson } from './client-request';
import {
  buildMockLoginUser,
  clearMockSessionUser,
  getMockSessionUser,
  setMockSessionUser,
} from './mock-session';
import { apiErrorMeta, isForceMock, type FetchMeta } from './mode';
import type { AuthUser } from './types';

export async function fetchAuthMe(): Promise<{
  data: AuthUser | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: getMockSessionUser(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<AuthUser>('/api/auth/me');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('401') || message.includes('Unauthorized')) {
      return { data: null, meta: { source: 'api' } };
    }
    return { data: null, meta: apiErrorMeta(err) };
  }
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<
  | { ok: true; user: AuthUser; requiresTotp?: false }
  | { ok: true; requiresTotp: true; challengeId: string }
  | { ok: false; error: string; mock?: boolean }
> {
  if (isForceMock()) {
    // Demo 2FA: email contains "+totp" or password is "totp-demo"
    if (email.includes('+totp') || password === 'totp-demo') {
      return {
        ok: true,
        requiresTotp: true,
        challengeId: 'mock-totp-challenge',
      };
    }
    const user = buildMockLoginUser(email);
    setMockSessionUser(user);
    return { ok: true, user };
  }
  try {
    const { data } = await requestJson<{
      user?: AuthUser;
      requiresTotp?: boolean;
      challengeId?: string;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.requiresTotp && data.challengeId) {
      return { ok: true, requiresTotp: true, challengeId: data.challengeId };
    }
    if (!data.user) {
      return { ok: false, error: 'Login failed' };
    }
    return { ok: true, user: data.user };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Login failed',
    };
  }
}

export async function loginTotpRequest(
  challengeId: string,
  code: string,
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  if (isForceMock()) {
    if (
      challengeId === 'mock-totp-challenge' &&
      (code === '000000' || code === '123456')
    ) {
      const user = buildMockLoginUser('demo+totp@tahti.live', {
        username: 'demo-totp',
        id: 'mock-totp-user',
        displayName: 'Demo TOTP',
        channel: {
          slug: 'demo-totp',
          state: 'OFFLINE',
          goneLiveAt: null,
          customDomain: null,
          customDomainVerified: false,
        },
      });
      setMockSessionUser(user);
      return { ok: true, user };
    }
    return { ok: false, error: 'Invalid code.' };
  }
  try {
    const { data } = await requestJson<{ user: AuthUser }>(
      '/api/auth/login/totp',
      {
        method: 'POST',
        body: JSON.stringify({ challengeId, code }),
      },
    );
    if (!data.user) {
      return { ok: false, error: 'Login failed' };
    }
    return { ok: true, user: data.user };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Invalid code',
    };
  }
}

export async function registerRequest(input: {
  email: string;
  password: string;
  username: string;
  displayName: string;
}): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  if (isForceMock()) {
    return {
      ok: true,
      message:
        'Mock registration OK — verify is skipped offline. You can log in with any password.',
    };
  }
  try {
    const { data } = await requestJson<{ message: string }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
    return { ok: true, message: data.message };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Registration failed',
    };
  }
}

export async function verifyEmailRequest(
  token: string,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true, message: 'Mock verify OK' };
  }
  try {
    const { data } = await requestJson<{ message: string }>(
      `/api/auth/verify?token=${encodeURIComponent(token)}`,
    );
    return { ok: true, message: data.message };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Verification failed',
    };
  }
}

/** GET /api/auth/setup-password?token= — one-time invite link that lets a
 * passwordless account (board-invited, imported) set an initial password. */
export async function fetchSetupPasswordInfo(
  token: string,
): Promise<
  | { ok: true; email: string; username: string; displayName: string }
  | { ok: false; error: string }
> {
  if (isForceMock()) {
    return {
      ok: true,
      email: 'newartist@tahti.live',
      username: 'newartist',
      displayName: 'New Artist',
    };
  }
  try {
    const { data } = await requestJson<{
      email: string;
      username: string;
      displayName: string;
    }>(`/api/auth/setup-password?token=${encodeURIComponent(token)}`);
    return { ok: true, ...data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Invalid or expired link',
    };
  }
}

export async function submitSetupPassword(
  token: string,
  password: string,
  email?: string,
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  if (isForceMock()) {
    const user = buildMockLoginUser(email || 'newartist@tahti.live');
    setMockSessionUser(user);
    return { ok: true, user };
  }
  try {
    await requestJson<{ ok: true; user: Partial<AuthUser> }>(
      '/api/auth/setup-password',
      { method: 'POST', body: JSON.stringify({ token, password }) },
    );
    // POST sets the session cookie but returns a partial user shape —
    // fetch the full session user the same way login/register do.
    const me = await fetchAuthMe();
    if (!me.data) {
      return { ok: false, error: 'Password set, but session did not start' };
    }
    return { ok: true, user: me.data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not set password',
    };
  }
}

/** POST /api/auth/forgot-password — always returns a generic message, even
 * for unknown emails, so the endpoint can't be used to enumerate accounts. */
export async function submitForgotPassword(email: string): Promise<string> {
  const fallback =
    'If an account exists for that email, we sent a link to reset your password.';
  if (isForceMock()) {
    return fallback;
  }
  try {
    const { data } = await requestJson<{ message?: string }>(
      '/api/auth/forgot-password',
      { method: 'POST', body: JSON.stringify({ email }) },
    );
    return data.message ?? fallback;
  } catch {
    return fallback;
  }
}

/** GET /api/auth/reset-password?token= — resolves the account behind a
 * password-reset link before the user commits to a new password. */
export async function fetchResetPasswordInfo(
  token: string,
): Promise<
  | { ok: true; email: string; username: string; displayName: string }
  | { ok: false; error: string }
> {
  if (isForceMock()) {
    return {
      ok: true,
      email: 'newartist@tahti.live',
      username: 'newartist',
      displayName: 'New Artist',
    };
  }
  try {
    const { data } = await requestJson<{
      email: string;
      username: string;
      displayName: string;
    }>(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
    return { ok: true, ...data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Invalid or expired link',
    };
  }
}

export async function submitResetPassword(
  token: string,
  password: string,
  email?: string,
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  if (isForceMock()) {
    const user = buildMockLoginUser(email || 'newartist@tahti.live');
    setMockSessionUser(user);
    return { ok: true, user };
  }
  try {
    await requestJson<{ ok: true; user: Partial<AuthUser> }>(
      '/api/auth/reset-password',
      { method: 'POST', body: JSON.stringify({ token, password }) },
    );
    const me = await fetchAuthMe();
    if (!me.data) {
      return { ok: false, error: 'Password reset, but session did not start' };
    }
    return { ok: true, user: me.data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not reset password',
    };
  }
}

export async function logoutRequest(): Promise<void> {
  if (isForceMock()) {
    clearMockSessionUser();
    return;
  }
  try {
    await requestJson('/api/auth/logout', { method: 'POST' });
  } catch {
    // ignore
  }
}
