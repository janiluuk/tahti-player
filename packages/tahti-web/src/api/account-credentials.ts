import { isForceMock } from './mode';
import { requestJson } from './request-json';

export type PendingEmailChange = { newEmail: string; expiresAt: string };

let mockPending: PendingEmailChange | null = null;

type Result = { ok: true; message: string } | { ok: false; error: string };

function failure(err: unknown, fallback: string): Result {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

/** Changes the password; other devices are signed out
 * (`POST /api/me/password`). */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<Result> {
  if (isForceMock()) {
    return {
      ok: true,
      message: 'Password changed. Other devices were signed out.',
    };
  }
  try {
    const { data } = await requestJson<{ message: string }>(
      '/api/me/password',
      {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      },
    );
    return { ok: true, message: data.message };
  } catch (err) {
    return failure(err, 'Could not change the password');
  }
}

/** Asks to move the account to another address; a link goes there
 * (`POST /api/me/email`). */
export async function requestEmailChange(
  newEmail: string,
  password: string,
): Promise<Result> {
  if (isForceMock()) {
    mockPending = {
      newEmail,
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    };
    return {
      ok: true,
      message: `We sent a link to ${newEmail}. Open it to finish.`,
    };
  }
  try {
    const { data } = await requestJson<{ message: string }>('/api/me/email', {
      method: 'POST',
      body: JSON.stringify({ newEmail, password }),
    });
    return { ok: true, message: data.message };
  } catch (err) {
    return failure(err, 'Could not start the email change');
  }
}

/** Finishes an email change from the link sent to the new address
 * (`POST /api/auth/email-change/confirm`); works signed out. */
export async function confirmEmailChange(token: string): Promise<Result> {
  if (isForceMock()) {
    return { ok: true, message: 'Your account now uses the new address.' };
  }
  try {
    const { data } = await requestJson<{ message: string }>(
      '/api/auth/email-change/confirm',
      { method: 'POST', body: JSON.stringify({ token }) },
    );
    return { ok: true, message: data.message };
  } catch (err) {
    return failure(err, 'Could not confirm the new address');
  }
}

/** The email change waiting for its link to be opened (`GET /api/me/email`).
 * A failed read gives none. */
export async function fetchPendingEmailChange(): Promise<PendingEmailChange | null> {
  if (isForceMock()) {
    return mockPending;
  }
  try {
    const { data } = await requestJson<{ pending: PendingEmailChange | null }>(
      '/api/me/email',
    );
    return data.pending ?? null;
  } catch {
    return null;
  }
}

/** Takes back a pending email change (`DELETE /api/me/email`). */
export async function cancelEmailChange(): Promise<Result> {
  if (isForceMock()) {
    mockPending = null;
    return { ok: true, message: 'Cancelled.' };
  }
  try {
    await requestJson('/api/me/email', { method: 'DELETE' });
    return { ok: true, message: 'Cancelled.' };
  } catch (err) {
    return failure(err, 'Could not cancel the change');
  }
}
