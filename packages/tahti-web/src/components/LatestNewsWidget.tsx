import { ArrowRightIcon, SlidersHorizontalIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { toBcp47 } from '@tahti-player/i18n';
import {
  Button,
  Dialog,
  Loader,
  MediaArtwork,
  NewsCarousel,
  type NewsCarouselItem,
} from '@tahti-player/ui';

import { fetchRssArticles } from '../api/rss-feed';
import { humanizePastDate } from '../lib/humanizeDate';
import { currentLocale } from '../lib/locale';
import { aggregateNews, type AggregatedArticle } from '../lib/newsAggregate';
import {
  newsWidgetsOn,
  useListenerWidgetsStore,
  type ListenerWidgetSurface,
} from '../stores/listenerWidgetsStore';
import { NewsArticleDialog } from './NewsArticleDialog';
import { NewsSourcesDialog } from './NewsSourcesDialog';

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

  const toItem = (article: AggregatedArticle): NewsCarouselItem => ({
    id: article.key,
    title: article.title,
    imageUrl: article.imageUrl,
    source: article.source.label,
    sourceColor: article.sourceColor,
    publishedAt: article.publishedAt,
    publishedLabel: article.publishedAt
      ? humanizePastDate(article.publishedAt)
      : undefined,
    publishedTitle: article.publishedAt
      ? new Date(article.publishedAt).toLocaleString(toBcp47(currentLocale()))
      : undefined,
    onClick: () => setOpen(article),
  });

  return (
    <div className="flex min-w-0 flex-col gap-2" data-testid="latest-news">
      {state.loading && state.articles.length === 0 ? (
        <div className="flex items-center gap-2 py-6">
          <Loader size="sm" />
          <span className="text-foreground-secondary text-sm">
            Loading news…
          </span>
        </div>
      ) : (
        <NewsCarousel
          items={state.articles.slice(0, CAROUSEL_LIMIT).map(toItem)}
          labels={{ empty: 'No articles in your sources right now.' }}
          actions={
            <Button
              size="sm"
              variant="text"
              className="gap-1.5"
              onClick={() => setEditing(true)}
            >
              <SlidersHorizontalIcon size={14} aria-hidden />
              Sources
            </Button>
          }
          more={
            state.articles.length > 0 ? (
              <Button
                size="sm"
                variant="secondary"
                className="gap-1.5 rounded-full"
                onClick={() => setShowAll(true)}
              >
                more News
                <ArrowRightIcon size={14} aria-hidden />
              </Button>
            ) : null
          }
        />
      )}
      {state.failed.length > 0 ? (
        <p className="text-foreground-secondary text-xs" role="status">
          Couldn’t load {state.failed.join(', ')}.
        </p>
      ) : null}
      <Dialog
        isOpen={showAll}
        onClose={() => setShowAll(false)}
        title="Latest News"
        actions={<Dialog.Close>Close</Dialog.Close>}
      >
        <ul
          aria-label="All news"
          className="divide-border flex max-h-[65vh] flex-col divide-y overflow-y-auto"
        >
          {state.articles.map((article) => {
            const item = toItem(article);
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
                      {item.source}
                      {item.publishedLabel ? ` · ${item.publishedLabel}` : ''}
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
