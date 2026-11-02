import type { RssArticle } from './parseRss';

export type NewsSource = {
  id: string;
  label: string;
  url: string;
  thumbnailUrl?: string;
};

export type AggregatedArticle = RssArticle & {
  key: string;
  source: NewsSource;
  sourceColor: string;
};

const SOURCE_COLORS = [
  '#ef4444',
  '#f59e0b',
  '#22c55e',
  '#06b6d4',
  '#8b5cf6',
  '#ec4899',
  '#3b82f6',
  '#84cc16',
];

export function newsSourceColor(index: number): string {
  return SOURCE_COLORS[index % SOURCE_COLORS.length];
}

const timeOf = (article: RssArticle) => {
  const time = article.publishedAt ? Date.parse(article.publishedAt) : NaN;
  return Number.isNaN(time) ? 0 : time;
};

/** Merges several feeds into one list, newest first. A story that two
 * feeds both carry (same link) shows once, from the first source. */
export function aggregateNews(
  feeds: { source: NewsSource; articles: RssArticle[] }[],
  limit = 24,
): AggregatedArticle[] {
  const seen = new Set<string>();
  const merged: AggregatedArticle[] = [];
  feeds.forEach(({ source, articles }, index) => {
    for (const article of articles) {
      const dedupeKey = article.link ?? `${source.id}:${article.id}`;
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);
      merged.push({
        ...article,
        imageUrl: article.imageUrl ?? source.thumbnailUrl,
        key: `${source.id}:${article.id}`,
        source,
        sourceColor: newsSourceColor(index),
      });
    }
  });
  return merged
    .sort((left, right) => timeOf(right) - timeOf(left))
    .slice(0, limit);
}
