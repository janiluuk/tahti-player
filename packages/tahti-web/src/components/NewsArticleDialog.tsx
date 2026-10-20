import { ExternalLinkIcon } from 'lucide-react';

import { ButtonAnchor, Dialog, MediaArtwork } from '@tahti-player/ui';

import type { RssArticle } from '../lib/parseRss';

const hostOf = (link: string) => {
  try {
    return new URL(link).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/** Reads an RSS article inside Tahti. Opening the source site in a new tab
 * left no way back, so the full text shows here with Close, and the
 * original is one click away. */
export function NewsArticleDialog({
  article,
  feedLabel,
  fallbackImageUrl,
  onClose,
}: {
  article: RssArticle | null;
  feedLabel: string;
  fallbackImageUrl?: string;
  onClose: () => void;
}) {
  const host = article?.link ? hostOf(article.link) : null;
  const imageUrl = article?.imageUrl ?? fallbackImageUrl;
  const paragraphs =
    article?.paragraphs ?? (article?.teaser ? [article.teaser] : []);

  return (
    <Dialog.Root
      isOpen={article != null}
      onClose={onClose}
      className="max-w-2xl"
    >
      <Dialog.XClose />
      {article ? (
        <div className="flex flex-col gap-4" data-testid="news-article">
          <div className="flex flex-col gap-1 pr-8">
            <Dialog.Title>{article.title}</Dialog.Title>
            <Dialog.Description>
              {[
                feedLabel,
                article.publishedAt && dateLabel(article.publishedAt),
              ]
                .filter(Boolean)
                .join(' · ')}
            </Dialog.Description>
          </div>
          {imageUrl ? (
            <MediaArtwork
              src={imageUrl}
              alt=""
              size="fill"
              className="aspect-video w-full overflow-hidden rounded-md"
            />
          ) : null}
          <div className="flex max-h-[45vh] flex-col gap-3 overflow-y-auto text-sm leading-relaxed">
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))
            ) : (
              <p className="text-foreground-secondary">
                This feed only shares the headline.
              </p>
            )}
          </div>
          <Dialog.Actions>
            {article.link && host ? (
              <ButtonAnchor
                href={article.link}
                target="_blank"
                rel="noreferrer noopener"
                variant="secondary"
              >
                Read on {host}
                <ExternalLinkIcon size={14} aria-hidden className="ml-1.5" />
              </ButtonAnchor>
            ) : null}
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Actions>
        </div>
      ) : null}
    </Dialog.Root>
  );
}
