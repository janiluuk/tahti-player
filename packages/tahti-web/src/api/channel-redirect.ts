import { getJson } from './http';
import { isForceMock } from './mode';

/** The current slug of a channel that was renamed away from `oldSlug`, while
 * its 30-day redirect lasts; null when there's none. */
export async function fetchChannelSlugRedirect(
  oldSlug: string,
): Promise<string | null> {
  if (isForceMock()) {
    return null;
  }
  try {
    const data = await getJson<{ slug: string }>(
      `/api/channels/${encodeURIComponent(oldSlug)}/redirect`,
    );
    return data.slug && data.slug !== oldSlug ? data.slug : null;
  } catch {
    return null;
  }
}
