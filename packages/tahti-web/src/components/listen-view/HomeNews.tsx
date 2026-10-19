import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';

import { ButtonLink, NewsWidget } from '@tahti-player/ui';

import { fetchAnnouncements } from '../../api/client';
import { isForceMock } from '../../api/mode';
import type { Announcement } from '../../api/types';
import { ListenSection } from './ListenSection';
import type { ListenSectionStatus } from './useListenSections';

const LABELS = { nothingFound: 'No news yet.' };

/** The latest Tahti news posts on the front page, linking to /news. */
export function HomeNews({ limit = 3 }: { limit?: number }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Announcement[]>([]);
  const [status, setStatus] = useState<ListenSectionStatus>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    void fetchAnnouncements().then(({ data, meta }) => {
      if (cancelled) {
        return;
      }
      const failed = Boolean(meta.reason) && !isForceMock();
      setPosts(failed ? [] : data);
      setStatus(failed ? 'error' : 'ready');
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const items = [...posts]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit)
    .map((post) => ({
      id: post.id,
      title: post.headline,
      teaser: post.summary,
      imageUrl: post.imageUrl ?? undefined,
      onClick: () => void navigate({ to: '/news' }),
    }));

  return (
    <ListenSection
      data-testid="listen-news"
      title="From Tahti"
      badge="News"
      badgeColor="yellow"
      status={status}
      empty={items.length === 0}
      emptyTitle="No news yet"
      onRetry={retry}
    >
      <div className="flex flex-col gap-2" data-testid="listen-news">
        <NewsWidget
          title="From Tahti"
          badge="News"
          items={items}
          labels={LABELS}
        />
        <ButtonLink to="/news" size="xs" variant="text" className="self-start">
          All news
        </ButtonLink>
      </div>
    </ListenSection>
  );
}
