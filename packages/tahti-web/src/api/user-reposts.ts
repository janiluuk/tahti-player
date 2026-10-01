import type { FetchMeta } from './client';
import { getJson } from './http';
import { failMeta, isForceMock } from './mode';

export type RepostedTrack = {
  id: string;
  title: string;
  bannerUrl: string | null;
  channelSlug: string;
  artistUsername: string;
  artistDisplayName: string;
  repostedAt: string;
  url: string;
};

/** The latest tracks a user reposted (`GET /api/v1/u/:username/reposts`). */
export async function fetchUserReposts(username: string): Promise<{
  data: RepostedTrack[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [
        {
          id: 'mock-repost-1',
          title: 'Borrowed Light',
          bannerUrl: null,
          channelSlug: 'night-drive',
          artistUsername: 'nightdrive',
          artistDisplayName: 'Night Drive',
          repostedAt: '2026-09-30T12:00:00.000Z',
          url: '/c/night-drive#sound-item-mock-repost-1',
        },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ items?: RepostedTrack[] }>(
      `/api/v1/u/${encodeURIComponent(username)}/reposts`,
    );
    return {
      data: Array.isArray(data.items) ? data.items : [],
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}
