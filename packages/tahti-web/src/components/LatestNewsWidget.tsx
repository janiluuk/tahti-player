import { ArrowRightIcon, SlidersHorizontalIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Dialog,
  Loader,
  MediaArtwork,
  StoryCard,
  StoryRow,
} from '@tahti-player/ui';

import { fetchRssArticles } from '../api/rss-feed';
import { aggregateNews, type AggregatedArticle } from '../lib/newsAggregate';
import { storyDate } from '../lib/storyDate';
import {
  newsWidgetsOn,
  useListenerWidgetsStore,
  type ListenerWidgetSurface,
} from '../stores/listenerWidgetsStore';
import { NewsArticleDialog } from './NewsArticleDialog';
import { NewsSourcesDialog } from './NewsSourcesDialog';
import { StoryTitleButton } from './StoryTitleButton';

const CAROUSEL_LIMIT = 12;

type LoadState = {
  articles: AggregatedArticle[];
  failed: string[];
  loading: boolean;
};

/** Every RSS source on this page merged into one Latest News carousel. */
export function LatestNewsWidget({
  surface,
}: {
  surface: ListenerWidgetSurface;
}) {
  const { t } = useTranslation('web');
  const instances = useListenerWidgetsStore((state) => state.instances);
  const sources = useMemo(
    () =>
      newsWidgetsOn(instances, surface).map((instance) => ({
        id: instance.id,
        label: instance.label,
        url: instance.input,
        thumbnailUrl: instance.thumbnailUrl,
      })),
    [instances, surface],
  );
  const sourceKey = sources.map((source) => source.url).join('|');
  const sourcesRef = useRef(sources);
  sourcesRef.current = sources;
  const [state, setState] = useState<LoadState>({
    articles: [],
    failed: [],
    loading: true,
  });
  const [open, setOpen] = useState<AggregatedArticle | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState((previous) => ({ ...previous, loading: true }));
    void Promise.all(
      sourcesRef.current.map(async (source) => {
        const result = await fetchRssArticles(source.url);
        return {
          source,
          articles: result.data,
          failed: result.data.length === 0 && Boolean(result.meta.reason),
        };
      }),
    ).then((feeds) => {
      if (cancelled) {
        return;
      }
      setState({
        articles: aggregateNews(feeds, 40),
        failed: feeds
          .filter((feed) => feed.failed)
          .map((feed) => feed.source.label),
        loading: false,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [sourceKey]);

  if (sources.length === 0) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-col gap-2" data-testid="latest-news">
      {state.loading && state.articles.length === 0 ? (
        <div className="flex items-center gap-2 py-6">
          <Loader size="sm" />
          <span className="text-foreground-secondary text-sm">
            {t('feedStory.loadingNews')}
          </span>
        </div>
      ) : (
        <StoryRow
          title={t('feedStory.latestNews')}
          actions={
            <>
              <Button
                size="sm"
                variant="text"
                className="gap-1.5"
                onClick={() => setEditing(true)}
              >
                <SlidersHorizontalIcon size={14} aria-hidden />
                {t('feedStory.sources')}
              </Button>
              {state.articles.length > CAROUSEL_LIMIT ? (
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1.5 rounded-full"
                  onClick={() => setShowAll(true)}
                >
                  {t('feedStory.moreNews')}
                  <ArrowRightIcon size={14} aria-hidden />
                </Button>
              ) : null}
            </>
          }
        >
          {state.articles.length === 0 ? (
            <p className="text-foreground-secondary py-8 text-sm">
              {t('feedStory.noArticles')}
            </p>
          ) : (
            state.articles
              .slice(0, CAROUSEL_LIMIT)
              .map((article, index) => (
                <StoryCard
                  key={article.key}
                  index={index}
                  data-testid="news-story"
                  imageSrc={article.imageUrl ?? article.source.thumbnailUrl}
                  artworkSeed={article.key}
                  kind={article.source.label}
                  date={
                    article.publishedAt
                      ? storyDate(article.publishedAt)
                      : undefined
                  }
                  dateTime={article.publishedAt}
                  title={
                    <StoryTitleButton onOpen={() => setOpen(article)}>
                      {article.title}
                    </StoryTitleButton>
                  }
                  excerpt={article.teaser}
                  onOpen={() => setOpen(article)}
                  openLabel={t('feedStory.readTitle', { title: article.title })}
                />
              ))
          )}
        </StoryRow>
      )}
      {state.failed.length > 0 ? (
        <p className="text-foreground-secondary text-xs" role="status">
          {t('feedStory.couldNotLoadSources', {
            names: state.failed.join(', '),
          })}
        </p>
      ) : null}
      <Dialog
        isOpen={showAll}
        onClose={() => setShowAll(false)}
        title={t('feedStory.latestNews')}
        actions={<Dialog.Close>{t('actions.close')}</Dialog.Close>}
      >
        <ul
          aria-label={t('feedStory.allNews')}
          className="divide-border flex max-h-[65vh] flex-col divide-y overflow-y-auto"
        >
          {state.articles.map((article) => {
            return (
              <li key={article.key}>
                <Button
                  variant="plain"
                  size="flexible"
                  className="hover:bg-background-secondary flex w-full items-center gap-3 py-2 text-left whitespace-normal"
                  onClick={() => {
                    setShowAll(false);
                    setOpen(article);
                  }}
                >
                  <MediaArtwork size="sm" src={article.imageUrl} alt="" />
                  <span className="flex min-w-0 flex-col">
                    <span className="line-clamp-2 text-sm font-semibold">
                      {article.title}
                    </span>
                    <span className="text-foreground-secondary flex items-center gap-1.5 text-xs">
                      <span
                        aria-hidden
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: article.sourceColor }}
                      />
                      {article.source.label}
                      {article.publishedAt
                        ? ` · ${storyDate(article.publishedAt)}`
                        : ''}
                    </span>
                  </span>
                </Button>
              </li>
            );
          })}
        </ul>
      </Dialog>
      <NewsArticleDialog
        article={open}
        feedLabel={open?.source.label ?? 'News'}
        fallbackImageUrl={open?.source.thumbnailUrl}
        onClose={() => setOpen(null)}
      />
      <NewsSourcesDialog isOpen={editing} onClose={() => setEditing(false)} />
    </div>
  );
}
