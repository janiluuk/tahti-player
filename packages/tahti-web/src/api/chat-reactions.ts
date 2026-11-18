import { getJson } from './http';
import { FORCE_MOCK } from './mode';

/** Anonymous token for the `reactions:<slug>` channel (`GET /api/chat/:slug/reactions-token`). */
export async function fetchReactionsToken(
  slug: string,
): Promise<string | null> {
  if (FORCE_MOCK) {
    return null;
  }
  try {
    const data = await getJson<{ token?: string }>(
      `/api/chat/${encodeURIComponent(slug)}/reactions-token`,
    );
    return data.token ?? null;
  } catch {
    return null;
  }
}
