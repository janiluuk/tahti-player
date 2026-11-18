import { getJson } from './http';
import { isForceMock } from './mode';

export async function fetchChannelPresence(
  slug: string,
): Promise<number | null> {
  if (isForceMock()) {
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
