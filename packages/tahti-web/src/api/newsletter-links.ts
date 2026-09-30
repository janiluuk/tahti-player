import { apiBase } from './http';
import { isForceMock } from './mode';

/** Follows an emailed unsubscribe link. The API answers with a redirect to
 * `/newsletter/unsubscribed` when the token is valid and a 404 when it
 * isn't, so the redirect itself is the success signal. */
export async function unsubscribeFromNewsletter(
  token: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    const res = await fetch(
      `${apiBase()}/api/newsletter/unsubscribe/${encodeURIComponent(token)}`,
      { credentials: 'include', redirect: 'manual' },
    );
    if (res.type === 'opaqueredirect' || res.ok || res.status === 302) {
      return { ok: true };
    }
    return {
      ok: false,
      error:
        res.status === 404
          ? 'This unsubscribe link is invalid or was already used.'
          : `Could not unsubscribe (${res.status}).`,
    };
  } catch {
    return { ok: false, error: 'Could not reach Tahti. Try again.' };
  }
}
