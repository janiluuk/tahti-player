import { parseRssXml, type RssArticle } from '../lib/parseRss';
import { apiBase } from './http';
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
  type FetchMeta,
} from './mode';

export const MOCK_RSS_ARTICLES: RssArticle[] = [
  {
    id: 'mock-news-1',
    title: 'Tahti ry opens applications for the winter grant round',
    teaser:
      'The cooperative’s member-voted grant pool is open again — here’s how the engagement-unit split works and how to apply before the deadline.',
    imageUrl: 'https://picsum.photos/640/360?random=21',
    link: 'https://tahti.live/news/winter-grants',
  },
  {
    id: 'mock-news-2',
    title: 'Behind the scenes: rebuilding the broadcast pipeline',
    teaser:
      'A look at the infrastructure work that cut stream startup latency in half, and what it means for artists going live.',
    imageUrl: 'https://picsum.photos/640/360?random=22',
    link: 'https://tahti.live/news/broadcast-pipeline',
  },
  {
    id: 'mock-news-3',
    title: 'Artist spotlight: three new collectives joining the roster',
    teaser:
      'Meet the latest artists to join Tahti — genres, first releases, and where to catch their debut broadcasts.',
    imageUrl: 'https://picsum.photos/640/360?random=23',
    link: 'https://tahti.live/news/new-collectives',
  },
];

export async function fetchRssArticles(feedUrl: string): Promise<{
  data: RssArticle[];
  feedTitle?: string;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: MOCK_RSS_ARTICLES,
      feedTitle: 'Tahti News',
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const res = await fetch(
      `${apiBase()}/api/me/rss-feed?url=${encodeURIComponent(feedUrl)}`,
      {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      },
    );
    if (!res.ok) {
      throw new Error(`rss-feed → ${res.status}`);
    }
    const body = (await res.json()) as { xml?: string; error?: string };
    if (!body.xml) {
      throw new Error(body.error ?? 'Empty feed');
    }
    const parsed = parseRssXml(body.xml);
    return {
      data: parsed.items,
      feedTitle: parsed.title,
      meta: { source: 'api' },
    };
  } catch (err) {
    if (allowMockFallback()) {
      return {
        data: MOCK_RSS_ARTICLES,
        feedTitle: 'Tahti News',
        meta: failMeta(err),
      };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}
