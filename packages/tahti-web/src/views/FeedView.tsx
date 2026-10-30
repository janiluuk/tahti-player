import { Link } from '@tanstack/react-router';
import { useEffect, useState, type ReactNode } from 'react';

import {
  Button,
  ButtonLink,
  MediaArtwork,
  StoryCard,
  StoryRow,
  ViewShell,
} from '@tahti-player/ui';

import { fetchArtistPlayables, fetchFeed, fetchProfile } from '../api/client';
import { POST_CATEGORY_LABELS } from '../api/community-stories';
import type {
  FeedItem,
  PublicProfileRelease,
  TahtiPlayable,
} from '../api/types';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from '../components/PageStates';
import { releasePlayables } from '../components/ReleaseTracklistDialog';
import { TrackInfoDialog, type TrackInfo } from '../components/TrackInfoDialog';
import { storyDate } from '../lib/storyDate';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { usePlayerStore } from '../stores/playerStore';

function formatFeedDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}

const RELEASE_KINDS: Record<string, string> = {
  SINGLE: 'Single',
  EP: 'EP',
  ALBUM: 'Album',
  COMPILATION: 'Compilation',
  REMIX: 'Remix',
};

function feedKind(item: FeedItem): string {
  if (item.kind === 'post') {
    return item.category ? POST_CATEGORY_LABELS[item.category] : 'Post';
  }
  if (item.kind === 'track') {
    return 'New track';
  }
  return RELEASE_KINDS[item.releaseType] ?? 'Release';
}

export function FeedView({ embedded = false }: { embedded?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [infoTrack, setInfoTrack] = useState<TrackInfo | null>(null);
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
      <ViewShell title="Feed" classes={{ root: 'px-0 pt-0' }}>
        {body}
      </ViewShell>
    );

  if (!hydrated || (user && loading)) {
    return wrapFeed(<PageLoading label="Loading your feed…" />);
  }

  if (!user) {
    return wrapFeed(
      <PageEmpty
        icon="inbox"
        title="Sign in to see your feed"
        description="Follow artists to build a personal timeline of what they share."
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={() => useAuthModalStore.getState().open('login')}>
              Log in
            </Button>
            <ButtonLink
              to="/discover"
              search={{ tab: 'artists' }}
              size="sm"
              variant="secondary"
            >
              Discover artists
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

  const feedMedia = (item: FeedItem): ReactNode => {
    if (item.kind === 'post') {
      return undefined;
    }
    if (item.kind === 'track') {
      const playable: TahtiPlayable | null = item.audioUrl
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
      return (
        <MediaArtwork
          size="fill"
          src={item.bannerUrl}
          alt=""
          placeholder={
            <span className="text-2xl font-bold">
              {item.title.slice(0, 2).toUpperCase()}
            </span>
          }
          onArtworkClick={() =>
            setInfoTrack({
              title: item.title,
              artistName: item.artist.displayName,
              artistUsername: item.artist.username,
              artworkUrl: item.bannerUrl,
              meta: formatFeedDate(item.date),
              playable,
            })
          }
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
        placeholder={
          <span className="text-2xl font-bold">
            {item.title.slice(0, 2).toUpperCase()}
          </span>
        }
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

  const content = (
    <>
      {loadError && items.length > 0 ? (
        <PageErrorBanner
          title="Could not refresh your feed."
          description={loadError}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      ) : null}
      {loadError && items.length === 0 ? (
        <PageError
          title="Could not load your feed"
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
              Discover artists
            </ButtonLink>
          }
        />
      ) : (
        <StoryRow title="Your feed" data-testid="feed-stories">
          {items.map((item) => (
            <StoryCard
              key={`${item.kind}-${item.id}`}
              data-testid="feed-story"
              imageSrc={
                item.kind === 'post' ? (item.images?.[0] ?? null) : null
              }
              media={feedMedia(item)}
              meta={`${feedKind(item)} · ${storyDate(item.date)}`}
              title={
                <Link {...feedTarget(item)} className="hover:underline">
                  {item.title || item.artist.displayName}
                </Link>
              }
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

      <TrackInfoDialog
        isOpen={Boolean(infoTrack)}
        onClose={() => setInfoTrack(null)}
        track={infoTrack}
      />
    </>
  );

  return wrapFeed(content);
}
