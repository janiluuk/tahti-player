import type { Announcement } from '../api/types';
import type { NewsSource } from './newsAggregate';
import type { RssArticle } from './parseRss';

export const TAHTI_PLATFORM_NEWS_SOURCE_ID = 'tahti-platform';

export function tahtiPlatformNewsSource(label: string): NewsSource {
  return {
    id: TAHTI_PLATFORM_NEWS_SOURCE_ID,
    label,
    url: '/news',
    thumbnailUrl: '/news-opening.svg',
  };
}

/** Maps board platform posts into the shape Latest News aggregates. */
export function announcementsAsNewsFeed(
  posts: Announcement[],
  label: string,
): { source: NewsSource; articles: RssArticle[] } {
  return {
    source: tahtiPlatformNewsSource(label),
    articles: [...posts]
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .map((post) => ({
        id: post.id,
        title: post.headline,
        teaser: post.summary,
        imageUrl: post.imageUrl || '/news-opening.svg',
        link: post.linkUrl ?? undefined,
        publishedAt: post.publishedAt,
        paragraphs: post.summary.split(/\n\s*\n/).filter(Boolean),
      })),
  };
}

export function isTahtiPlatformNewsSource(sourceId: string): boolean {
  return sourceId === TAHTI_PLATFORM_NEWS_SOURCE_ID;
}
