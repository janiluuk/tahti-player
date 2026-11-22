import { getJson, mutate } from '../http';
import { isForceMock } from '../mode';
import type { StudioCollection } from '../studio-types';
import { fetchStudioCollection } from '../studio/studio-collections';

export type AdminCollection = StudioCollection & {
  owner?: { username: string; displayName: string } | null;
};

/** Any artist's collection with every item, private ones included (board only). */
export async function fetchAdminCollection(
  slug: string,
): Promise<{ ok: true; data: AdminCollection } | { ok: false; error: string }> {
  if (isForceMock()) {
    const { data } = await fetchStudioCollection(slug);
    return { ok: true, data };
  }
  try {
    const data = await getJson<AdminCollection>(
      `/api/admin/collections/${encodeURIComponent(slug)}`,
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed',
    };
  }
}

/** Board reorder of any collection: `itemIds` lists every item once, first track first. */
export async function reorderAdminCollectionItems(
  slug: string,
  itemIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  return mutate(
    `/api/admin/collections/${encodeURIComponent(slug)}/reorder`,
    'PUT',
    { itemIds },
  );
}
