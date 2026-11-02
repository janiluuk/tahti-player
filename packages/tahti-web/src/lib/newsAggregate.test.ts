import { describe, expect, it } from 'vitest';

import { aggregateNews, newsSourceColor } from './newsAggregate';

const source = (id: string, thumbnailUrl?: string) => ({
  id,
  label: id.toUpperCase(),
  url: `https://${id}.example/feed`,
  thumbnailUrl,
});

describe('aggregateNews', () => {
  it('merges feeds newest first, tagging each story with its source', () => {
    const merged = aggregateNews([
      {
        source: source('djmag'),
        articles: [
          { id: '1', title: 'Old', publishedAt: '2026-10-01T00:00:00Z' },
          { id: '2', title: 'Newest', publishedAt: '2026-11-02T00:00:00Z' },
        ],
      },
      {
        source: source('cdm', 'https://cdm.example/logo.png'),
        articles: [
          { id: 'a', title: 'Middle', publishedAt: '2026-10-20T00:00:00Z' },
          { id: 'b', title: 'Undated' },
        ],
      },
    ]);
    expect(merged.map((item) => item.title)).toEqual([
      'Newest',
      'Middle',
      'Old',
      'Undated',
    ]);
    expect(merged[1].source.label).toBe('CDM');
    expect(merged[1].sourceColor).toBe(newsSourceColor(1));
    expect(merged[1].imageUrl).toBe('https://cdm.example/logo.png');
  });

  it('shows a story two feeds share once and keeps to the limit', () => {
    const shared = { id: 'x', title: 'Shared', link: 'https://news/x' };
    const merged = aggregateNews(
      [
        { source: source('a'), articles: [shared, { id: 'y', title: 'Y' }] },
        { source: source('b'), articles: [{ ...shared, id: 'z' }] },
      ],
      5,
    );
    expect(merged.filter((item) => item.title === 'Shared')).toHaveLength(1);
    expect(merged.find((item) => item.title === 'Shared')?.source.id).toBe('a');
    expect(
      aggregateNews([{ source: source('a'), articles: [shared, shared] }], 1),
    ).toHaveLength(1);
  });
});
