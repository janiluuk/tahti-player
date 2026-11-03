import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Button, StoryCard, StoryRow } from '@tahti-player/ui';

import {
  fetchCommunityStories,
  POST_ACTIVITY_LABELS,
  type CommunityStory,
} from '../../api/community-stories';
import { storyDate } from '../../lib/storyDate';
import { PageEmpty, PageError, PageLoading } from '../PageStates';
import { CommunityStoryDialog } from './CommunityStoryDialog';

type Load =
  | { state: 'loading' }
  | { state: 'error'; reason: string }
  | { state: 'ready'; stories: CommunityStory[] };

/** The newest posts from every artist as wide story cards, at the top of
 * Discover's Feed tab. */
export function CommunityStoriesWidget() {
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoad({ state: 'loading' });
    void fetchCommunityStories().then(({ data, meta }) => {
      if (cancelled) {
        return;
      }
      const reason = meta.source === 'api' ? (meta.reason ?? null) : null;
      setLoad(
        reason && data.length === 0
          ? { state: 'error', reason }
          : { state: 'ready', stories: data },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (load.state !== 'ready' || load.stories.length === 0) {
    return (
      <section
        aria-label="Community stories"
        data-testid="community-stories"
        className="flex flex-col gap-3"
      >
        <h2 className="text-xl font-bold">Community stories</h2>
        {load.state === 'loading' ? (
          <PageLoading label="Loading stories…" />
        ) : load.state === 'error' ? (
          <PageError
            title="Could not load community stories"
            description={load.reason}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        ) : (
          <PageEmpty title="No stories yet. Artists' posts will show up here." />
        )}
      </section>
    );
  }

  return (
    <>
      <StoryRow title="Community stories" data-testid="community-stories">
        {load.stories.map((story, index) => (
          <StoryCard
            key={story.id}
            index={index}
            imageSrc={story.imageUrl}
            kind={POST_ACTIVITY_LABELS[story.category] ?? 'shared a story'}
            date={storyDate(story.publishAt)}
            title={
              <Button
                variant="text"
                size="flexible"
                className="h-auto p-0 text-left text-lg leading-snug font-bold whitespace-normal hover:bg-transparent hover:underline active:scale-100"
                onClick={() => setOpenId(story.id)}
              >
                {story.title ?? story.excerpt}
              </Button>
            }
            onOpen={() => setOpenId(story.id)}
            openLabel={`Read ${story.title ?? 'story'}`}
            excerpt={story.title ? story.excerpt : undefined}
            authorName={story.author.displayName || story.author.username}
            authorAvatarSrc={story.author.avatarUrl}
            renderAuthor={(row) => (
              <Link
                to="/u/$username"
                params={{ username: story.author.username }}
                className="hover:text-foreground w-fit"
              >
                {row}
              </Link>
            )}
          />
        ))}
      </StoryRow>
      <CommunityStoryDialog
        stories={load.stories}
        openId={openId}
        onOpen={setOpenId}
        onClose={() => setOpenId(null)}
      />
    </>
  );
}
