import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog, MediaArtwork } from '@tahti-player/ui';

import {
  fetchCommunityStory,
  POST_CATEGORY_LABELS,
  type CommunityStory,
  type CommunityStoryDetail,
} from '../../api/community-stories';
import { storyDate } from '../../lib/storyDate';
import { FeedStoryArticle, type FeedStory } from '../FeedStoryDialog';
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

  const othersList =
    others.length > 0 ? (
      <section
        aria-label={t('communityStoryDialog.moreCommunityUpdates')}
        className="border-border flex flex-col gap-2 border-t pt-4"
      >
        <h3 className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
          {t('communityStoryDialog.moreCommunityUpdates')}
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
                  src={story.imageUrl ?? story.author.avatarUrl ?? undefined}
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
    ) : null;

  const pager = (
    <>
      <Button
        variant="secondary"
        size="sm"
        disabled={!previous}
        onClick={() => previous && onOpen(previous.id)}
      >
        <ChevronLeftIcon size={14} aria-hidden className="mr-1" />
        {t('communityStoryDialog.newer')}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={!next}
        onClick={() => next && onOpen(next.id)}
      >
        {t('communityStoryDialog.older')}
        <ChevronRightIcon size={14} aria-hidden className="ml-1" />
      </Button>
    </>
  );

  return (
    <Dialog.Root
      isOpen={openId != null}
      onClose={onClose}
      className="max-w-2xl overflow-x-hidden p-0"
      showCloseButton={false}
    >
      {openId ? (
        <div data-testid="community-story">
          {load.state === 'ready' ? (
            <FeedStoryArticle
              story={toFeedStory(load.story)}
              onClose={onClose}
              closeLabel={t('communityStoryDialog.close')}
              actions={pager}
              footer={
                <>
                  <ExtraImages story={load.story} />
                  {othersList}
                </>
              }
            />
          ) : (
            <div className="flex flex-col gap-4 p-6">
              <Dialog.Title>
                {t('communityStoryDialog.communityStory')}
              </Dialog.Title>
              {load.state === 'loading' ? (
                <PageLoading label={t('loading.loadingStory')} />
              ) : (
                <PageError
                  title={t('loadErrors.couldNotLoadThisStory')}
                  description={load.reason}
                  onRetry={() => setAttempt((n) => n + 1)}
                />
              )}
              {othersList}
              <Dialog.Actions>
                {pager}
                <Dialog.Close>{t('communityStoryDialog.close')}</Dialog.Close>
              </Dialog.Actions>
            </div>
          )}
        </div>
      ) : null}
    </Dialog.Root>
  );
}

function storyImages(story: CommunityStoryDetail): string[] {
  return story.images.length > 0
    ? story.images
    : story.imageUrl
      ? [story.imageUrl]
      : [];
}

function toFeedStory(story: CommunityStoryDetail): FeedStory {
  const author = story.author.displayName || story.author.username;
  return {
    id: story.id,
    kind: POST_CATEGORY_LABELS[story.category] ?? 'Story',
    title: story.title ?? `${author}’s story`,
    publishedAt: story.publishAt,
    author: {
      name: author,
      avatarUrl: story.author.avatarUrl,
      username: story.author.username,
    },
    imageUrl: storyImages(story)[0] ?? null,
    paragraphs: plainParagraphs(story.body),
    link: story.linkUrl ?? undefined,
    linkLabel: story.linkLabel ?? undefined,
  };
}

function ExtraImages({ story }: { story: CommunityStoryDetail }) {
  const extra = storyImages(story).slice(1);
  if (extra.length === 0) {
    return null;
  }
  return (
    <div className="flex snap-x gap-2 overflow-x-auto">
      {extra.map((src) => (
        <div
          key={src}
          className="relative aspect-video w-4/5 shrink-0 snap-start overflow-hidden rounded-md"
        >
          <MediaArtwork src={src} alt="" size="fill" imageReveal={false} />
        </div>
      ))}
    </div>
  );
}
