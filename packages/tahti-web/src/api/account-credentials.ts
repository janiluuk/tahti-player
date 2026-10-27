import { isForceMock } from './mode';
import { requestJson } from './request-json';

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
