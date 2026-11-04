import type { FetchMeta } from '../client';
import {
  allowMockFallback,
  apiErrorMeta,
  isForceMock,
  mockFallbackMeta,
} from '../mode';
import { fetchStudioCollections } from './studio-collections';
import { requestJson } from './studio-request';

export type SetMembershipEntry = {
  id: string;
  slug: string;
  name: string;
  coverUrl: string | null;
  style: string;
  isPublic: boolean;
  visibility: 'PUBLIC' | 'UNLISTED' | 'DRAFT';
  itemCount: number;
  member: boolean;
  itemId: string | null;
};

/** Collections the artist manages and whether this sound is already in each. */
export async function fetchSoundSetMembership(
  soundId: string,
): Promise<{ data: SetMembershipEntry[]; meta: FetchMeta }> {
  if (isForceMock()) {
    const collections = await fetchStudioCollections();
    const data: SetMembershipEntry[] = collections.data
      .filter((c) => {
        const style = (c.style ?? 'PLAYLIST').toUpperCase();
        return (
          style === 'PLAYLIST' ||
          style === 'DJ_SET_SERIES' ||
          style === 'CUSTOM' ||
          style === 'PODCAST' ||
          style === 'RECORDING' ||
          style === 'SERIES' ||
          !c.style
        );
      })
      .map((c, index) => ({
        id: c.id ?? c.slug,
        slug: c.slug,
        name: c.name,
        coverUrl: c.coverUrl ?? null,
        style: c.style ?? 'PLAYLIST',
        isPublic: c.isPublic !== false,
        visibility:
          (c.visibility as SetMembershipEntry['visibility'] | undefined) ??
          (c.isPublic === false ? 'DRAFT' : 'PUBLIC'),
        itemCount: c.itemCount ?? c.items?.length ?? 0,
        member: index === 0,
        itemId: index === 0 ? `mock-item-${c.slug}` : null,
      }));
    return { data, meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const { data } = await requestJson<SetMembershipEntry[]>(
      `/api/me/sound/${encodeURIComponent(soundId)}/set-membership`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: [], meta: mockFallbackMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}
