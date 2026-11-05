import { Link } from '@tanstack/react-router';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, ButtonAnchor, Dialog, MediaArtwork } from '@tahti-player/ui';

import {
  fetchCommunityStory,
  POST_CATEGORY_LABELS,
  type CommunityStory,
  type CommunityStoryDetail,
} from '../../api/community-stories';
import { storyDate } from '../../lib/storyDate';
import { PageError, PageLoading } from '../PageStates';

type Load =
  | { state: 'loading' }
  | { state: 'error'; reason: string }
  | { state: 'ready'; story: CommunityStoryDetail };

/** Strips the light Markdown artists use so the post reads as text. */
function plainParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) =>
      paragraph
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/(\*\*|__|\*|_|`)/g, '')
        .replace(/^#+\s*/gm, '')
        .trim(),
    )
    .filter(Boolean);
}

/** Reads a community story inside Tahti, like a news article: the full
 * post, its images and link, the author, and the other community updates
 * to move on to without closing. */
export function CommunityStoryDialog({
  stories,
  openId,
  onOpen,
  onClose,
}: {
  stories: CommunityStory[];
  openId: string | null;
  onOpen: (id: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation('web');
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!openId) {
      return;
    }
    let cancelled = false;
    setLoad({ state: 'loading' });
    void fetchCommunityStory(openId).then(({ data, meta }) => {
      if (cancelled) {
        return;
      }
      setLoad(
        data
          ? { state: 'ready', story: data }
          : { state: 'error', reason: meta.reason ?? 'Story not found' },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [openId, attempt]);

  const index = stories.findIndex((story) => story.id === openId);
  const previous = index > 0 ? stories[index - 1] : undefined;
  const next = index >= 0 ? stories[index + 1] : undefined;
  const others = stories.filter((story) => story.id !== openId).slice(0, 6);

  return (
    <Dialog.Root
      isOpen={openId != null}
      onClose={onClose}
      className="max-w-2xl"
    >
      {openId ? (
        <div className="flex flex-col gap-4" data-testid="community-story">
          {load.state === 'loading' ? (
            <>
              <Dialog.Title>Community story</Dialog.Title>
              <PageLoading label={t('loading.loadingStory')} />
            </>
          ) : load.state === 'error' ? (
            <>
              <Dialog.Title>Community story</Dialog.Title>
              <PageError
                title={t('loadErrors.couldNotLoadThisStory')}
                description={load.reason}
                onRetry={() => setAttempt((n) => n + 1)}
              />
            </>
          ) : (
            <StoryBody story={load.story} onClose={onClose} />
          )}

          {others.length > 0 ? (
            <section
              aria-label="More community updates"
              className="border-border flex flex-col gap-2 border-t pt-3"
            >
              <h3 className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
                More community updates
              </h3>
              <ul className="flex flex-col gap-1">
                {others.map((story) => (
                  <li key={story.id}>
                    <Button
                      variant="text"
                      size="flexible"
                      className="hover:bg-background-secondary flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left active:scale-100"
                      onClick={() => onOpen(story.id)}
                    >
                      <MediaArtwork
                        size="sm"
                        src={
                          story.imageUrl ?? story.author.avatarUrl ?? undefined
                        }
                        alt=""
                        className="shrink-0 rounded"
                        imageReveal={false}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {story.title ?? story.excerpt}
                        </span>
                        <span className="text-foreground-secondary block truncate text-xs">
                          {POST_CATEGORY_LABELS[story.category] ?? 'Story'} ·{' '}
                          {story.author.displayName || story.author.username} ·{' '}
                          {storyDate(story.publishAt)}
                        </span>
                      </span>
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <Dialog.Actions>
            <Button
              variant="secondary"
              size="sm"
              disabled={!previous}
              onClick={() => previous && onOpen(previous.id)}
            >
              <ChevronLeftIcon size={14} aria-hidden className="mr-1" />
              Newer
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!next}
              onClick={() => next && onOpen(next.id)}
            >
              Older
              <ChevronRightIcon size={14} aria-hidden className="ml-1" />
            </Button>
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Actions>
        </div>
      ) : null}
    </Dialog.Root>
  );
}

function StoryBody({
  story,
  onClose,
}: {
  story: CommunityStoryDetail;
  onClose: () => void;
}) {
  const author = story.author.displayName || story.author.username;
  const images =
    story.images.length > 0
      ? story.images
      : story.imageUrl
        ? [story.imageUrl]
        : [];
  const paragraphs = plainParagraphs(story.body);
  return (
    <>
      <div className="flex flex-col gap-2 pr-8">
        <Dialog.Title>{story.title ?? `${author}’s story`}</Dialog.Title>
        <Dialog.Description>
          {POST_CATEGORY_LABELS[story.category] ?? 'Story'} ·{' '}
          <time dateTime={story.publishAt}>{storyDate(story.publishAt)}</time>
        </Dialog.Description>
        <Link
          to="/u/$username"
          params={{ username: story.author.username }}
          onClick={onClose}
          className="text-foreground-secondary hover:text-foreground flex w-fit items-center gap-2 text-sm"
        >
          <span className="size-6 shrink-0 overflow-hidden rounded-full">
            <MediaArtwork
              src={story.author.avatarUrl ?? undefined}
              alt=""
              seed={story.author.username}
              size="fill"
            />
          </span>
          {author}
        </Link>
      </div>
      {images.length > 0 ? (
        <div className="flex snap-x gap-2 overflow-x-auto">
          {images.map((src) => (
            <div
              key={src}
              className="relative aspect-video w-full shrink-0 snap-start overflow-hidden rounded-md"
            >
              <MediaArtwork src={src} alt="" size="fill" imageReveal={false} />
            </div>
          ))}
        </div>
      ) : null}
      <div className="border-primary/40 flex max-h-[40vh] flex-col gap-4 overflow-y-auto border-l-4 pl-4 text-base leading-relaxed">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="whitespace-pre-line">
            {paragraph}
          </p>
        ))}
      </div>
      {story.linkUrl ? (
        <ButtonAnchor
          href={story.linkUrl}
          target="_blank"
          rel="noreferrer noopener"
          variant="secondary"
          className="w-fit"
        >
          {story.linkLabel || 'Open link'}
          <ExternalLinkIcon size={14} aria-hidden className="ml-1.5" />
        </ButtonAnchor>
      ) : null}
    </>
  );
}
