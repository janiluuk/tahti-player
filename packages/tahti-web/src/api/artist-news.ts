import type { FetchMeta } from './client';
import { getJson } from './http';
import { failMeta, isForceMock } from './mode';

export type ArtistNewsItem = {
  title: string;
  link: string;
  pubDate: string | null;
};

/** Items from the artist's own RSS/Atom feed (`User.newsFeedUrl`). The API
 * returns an empty list when no feed is set or it can't be read. */
export async function fetchArtistNewsFeed(username: string): Promise<{
  data: ArtistNewsItem[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [
        {
          title: 'New EP out on Friday',
          link: 'https://example.com/news/new-ep',
          pubDate: '2026-09-28T10:00:00.000Z',
        },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ items?: ArtistNewsItem[] }>(
      `/api/v1/u/${encodeURIComponent(username)}/news`,
    );
    return {
      data: Array.isArray(data.items) ? data.items : [],
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}
