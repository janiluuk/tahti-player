import { XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Button,
  Loader,
  NewsWidget,
  Tooltip,
  type ArticleCardItem,
} from '@tahti-player/ui';

import { fetchRssArticles } from '../api/rss-feed';
import type { RssArticle } from '../lib/parseRss';
import type { ListenerWidgetInstance } from '../stores/listenerWidgetsStore';
import { NewsArticleDialog } from './NewsArticleDialog';
import { PageError } from './PageStates';

const LABELS = {
  nothingFound: 'No articles in this feed right now.',
};

export function NewsFeedWidget({
  instance,
  onRemove,
}: {
  instance: ListenerWidgetInstance;
  onRemove?: () => void;
}) {
  const [items, setItems] = useState<ArticleCardItem[]>([]);
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
      setItems(
        result.data.map((article) => ({
          id: article.id,
          title: article.title,
          teaser: article.teaser,
          imageUrl: article.imageUrl ?? instance.thumbnailUrl,
          onClick: () => setOpenArticle(article),
        })),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [instance.input, instance.thumbnailUrl, reloadKey]);

  return (
    <div className="relative" data-testid="news-feed-widget">
      {onRemove ? (
        <Tooltip content={`Remove ${instance.label}`} side="top">
          <Button
            size="icon-sm"
            variant="text"
            aria-label={`Remove ${instance.label}`}
            onClick={onRemove}
            className="absolute top-0 right-0 z-10"
          >
            <XIcon size={14} aria-hidden />
          </Button>
        </Tooltip>
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
          title="Couldn’t load this feed"
          description="Check the RSS URL and try again."
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : (
        <NewsWidget
          title={instance.label}
          thumbnailUrl={instance.thumbnailUrl}
          items={items}
          labels={LABELS}
        />
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
