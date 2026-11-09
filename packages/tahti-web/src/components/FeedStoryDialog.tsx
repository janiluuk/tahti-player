import { Link } from '@tanstack/react-router';
import { ExternalLinkIcon, XIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Button,
  ButtonAnchor,
  Dialog,
  MediaArtwork,
} from '@tahti-player/ui';

import { storyDate, storyDateTitle } from '../lib/storyDate';

export type FeedStory = {
  id: string;
  /** Short type label, e.g. "News", "Post", "New track". */
  kind: string;
  title: string;
  publishedAt?: string;
  /** Where it came from when no person is behind it, e.g. a feed name. */
  source?: string;
  author?: {
    name: string;
    avatarUrl?: string | null;
    username?: string;
  };
  imageUrl?: string | null;
  paragraphs: string[];
  /** Original page, opened in a new tab. */
  link?: string;
  linkLabel?: string;
};

const hostOf = (link: string) => {
  try {
    return new URL(link).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};

export function FeedStoryAuthor({
  author,
  onNavigate,
}: {
  author: NonNullable<FeedStory['author']>;
  onNavigate?: () => void;
}) {
  const row = (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="relative size-8 shrink-0 overflow-hidden rounded-full">
        <MediaArtwork
          src={author.avatarUrl ?? undefined}
          alt=""
          seed={author.username ?? author.name}
          size="fill"
        />
      </span>
      <span className="truncate text-sm font-semibold">{author.name}</span>
    </span>
  );
  return author.username ? (
    <Link
      to="/u/$username"
      params={{ username: author.username }}
      onClick={onNavigate}
      className="w-fit min-w-0 rounded-sm hover:underline"
    >
      {row}
    </Link>
  ) : (
    row
  );
}

/** Body of every feed reader: wide picture, kind and relative date, title,
 * author, the whole text and the actions. Posts, tracks, releases, RSS
 * articles, Tahti news and community stories all read the same way. */
export function FeedStoryArticle({
  story,
  onClose,
  actions,
  footer,
  closeLabel,
}: {
  story: FeedStory;
  onClose: () => void;
  actions?: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
}) {
  const { t } = useTranslation('web');
  const host = story.link ? hostOf(story.link) : null;
  const paragraphs = story.paragraphs.filter(
    (paragraph) => typeof paragraph === 'string' && paragraph.trim() !== '',
  );
  const [lead, ...rest] = paragraphs;

  return (
    <article className="flex flex-col" data-testid="news-article">
      <div className="relative">
        {story.imageUrl ? (
          <div className="bg-background-secondary relative aspect-video w-full">
            <MediaArtwork
              src={story.imageUrl}
              alt={`${story.title} artwork`}
              size="fill"
              imageReveal={false}
            />
          </div>
        ) : (
          <div
            aria-hidden
            className="from-primary/35 via-accent-purple/25 to-accent-blue/30 h-20 w-full bg-gradient-to-br"
          />
        )}
        <Button
          size="icon-sm"
          variant="secondary"
          aria-label={closeLabel ?? t('actions.close')}
          data-testid="dialog-x-close"
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full"
        >
          <XIcon size={16} aria-hidden />
        </Button>
      </div>

      <div className="flex flex-col gap-4 p-6 sm:p-8">
        <div className="text-foreground-secondary flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <Badge variant="pill" color="secondary">
            {story.kind}
          </Badge>
          {story.source ? <span>{story.source}</span> : null}
          {story.source && story.publishedAt ? (
            <span aria-hidden>·</span>
          ) : null}
          {story.publishedAt ? (
            <time
              data-testid="news-published-at"
              dateTime={story.publishedAt}
              title={storyDateTitle(story.publishedAt)}
            >
              {storyDate(story.publishedAt)}
            </time>
          ) : null}
        </div>

        <Dialog.Title className="font-display pr-6 text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">
          {story.title}
        </Dialog.Title>

        {story.author ? (
          <FeedStoryAuthor author={story.author} onNavigate={onClose} />
        ) : null}

        <div className="border-border flex flex-col gap-4 border-t pt-5">
          {lead ? (
            <>
              <p className="text-lg leading-relaxed font-medium whitespace-pre-line">
                {lead}
              </p>
              {rest.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-foreground-secondary text-base leading-7 whitespace-pre-line"
                >
                  {paragraph}
                </p>
              ))}
            </>
          ) : (
            <p
              className="text-foreground-secondary text-base leading-7"
              data-testid="news-article-fallback"
            >
              {host
                ? t('feedStory.headlineOnlyHost', { host })
                : t('feedStory.headlineOnly')}
            </p>
          )}
        </div>

        {footer}

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          {actions}
          {story.link && host ? (
            <ButtonAnchor
              href={story.link}
              target="_blank"
              rel="noreferrer noopener"
              variant="secondary"
            >
              {story.linkLabel || t('feedStory.readOn', { host })}
              <ExternalLinkIcon size={14} aria-hidden className="ml-1.5" />
            </ButtonAnchor>
          ) : null}
          <Dialog.Close>{closeLabel ?? t('actions.close')}</Dialog.Close>
        </div>
      </div>
    </article>
  );
}

/** The one reader dialog for feed items. */
export function FeedStoryDialog({
  story,
  onClose,
  actions,
  footer,
}: {
  story: FeedStory | null;
  onClose: () => void;
  /** Extra actions next to Close, e.g. Play or Artist page. */
  actions?: ReactNode;
  /** Content between the text and the actions, e.g. an editor. */
  footer?: ReactNode;
}) {
  return (
    <Dialog.Root
      isOpen={story != null}
      onClose={onClose}
      className="max-w-2xl overflow-x-hidden p-0"
      showCloseButton={false}
      aria-label={story?.title}
    >
      {story ? (
        <FeedStoryArticle
          story={story}
          onClose={onClose}
          actions={actions}
          footer={footer}
        />
      ) : null}
    </Dialog.Root>
  );
}
