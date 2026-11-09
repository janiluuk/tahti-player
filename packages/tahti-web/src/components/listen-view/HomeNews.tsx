import { ArrowRightIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { ButtonLink, StoryCard, StoryRow } from '@tahti-player/ui';

import { fetchAnnouncements } from '../../api/client';
import { isForceMock } from '../../api/mode';
import type { Announcement } from '../../api/types';
import { storyDate } from '../../lib/storyDate';
import { PlatformNewsDialog } from '../PlatformNewsDialog';
import { StoryTitleButton } from '../StoryTitleButton';
import { ListenSection } from './ListenSection';
import type { ListenSectionStatus } from './useListenSections';

/** The latest Tahti news posts on Discover, linking to /news. */
export function HomeNews({ limit = 3 }: { limit?: number }) {
  const { t } = useTranslation('web');
  const [selected, setSelected] = useState<Announcement | null>(null);
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
    .slice(0, limit);

  return (
    <ListenSection
      data-testid="home-news"
      title={t('homeNews.fromTahti')}
      badge="News"
      badgeColor="yellow"
      status={status}
      empty={items.length === 0}
      emptyTitle="No news yet"
      onRetry={retry}
    >
      {selected ? (
        <PlatformNewsDialog
          key={selected.id}
          post={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setSelected(updated);
            setPosts((current) =>
              current.map((post) => (post.id === updated.id ? updated : post)),
            );
          }}
        />
      ) : null}
      <StoryRow
        title={t('homeNews.fromTahti')}
        data-testid="home-news"
        actions={
          <ButtonLink
            to="/news"
            size="sm"
            variant="secondary"
            className="gap-1.5"
          >
            {t('homeNews.showAllNews')}
            <ArrowRightIcon size={14} aria-hidden />
          </ButtonLink>
        }
      >
        {items.map((post, index) => (
          <StoryCard
            key={post.id}
            index={index}
            data-testid="news-story"
            imageSrc={post.imageUrl || '/news-opening.svg'}
            artworkSeed={post.id}
            kind={t('feedStory.news')}
            date={storyDate(post.publishedAt)}
            dateTime={post.publishedAt}
            title={
              <StoryTitleButton onOpen={() => setSelected(post)}>
                {post.headline}
              </StoryTitleButton>
            }
            excerpt={post.summary}
            onOpen={() => setSelected(post)}
            openLabel={t('feedStory.readTitle', { title: post.headline })}
          />
        ))}
      </StoryRow>
    </ListenSection>
  );
}
