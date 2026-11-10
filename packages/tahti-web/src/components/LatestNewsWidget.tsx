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

import { fetchAnnouncements } from '../api/client';
import { isForceMock } from '../api/mode';
import { fetchRssArticles } from '../api/rss-feed';
import type { Announcement } from '../api/types';
import { aggregateNews, type AggregatedArticle } from '../lib/newsAggregate';
import {
  announcementsAsNewsFeed,
  isTahtiPlatformNewsSource,
} from '../lib/platformNewsFeed';
import { storyDate } from '../lib/storyDate';
import {
  newsWidgetsOn,
  useListenerWidgetsStore,
  type ListenerWidgetSurface,
} from '../stores/listenerWidgetsStore';
import { NewsArticleDialog } from './NewsArticleDialog';
import { NewsSourcesDialog } from './NewsSourcesDialog';
import { PlatformNewsDialog } from './PlatformNewsDialog';
import { StoryTitleButton } from './StoryTitleButton';

const CAROUSEL_LIMIT = 12;

type LoadState = {
  articles: AggregatedArticle[];
  platformPosts: Announcement[];
  failed: string[];
  loading: boolean;
};

/** Tahti platform news plus every optional RSS source on this page. */
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
  const tahtiLabel = t('feedStory.fromTahti');
  const [state, setState] = useState<LoadState>({
    articles: [],
    platformPosts: [],
    failed: [],
    loading: true,
  });
  const [open, setOpen] = useState<AggregatedArticle | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState((previous) => ({ ...previous, loading: true }));
    void Promise.all([
      fetchAnnouncements(),
      ...sourcesRef.current.map(async (source) => {
        const result = await fetchRssArticles(source.url);
        return {
          source,
          articles: result.data,
          failed: result.data.length === 0 && Boolean(result.meta.reason),
        };
      }),
    ]).then(([platform, ...feeds]) => {
      if (cancelled) {
        return;
      }
      const platformFailed =
        Boolean(platform.meta.reason) &&
        !isForceMock() &&
        platform.data.length === 0;
      const platformPosts = platformFailed ? [] : platform.data;
      const rssFeeds = feeds as Array<{
        source: (typeof sources)[number];
        articles: Awaited<ReturnType<typeof fetchRssArticles>>['data'];
        failed: boolean;
      }>;
      setState({
        platformPosts,
        articles: aggregateNews(
          [
            announcementsAsNewsFeed(platformPosts, tahtiLabel),
            ...rssFeeds.map(({ source, articles }) => ({ source, articles })),
          ],
          40,
        ),
        failed: [
          ...(platformFailed ? [tahtiLabel] : []),
          ...rssFeeds
            .filter((feed) => feed.failed)
            .map((feed) => feed.source.label),
        ],
        loading: false,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [sourceKey, tahtiLabel]);

  const openPlatform =
    open && isTahtiPlatformNewsSource(open.source.id)
      ? (state.platformPosts.find((post) => post.id === open.id) ?? null)
      : null;

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
      {openPlatform ? (
        <PlatformNewsDialog
          key={openPlatform.id}
          post={openPlatform}
          onClose={() => setOpen(null)}
          onUpdated={(updated) => {
            setState((previous) => ({
              ...previous,
              platformPosts: previous.platformPosts.map((post) =>
                post.id === updated.id ? updated : post,
              ),
              articles: previous.articles.map((article) =>
                article.id === updated.id &&
                isTahtiPlatformNewsSource(article.source.id)
                  ? {
                      ...article,
                      title: updated.headline,
                      teaser: updated.summary,
                      imageUrl: updated.imageUrl || '/news-opening.svg',
                      paragraphs: updated.summary
                        .split(/\n\s*\n/)
                        .filter(Boolean),
                    }
                  : article,
              ),
            }));
            setOpen(null);
          }}
        />
      ) : (
        <NewsArticleDialog
          article={open}
          feedLabel={open?.source.label ?? 'News'}
          fallbackImageUrl={open?.source.thumbnailUrl}
          onClose={() => setOpen(null)}
        />
      )}
      <NewsSourcesDialog isOpen={editing} onClose={() => setEditing(false)} />
    </div>
  );
}
