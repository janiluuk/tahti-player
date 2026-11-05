import { useEffect, useMemo, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { StoryCard, StoryRow } from '@tahti-player/ui';

import {
  POST_CATEGORY_LABELS,
  type CommunityStory,
} from '../api/community-stories';
import { fetchChannelPosts, type ArtistPost } from '../api/studio-extras/posts';
import { storyDate } from '../lib/storyDate';
import { CommunityStoryDialog } from './discover/CommunityStoryDialog';
import { PageEmpty, PageLoading } from './PageStates';

type StoryAuthor = CommunityStory['author'];

const EXCERPT_LENGTH = 180;

function postExcerpt(body: string): string {
  const plain = body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|\*|_|`|^#+\s*)/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > EXCERPT_LENGTH
    ? `${plain.slice(0, EXCERPT_LENGTH).trimEnd()}…`
    : plain;
}

export function artistPostStory(
  post: ArtistPost,
  author: StoryAuthor,
): CommunityStory {
  return {
    id: post.id,
    category: post.category ?? 'STORY',
    title: post.title,
    excerpt: postExcerpt(post.body),
    imageUrl: post.images[0] ?? null,
    publishAt: post.publishAt,
    url: `/u/${author.username}`,
    author,
  };
}

/** One artist's posts as the Discover story-card row, opening each in the
 * community story reader. */
export function ArtistStoryFeed({
  posts,
  author,
  title = 'Stories',
}: {
  posts: ArtistPost[];
  author: StoryAuthor;
  title?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const stories = useMemo(
    () => posts.map((post) => artistPostStory(post, author)),
    [posts, author],
  );
  if (stories.length === 0) {
    return null;
  }
  return (
    <>
      <StoryRow title={title} data-testid="artist-story-feed">
        {stories.map((story, index) => (
          <StoryCard
            key={story.id}
            index={index}
            imageSrc={story.imageUrl}
            meta={[
              POST_CATEGORY_LABELS[story.category] ?? 'Story',
              storyDate(story.publishAt),
            ]
              .filter(Boolean)
              .join(' · ')}
            title={story.title ?? story.excerpt}
            onOpen={() => setOpenId(story.id)}
            openLabel={`Read ${story.title ?? 'story'}`}
            excerpt={story.title ? story.excerpt : undefined}
            authorName={author.displayName || author.username}
            authorAvatarSrc={author.avatarUrl}
          />
        ))}
      </StoryRow>
      <CommunityStoryDialog
        stories={stories}
        openId={openId}
        onOpen={setOpenId}
        onClose={() => setOpenId(null)}
      />
    </>
  );
}

/** The channel page's feed block: loads the channel's public posts. */
export function ChannelStoryFeed({
  slug,
  author,
  editing,
}: {
  slug: string;
  author: StoryAuthor;
  editing: boolean;
}) {
  const { t } = useTranslation('web');
  const [posts, setPosts] = useState<ArtistPost[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    setPosts(null);
    void fetchChannelPosts(slug).then(({ data }) => {
      if (!cancelled) {
        setPosts(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (posts === null) {
    return editing ? <PageLoading label={t('loading.loadingStories')} /> : null;
  }
  if (posts.length === 0) {
    return editing ? (
      <PageEmpty
        title={t('empties.noStoriesYet')}
        description={t('empties.postsYouPublishInStudioShow')}
      />
    ) : null;
  }
  return <ArtistStoryFeed posts={posts} author={author} />;
}
