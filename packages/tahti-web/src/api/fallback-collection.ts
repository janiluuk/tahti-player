import type { FetchMeta } from './client';
import { getJson } from './http';
import { failMeta, isForceMock } from './mode';
import { requestJson } from './request-json';

export type FallbackCollectionOption = {
  id: string;
  slug: string;
  name: string;
  trackCount: number;
  active: boolean;
};

let mockActiveId: string | null = null;

function mockOptions(): FallbackCollectionOption[] {
  return [
    {
      id: 'mock-col-1',
      slug: 'late-night',
      name: 'Late night',
      trackCount: 14,
    },
    { id: 'mock-col-2', slug: 'sunday-mix', name: 'Sunday mix', trackCount: 9 },
  ].map((option) => ({ ...option, active: option.id === mockActiveId }));
}

/** The channel owner's collections the 24/7 rotation can play from. */
export async function fetchFallbackCollections(slug: string): Promise<{
  data: FallbackCollectionOption[] | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockOptions(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<FallbackCollectionOption[]>(
      `/api/channels/${encodeURIComponent(slug)}/fallback-collections`,
    );
    return { data: Array.isArray(data) ? data : [], meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

/** Point the rotation at a collection, or back to the tracks marked for
 * rotation with `null`. */
export async function setFallbackCollection(
  slug: string,
  collectionId: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockActiveId = collectionId;
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/channels/${encodeURIComponent(slug)}/fallback-collection`,
      { method: 'PATCH', body: JSON.stringify({ collectionId }) },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not switch the rotation',
    };
  }
}
