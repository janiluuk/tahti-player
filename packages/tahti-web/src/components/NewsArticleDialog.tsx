import type { ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';

import type { RssArticle } from '../lib/parseRss';
import { FeedStoryDialog } from './FeedStoryDialog';

/** Reads an RSS or Tahti news article inside Tahti, with the original one
 * click away. */
export function NewsArticleDialog({
  article,
  feedLabel,
  fallbackImageUrl,
  onClose,
  footer,
}: {
  article: RssArticle | null;
  feedLabel: string;
  fallbackImageUrl?: string;
  onClose: () => void;
  footer?: ReactNode;
}) {
  const { t } = useTranslation('web');
  return (
    <FeedStoryDialog
      story={
        article
          ? {
              id: article.id,
              kind: t('feedStory.news'),
              title: article.title,
              publishedAt: article.publishedAt,
              source: feedLabel,
              imageUrl: article.imageUrl ?? fallbackImageUrl,
              paragraphs:
                article.paragraphs ?? (article.teaser ? [article.teaser] : []),
              link: article.link,
            }
          : null
      }
      onClose={onClose}
      footer={footer}
    />
  );
}
