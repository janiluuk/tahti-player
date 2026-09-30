import type { FetchMeta } from './client';
import { getJson } from './http';
import { failMeta, isForceMock } from './mode';

export type LatestRelease = {
  id: string;
  title: string;
  type: string;
  releaseDate: string;
  artworkUrl: string | null;
  smartLinkSlug: string;
  artistDisplayName: string;
  /** Sent by tahti-org since #576; older APIs leave it out. */
  artistUsername?: string;
};

/** Newest published releases, by release date (the API has no listen
 * ranking for releases). Only ones with a smart link can be opened. */
export async function fetchLatestReleases(limit = 10): Promise<{
  data: LatestRelease[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [
        {
          id: 'mock-release-1',
          title: 'Night Drive',
          type: 'EP',
          releaseDate: '2026-09-25T00:00:00.000Z',
          artworkUrl: null,
          smartLinkSlug: 'night-drive',
          artistDisplayName: 'Tahti',
          artistUsername: 'tahti',
        },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { releases } = await getJson<{ releases: LatestRelease[] }>(
      `/api/releases/latest?limit=${limit}`,
    );
    return {
      data: (Array.isArray(releases) ? releases : []).filter(
        (release) => release.smartLinkSlug,
      ),
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}
