import { getJson } from './http';
import { FORCE_MOCK } from './mode';

export async function fetchChannelPresence(
  slug: string,
): Promise<number | null> {
  if (FORCE_MOCK) {
    return 12;
  }
  try {
    const data = await getJson<{ numClients: number }>(
      `/api/channels/${encodeURIComponent(slug)}/presence`,
    );
    return typeof data.numClients === 'number' ? data.numClients : null;
  } catch {
    return null;
  }
}
