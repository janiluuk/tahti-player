import { apiBase } from './http';
import { getMockSessionUser, setMockSessionUser } from './mock-session';
import { isForceMock } from './mode';

export async function provisionChannel(): Promise<
  { ok: true; slug: string } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const user = getMockSessionUser();
    if (!user) {
      return { ok: false, error: 'Log in first to create a channel.' };
    }
    const slug = user.username || 'demo';
    setMockSessionUser({
      ...user,
      channel: {
        slug,
        state: 'OFFLINE',
      },
    });
    return { ok: true, slug };
  }
  try {
    const res = await fetch(`${apiBase()}/api/me/channel/provision`, {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      let detail = `Provision failed (${res.status})`;
      try {
        const body = (await res.json()) as { error?: string };
        if (body.error) {
          detail = body.error;
        }
      } catch {
        // ignore
      }
      return { ok: false, error: detail };
    }
    const data = (await res.json()) as { slug?: string };
    if (!data.slug) {
      return { ok: false, error: 'Unexpected provision response' };
    }
    return { ok: true, slug: data.slug };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Provision failed',
    };
  }
}
