import { getJson } from './http';
import { isForceMock } from './mode';

const MAX_IDS = 100;

/** Best current top-list rank (month or all-time top 50) per sound id.
 * Ids that aren't ranked are simply missing; a failed lookup is empty. */
export async function fetchTopListRanks(
  soundIds: string[],
): Promise<Record<string, number>> {
  const ids = [...new Set(soundIds.filter(Boolean))].slice(0, MAX_IDS);
  if (ids.length === 0) {
    return {};
  }
  if (isForceMock()) {
    return ids[0] ? { [ids[0]]: 3 } : {};
  }
  try {
    const data = await getJson<{ ranks: Record<string, number> }>(
      `/api/top-lists/ranks?ids=${ids.map(encodeURIComponent).join(',')}`,
    );
    return data.ranks ?? {};
  } catch {
    return {};
  }
}
