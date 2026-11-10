import { describe, expect, it } from 'vitest';

import {
  announcementsAsNewsFeed,
  isTahtiPlatformNewsSource,
  TAHTI_PLATFORM_NEWS_SOURCE_ID,
} from './platformNewsFeed';

describe('platformNewsFeed', () => {
  it('sorts platform posts newest first and tags the Tahti source', () => {
    const feed = announcementsAsNewsFeed(
      [
        {
          id: 'old',
          headline: 'Older',
          summary: 'First line.\n\nSecond.',
          authorName: 'Tahti',
          publishedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'new',
          headline: 'Newer',
          summary: 'Hello',
          authorName: 'Tahti',
          publishedAt: '2026-11-01T00:00:00.000Z',
          imageUrl: null,
          linkUrl: '/whats-new',
        },
      ],
      'From Tahti',
    );
    expect(feed.source.id).toBe(TAHTI_PLATFORM_NEWS_SOURCE_ID);
    expect(feed.articles.map((article) => article.id)).toEqual(['new', 'old']);
    expect(feed.articles[0]).toMatchObject({
      title: 'Newer',
      imageUrl: '/news-opening.svg',
      link: '/whats-new',
      paragraphs: ['Hello'],
    });
    expect(feed.articles[1].paragraphs).toEqual(['First line.', 'Second.']);
    expect(isTahtiPlatformNewsSource(feed.source.id)).toBe(true);
  });
});
