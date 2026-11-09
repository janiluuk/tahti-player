import { XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Loader, StoryCard, StoryRow, Tooltip } from '@tahti-player/ui';

import { fetchRssArticles } from '../api/rss-feed';
import type { RssArticle } from '../lib/parseRss';
import { storyDate } from '../lib/storyDate';
import type { ListenerWidgetInstance } from '../stores/listenerWidgetsStore';
import { NewsArticleDialog } from './NewsArticleDialog';
import { PageError } from './PageStates';
import { StoryTitleButton } from './StoryTitleButton';

export function NewsFeedWidget({
  instance,
  onRemove,
}: {
  instance: ListenerWidgetInstance;
  onRemove?: () => void;
}) {
  const { t } = useTranslation('web');
  const [articles, setArticles] = useState<RssArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [openArticle, setOpenArticle] = useState<RssArticle | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    void fetchRssArticles(instance.input).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      setFailed(result.data.length === 0 && Boolean(result.meta.reason));
      setArticles(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [instance.input, reloadKey]);

  const removeButton = onRemove ? (
    <Tooltip
      content={t('newsFeedWidgetLabels.removeLabel', {
        label: instance.label,
      })}
      side="top"
    >
      <Button
        size="icon-sm"
        variant="text"
        aria-label={t('newsFeedWidgetLabels.removeLabel', {
          label: instance.label,
        })}
        className="text-foreground-secondary hover:text-accent-red-strong"
        onClick={onRemove}
      >
        <XIcon size={14} aria-hidden />
      </Button>
    </Tooltip>
  ) : null;

  return (
    <div className="flex flex-col gap-3" data-testid="news-feed-widget">
      {loading || failed ? (
        <header className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{instance.label}</h2>
          {removeButton}
        </header>
      ) : null}
      {loading ? (
        <div className="flex items-center gap-2 py-6">
          <Loader size="sm" />
          <span className="text-foreground-secondary text-sm">
            Loading {instance.label}…
          </span>
        </div>
      ) : failed ? (
        <PageError
          title={t('loadErrors.couldnTLoadThisFeed')}
          description={t('loadErrors.checkTheRssUrlAndTry')}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : (
        <StoryRow title={instance.label} actions={removeButton}>
          {articles.length === 0 ? (
            <p className="text-foreground-secondary py-8 text-sm">
              {t('feedStory.noArticles')}
            </p>
          ) : (
            articles.map((article, index) => (
              <StoryCard
                key={article.id}
                index={index}
                data-testid="article-card"
                imageSrc={article.imageUrl ?? instance.thumbnailUrl}
                artworkSeed={article.id}
                kind={instance.label}
                date={
                  article.publishedAt
                    ? storyDate(article.publishedAt)
                    : undefined
                }
                dateTime={article.publishedAt}
                title={
                  <StoryTitleButton onOpen={() => setOpenArticle(article)}>
                    {article.title}
                  </StoryTitleButton>
                }
                excerpt={article.teaser?.trim() || undefined}
                onOpen={() => setOpenArticle(article)}
                openLabel={t('feedStory.readTitle', { title: article.title })}
              />
            ))
          )}
        </StoryRow>
      )}
      <NewsArticleDialog
        article={openArticle}
        feedLabel={instance.label}
        fallbackImageUrl={instance.thumbnailUrl}
        onClose={() => setOpenArticle(null)}
      />
    </div>
  );
}
