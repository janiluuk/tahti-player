import { useEffect, useState } from 'react';

import { ExternalLink } from '@tahti-player/ui';

import type { PinnedAnnouncement } from '../../api/announcements';
import {
  fetchArtistNewsFeed,
  type ArtistNewsItem,
} from '../../api/artist-news';
import { Eyebrow } from '../tahti/Eyebrow';

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
};

export function ArtistNews({
  news,
  username,
}: {
  news: PinnedAnnouncement[];
  username: string;
}) {
  const [feed, setFeed] = useState<ArtistNewsItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchArtistNewsFeed(username).then((result) => {
      if (!cancelled) {
        setFeed(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (news.length === 0 && feed.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <Eyebrow>News</Eyebrow>
      <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
        {news.map((item) => (
          <li key={item.id} className="p-3 text-sm">
            {item.body}
          </li>
        ))}
        {feed.map((item) => {
          const date = item.pubDate ? formatDate(item.pubDate) : null;
          return (
            <li
              key={item.link}
              className="flex flex-wrap items-baseline justify-between gap-2 p-3 text-sm"
            >
              <ExternalLink href={item.link}>{item.title}</ExternalLink>
              {date ? (
                <time
                  dateTime={item.pubDate ?? undefined}
                  className="text-foreground-secondary text-xs"
                >
                  {date}
                </time>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
