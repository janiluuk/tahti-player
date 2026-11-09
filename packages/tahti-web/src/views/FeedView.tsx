import { Link } from '@tanstack/react-router';
import { PlayIcon } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import {
  Button,
  ButtonLink,
  MediaArtwork,
  StoryCard,
  StoryRow,
  ViewShell,
} from '@tahti-player/ui';

import { fetchArtistPlayables, fetchFeed, fetchProfile } from '../api/client';
import {
  POST_ACTIVITY_LABELS,
  POST_CATEGORY_LABELS,
} from '../api/community-stories';
import type {
  FeedItem,
  PublicProfileRelease,
  TahtiPlayable,
} from '../api/types';
import { FeedStoryDialog, type FeedStory } from '../components/FeedStoryDialog';
import { LatestNewsWidget } from '../components/LatestNewsWidget';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from '../components/PageStates';
import { releasePlayables } from '../components/ReleaseTracklistDialog';
import { StoryTitleButton } from '../components/StoryTitleButton';
import { storyDate } from '../lib/storyDate';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { usePlayerStore } from '../stores/playerStore';

const RELEASE_ACTIVITY: Record<string, string> = {
  SINGLE: 'released a single',
  EP: 'released an EP',
  ALBUM: 'released an album',
  COMPILATION: 'released a compilation',
  REMIX: 'released a remix',
};

function feedActivity(item: FeedItem): string {
  if (item.kind === 'post') {
    return item.category
      ? POST_ACTIVITY_LABELS[item.category]
      : 'shared a story';
  }
  if (item.kind === 'track') {
    return 'released a track';
  }
  return RELEASE_ACTIVITY[item.releaseType] ?? 'released new music';
}

const RELEASE_KINDS: Record<string, string> = {
  SINGLE: 'Single',
  EP: 'EP',
  ALBUM: 'Album',
  COMPILATION: 'Compilation',
  REMIX: 'Remix',
};

function feedStory(item: FeedItem, t: TFunction<'web'>): FeedStory {
  const name = item.artist.displayName || item.artist.username;
  const author = {
    name,
    avatarUrl: item.artist.avatarUrl,
    username: item.artist.username,
  };
  if (item.kind === 'post') {
    return {
      id: item.id,
      kind: item.category ? POST_CATEGORY_LABELS[item.category] : 'Story',
      title: item.title || t('feedStory.postedUpdate', { name }),
      publishedAt: item.date,
      author,
      imageUrl: item.images?.[0] ?? null,
      paragraphs: item.body.split(/\n\s*\n/),
      link: item.linkUrl ?? undefined,
      linkLabel: item.linkLabel ?? undefined,
    };
  }
  return {
    id: item.id,
    kind:
      item.kind === 'track'
        ? 'Track'
        : (RELEASE_KINDS[item.releaseType] ?? 'Release'),
    title: item.title,
    publishedAt: item.date,
    author,
    imageUrl: item.kind === 'track' ? item.bannerUrl : item.artworkUrl,
    paragraphs: [
      item.kind === 'track'
        ? t('feedStory.sharedTrack', { name, title: item.title })
        : t('feedStory.releasedSomething', { name, title: item.title }),
      t('feedStory.playOrOpen'),
    ],
  };
}

export function FeedView({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [openItem, setOpenItem] = useState<FeedItem | null>(null);
  const [feedPlayables, setFeedPlayables] = useState<
    Record<string, TahtiPlayable>
  >({});
  const [releaseFeedPlayables, setReleaseFeedPlayables] = useState<
    Record<string, TahtiPlayable[]>
  >({});
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const queue = usePlayerStore((s) => s.queue);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    void fetchFeed().then((res) => {
      setItems(res.data.items);
      setFollowingCount(res.data.followingCount);
      setLoadError(
        res.meta.source === 'api' ? (res.meta.reason ?? null) : null,
      );
      setLoading(false);
      const tracks = res.data.items.filter(
        (item): item is Extract<FeedItem, { kind: 'track' }> =>
          item.kind === 'track' && !item.audioUrl,
      );
      const trackUsernames = [
        ...new Set(tracks.map((item) => item.artist.username)),
      ];
      // One playables fetch per artist, then map each track — avoids N+1.
      void Promise.all(
        trackUsernames.map(async (username) => {
          const result = await fetchArtistPlayables(username);
          return [username, result.data] as const;
        }),
      ).then((entries) => {
        const byUsername = new Map(entries);
        setFeedPlayables(
          Object.fromEntries(
            tracks.flatMap((item) => {
              const catalog = byUsername.get(item.artist.username) ?? [];
              const playable =
                catalog.find(
                  (candidate) => candidate.id === `sound:${item.id}`,
                ) ??
                catalog.find((candidate) => candidate.title === item.title);
              return playable ? [[item.id, playable]] : [];
            }),
          ),
        );
      });

      const releases = res.data.items.filter(
        (item): item is Extract<FeedItem, { kind: 'release' }> =>
          item.kind === 'release',
      );
      const usernames = [
        ...new Set(releases.map((item) => item.artist.username)),
      ];
      void Promise.all(
        usernames.map((username) =>
          fetchProfile(username)
            .then(
              (result) =>
                [username, result.data.releases] as [
                  string,
                  PublicProfileRelease[],
                ],
            )
            .catch(() => [username, []] as [string, PublicProfileRelease[]]),
        ),
      ).then((profiles) => {
        const releasesByUsername = new Map(profiles);
        setReleaseFeedPlayables(
          Object.fromEntries(
            releases.flatMap((item) => {
              const artistReleases =
                releasesByUsername.get(item.artist.username) ?? [];
              const release = artistReleases.find((r) => r.id === item.id);
              if (!release) {
                return [];
              }
              const playables = releasePlayables(
                release,
                item.artist.displayName,
              );
              return playables.length > 0 ? [[item.id, playables]] : [];
            }),
          ),
        );
      });
    });
  }, [user, attempt]);

  const wrapFeed = (body: ReactNode) =>
    embedded ? (
      body
    ) : (
      <ViewShell title={t('feedView.feed')} classes={{ root: 'px-0 pt-0' }}>
        {body}
      </ViewShell>
    );

  if (!hydrated || (user && loading)) {
    return wrapFeed(<PageLoading label={t('loading.loadingYourFeed')} />);
  }

  if (!user) {
    return wrapFeed(
      <PageEmpty
        icon="inbox"
        title={t('empties.signInToSeeYourFeed')}
        description={t('empties.followArtistsToBuildAPersonal')}
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={() => useAuthModalStore.getState().open('login')}>
              {t('feedView.logIn')}
            </Button>
            <ButtonLink
              to="/discover"
              search={{ tab: 'artists' }}
              size="sm"
              variant="secondary"
            >
              {t('feedView.discoverArtists')}
            </ButtonLink>
          </div>
        }
      />,
    );
  }

  const feedTarget = (item: FeedItem) =>
    item.kind === 'release' && item.smartLinkSlug
      ? { to: '/r/$slug' as const, params: { slug: item.smartLinkSlug } }
      : item.kind === 'track'
        ? {
            to: '/channel/$slug' as const,
            params: { slug: item.channelSlug },
          }
        : {
            to: '/u/$username' as const,
            params: { username: item.artist.username },
          };

  const trackPlayable = (
    item: Extract<FeedItem, { kind: 'track' }>,
  ): TahtiPlayable | null =>
    item.audioUrl
      ? {
          id: `sound:${item.id}`,
          kind: 'sound',
          title: item.title,
          artist: item.artist.displayName,
          coverUrl: item.bannerUrl ?? undefined,
          streamUrl: item.audioUrl,
          protocol: 'https',
          channelSlug: item.channelSlug,
        }
      : (feedPlayables[item.id] ?? null);

  const feedMedia = (item: FeedItem): ReactNode => {
    if (item.kind === 'post') {
      return undefined;
    }
    if (item.kind === 'track') {
      const playable = trackPlayable(item);
      return (
        <MediaArtwork
          size="fill"
          src={item.bannerUrl}
          alt=""
          seed={item.id}
          onArtworkClick={() => setOpenItem(item)}
          onPlay={playable ? () => play(playable) : undefined}
          playDisabled={!playable}
          playLabel={`Play ${item.title}`}
          onQueue={playable ? () => enqueue(playable) : undefined}
          queueDisabled={!playable}
          queueLabel={`Queue ${item.title}`}
          queueActive={Boolean(
            playable && queue.some((queueItem) => queueItem.id === playable.id),
          )}
        />
      );
    }
    const [first, ...rest] = releaseFeedPlayables[item.id] ?? [];
    return (
      <MediaArtwork
        size="fill"
        src={item.artworkUrl}
        alt=""
        seed={item.smartLinkSlug ?? item.id}
        onArtworkClick={() => setOpenItem(item)}
        onPlay={first ? () => play(first, { enqueueRest: rest }) : undefined}
        playDisabled={!first}
        playLabel={`Play ${item.title}`}
        onQueue={
          first
            ? () => {
                enqueue(first);
                rest.forEach((p) => enqueue(p));
              }
            : undefined
        }
        queueDisabled={!first}
        queueLabel={`Queue ${item.title}`}
      />
    );
  };

  const storyActions = (item: FeedItem): ReactNode => {
    let play_: ReactNode = null;
    if (item.kind === 'track') {
      const playable = trackPlayable(item);
      play_ = playable ? (
        <Button onClick={() => play(playable)}>
          <PlayIcon size={15} aria-hidden className="mr-1.5" />
          {t('actions.play')}
        </Button>
      ) : null;
    } else if (item.kind === 'release') {
      const [first, ...rest] = releaseFeedPlayables[item.id] ?? [];
      play_ = first ? (
        <Button onClick={() => play(first, { enqueueRest: rest })}>
          <PlayIcon size={15} aria-hidden className="mr-1.5" />
          {t('actions.play')}
        </Button>
      ) : null;
    }
    return (
      <>
        {play_}
        <ButtonLink {...feedTarget(item)} variant="secondary">
          {item.kind === 'post'
            ? t('trackInfo.artistPage')
            : item.kind === 'track'
              ? t('actions.openChannel')
              : t('feedStory.openRelease')}
        </ButtonLink>
      </>
    );
  };

  const storyPager = (item: FeedItem) => {
    const index = items.indexOf(item);
    const newer = index > 0 ? items[index - 1] : undefined;
    const older = index >= 0 ? items[index + 1] : undefined;
    return {
      newer: newer ? () => setOpenItem(newer) : undefined,
      older: older ? () => setOpenItem(older) : undefined,
    };
  };

  const content = (
    <div className="flex min-w-0 flex-col gap-10">
      {loadError && items.length > 0 ? (
        <PageErrorBanner
          title={t('loadErrors.couldNotRefreshYourFeed')}
          description={loadError}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      ) : null}
      {loadError && items.length === 0 ? (
        <PageError
          title={t('loadErrors.couldNotLoadYourFeed')}
          description={loadError}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      ) : items.length === 0 ? (
        <PageEmpty
          icon="inbox"
          title={
            followingCount === 0
              ? "You're not following any artists yet"
              : 'All quiet here'
          }
          description={
            followingCount === 0
              ? 'Discover artists under Discover → Artists, then follow them to fill this feed.'
              : 'New posts, tracks, and releases from artists you follow will show up here.'
          }
          action={
            <ButtonLink
              to="/discover"
              search={{ tab: 'artists' }}
              size="sm"
              variant="secondary"
            >
              {t('feedView.discoverArtists')}
            </ButtonLink>
          }
        />
      ) : (
        <StoryRow title={t('feedView.yourFeed')} data-testid="feed-stories">
          {items.map((item) => (
            <StoryCard
              key={`${item.kind}-${item.id}`}
              data-testid="feed-story"
              imageSrc={
                item.kind === 'post' ? (item.images?.[0] ?? null) : null
              }
              artworkSeed={`${item.kind}-${item.id}`}
              media={feedMedia(item)}
              kind={feedActivity(item)}
              date={storyDate(item.date)}
              dateTime={item.date}
              title={
                <StoryTitleButton onOpen={() => setOpenItem(item)}>
                  {feedStory(item, t).title}
                </StoryTitleButton>
              }
              onOpen={() => setOpenItem(item)}
              openLabel={t('feedStory.readTitle', {
                title: feedStory(item, t).title,
              })}
              excerpt={item.kind === 'post' ? item.body : undefined}
              authorName={item.artist.displayName || item.artist.username}
              authorAvatarSrc={item.artist.avatarUrl}
              renderAuthor={(row) => (
                <Link
                  to="/u/$username"
                  params={{ username: item.artist.username }}
                  className="hover:text-foreground w-fit"
                >
                  {row}
                </Link>
              )}
            />
          ))}
        </StoryRow>
      )}

      <LatestNewsWidget surface="feed" />

      <FeedStoryDialog
        story={openItem ? feedStory(openItem, t) : null}
        onClose={() => setOpenItem(null)}
        actions={openItem ? storyActions(openItem) : null}
        pager={openItem ? storyPager(openItem) : undefined}
      />
    </div>
  );

  return wrapFeed(content);
}
