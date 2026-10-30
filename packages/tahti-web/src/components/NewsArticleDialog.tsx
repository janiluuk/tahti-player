import { CalendarDaysIcon, ExternalLinkIcon } from 'lucide-react';

import { ButtonAnchor, Dialog, MediaArtwork } from '@tahti-player/ui';

import { humanizePastDate } from '../lib/humanizeDate';
import type { RssArticle } from '../lib/parseRss';

const hostOf = (link: string) => {
  try {
    return new URL(link).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};

/** Reads an RSS article inside Tahti. Opening the source site in a new tab
 * left no way back, so the full text shows here with Close, and the
 * original is one click away. */
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
  footer?: import('react').ReactNode;
}) {
  const host = article?.link ? hostOf(article.link) : null;
  const imageUrl = article?.imageUrl ?? fallbackImageUrl;
  const rawParagraphs =
    article?.paragraphs ?? (article?.teaser ? [article.teaser] : []);
  const paragraphs = rawParagraphs.filter(
    (paragraph) => typeof paragraph === 'string' && paragraph.trim() !== '',
  );
  const canOpenSource = Boolean(article?.link && host);

  return (
    <Dialog.Root
      isOpen={article != null}
      onClose={onClose}
      className="max-w-2xl"
    >
      {article ? (
        <div className="flex flex-col gap-4" data-testid="news-article">
          <div className="flex flex-col gap-1 pr-8">
            <Dialog.Title>{article.title}</Dialog.Title>
            <Dialog.Description>
              {feedLabel}
              {article.publishedAt ? (
                <span className="mt-2 flex items-center gap-1.5">
                  <CalendarDaysIcon size={14} aria-hidden />
                  <time
                    data-testid="news-published-at"
                    dateTime={article.publishedAt}
                    title={new Date(article.publishedAt).toLocaleString()}
                  >
                    {humanizePastDate(article.publishedAt)}
                  </time>
                </span>
              ) : null}
            </Dialog.Description>
          </div>
          {imageUrl ? (
            <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-md">
              <MediaArtwork
                src={imageUrl}
                alt={`${article.title} artwork`}
                size="fill"
                imageReveal={false}
              />
            </div>
          ) : null}
          <div className="border-primary/40 flex max-h-[45vh] flex-col gap-4 overflow-y-auto border-l-4 pl-4 text-base leading-relaxed">
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))
            ) : (
              <p
                className="text-foreground-secondary"
                data-testid="news-article-fallback"
              >
                {canOpenSource
                  ? `This feed only shares the headline, or the article text could not be read. Read the full story on ${host}.`
                  : 'This feed only shares the headline, and the article text could not be read.'}
              </p>
            )}
          </div>
          {footer}
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
