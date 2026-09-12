import { Link } from '@tanstack/react-router';
import { useEffect, useState, type ReactNode } from 'react';

import {
  Button,
  CardsRow,
  ImageReveal,
  MediaArtwork,
  SectionShell,
  ViewShell,
  type CardsRowItem,
} from '@tahti-player/ui';

import { fetchArtistPlayables, fetchFeed, fetchProfile } from '../api/client';
import type {
  FeedItem,
  PublicProfileRelease,
  TahtiPlayable,
} from '../api/types';
import { PageEmpty, PageLoading } from '../components/PageStates';
import { releasePlayables } from '../components/ReleaseTracklistDialog';
import { TrackInfoDialog, type TrackInfo } from '../components/TrackInfoDialog';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { usePlayerStore } from '../stores/playerStore';

type FeedCardItem = CardsRowItem & { feedItem: FeedItem };

function formatFeedDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}

function feedBadge(item: FeedItem): string {
  if (item.kind === 'post') {
    return 'posted';
  }
  if (item.kind === 'track') {
    return 'shared a track';
  }
  return `released a ${item.releaseType.replace(/_/g, ' ').toLowerCase()}`;
}

function ArtistAvatar({ name, src }: { name: string; src: string | null }) {
  return (
    <div className="bg-surface-secondary flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold">
      <ImageReveal
        src={src ?? undefined}
        alt=""
        className="size-full"
        placeholder={<span>{name.slice(0, 2).toUpperCase()}</span>}
      />
    </div>
  );
}

function FeedItemHeader({ item }: { item: FeedItem }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Link to="/u/$username" params={{ username: item.artist.username }}>
        <ArtistAvatar
          name={item.artist.displayName}
          src={item.artist.avatarUrl}
        />
      </Link>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
        <Link
          to="/u/$username"
          params={{ username: item.artist.username }}
          className="font-medium underline-offset-2 hover:underline"
        >
          {item.artist.displayName}
        </Link>
        <span className="text-foreground-secondary text-xs">
          {feedBadge(item)}
        </span>
        <span className="text-foreground-secondary text-xs">
          {formatFeedDate(item.date)}
        </span>
      </div>
    </div>
  );
}

export function FeedView({ embedded = false }: { embedded?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
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
    void fetchFeed().then((res) => {
      setItems(res.data.items);
      setFollowingCount(res.data.followingCount);
      setLoading(false);
      const tracks = res.data.items.filter(
        (item): item is Extract<FeedItem, { kind: 'track' }> =>
          item.kind === 'track' && !item.audioUrl,
      );
      void Promise.all(
        tracks.map(async (item) => {
          const result = await fetchArtistPlayables(item.artist.username);
          const playable =
            result.data.find(
              (candidate) => candidate.id === `sound:${item.id}`,
            ) ??
            result.data.find((candidate) => candidate.title === item.title);
          return playable ? ([item.id, playable] as const) : null;
        }),
      ).then((resolved) => {
        setFeedPlayables(
          Object.fromEntries(
            resolved.filter(
              (entry): entry is readonly [string, TahtiPlayable] =>
                entry !== null,
            ),
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
  }, [user]);

  const wrapFeed = (body: ReactNode) =>
    embedded ? (
      body
    ) : (
      <ViewShell title="Feed" classes={{ root: 'px-0 pt-0 mx-auto max-w-3xl' }}>
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
          <Button onClick={() => useAuthModalStore.getState().open('login')}>
            Log in
          </Button>
        }
      />,
    );
  }

  const content = (
    <>
      {items.length === 0 ? (
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
            <Link to="/discover" search={{ tab: 'artists' }}>
              <Button size="sm" variant="secondary">
                Discover artists
              </Button>
            </Link>
          }
        />
      ) : (
        <CardsRow<FeedCardItem>
          title="Your feed"
          labels={{
            filterPlaceholder: 'Filter your feed…',
            nothingFound: 'No matches in your feed.',
          }}
          items={items.map((item) => ({
            id: `${item.kind}-${item.id}`,
            title: item.title || item.artist.displayName,
            feedItem: item,
          }))}
          renderItem={({ feedItem: item }) => (
            <div
              style={{ width: 'calc((100vw - 5rem) / 3)', maxWidth: '20rem' }}
              className="group/glow relative"
            >
              <div
                className="bg-primary pointer-events-none absolute -inset-3 rounded-2xl opacity-20 blur-xl"
                aria-hidden
              />
              <div className="border-border bg-background-secondary relative flex h-full min-w-56 flex-col gap-3 rounded-lg border p-4">
                {item.kind !== 'track' && <FeedItemHeader item={item} />}

                <div className="min-w-0 flex-1">
                  {item.kind === 'post' && (
                    <Link
                      to="/u/$username"
                      params={{ username: item.artist.username }}
                      className="hover:bg-background mt-2 block rounded-md text-left"
                    >
                      {item.title && (
                        <div className="text-sm font-medium">{item.title}</div>
                      )}
                      <p className="text-foreground-secondary mt-0.5 text-sm">
                        {item.body}
                      </p>
                    </Link>
                  )}

                  {item.kind === 'track' &&
                    (() => {
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
                        <div className="flex flex-col gap-3">
                          <div className="relative aspect-square w-full overflow-hidden rounded-md">
                            <MediaArtwork
                              size="fill"
                              src={item.bannerUrl}
                              alt={item.title}
                              placeholder={
                                <span className="text-lg font-bold">
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
                              onPlay={
                                playable ? () => play(playable) : undefined
                              }
                              playDisabled={!playable}
                              playLabel={`Play ${item.title}`}
                              onQueue={
                                playable ? () => enqueue(playable) : undefined
                              }
                              queueDisabled={!playable}
                              queueLabel={`Queue ${item.title}`}
                              queueActive={Boolean(
                                playable &&
                                queue.some(
                                  (queueItem) => queueItem.id === playable.id,
                                ),
                              )}
                            />
                            <div
                              className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2 pt-6"
                              aria-hidden
                            />
                            <span className="pointer-events-none absolute right-2 bottom-2 left-2 truncate text-sm font-semibold text-white">
                              {item.title}
                            </span>
                          </div>
                          <FeedItemHeader item={item} />
                        </div>
                      );
                    })()}

                  {item.kind === 'release' &&
                    (() => {
                      const playables = releaseFeedPlayables[item.id] ?? [];
                      const [first, ...rest] = playables;
                      const navigateTo = item.smartLinkSlug
                        ? {
                            to: '/r/$slug' as const,
                            params: { slug: item.smartLinkSlug },
                          }
                        : {
                            to: '/u/$username' as const,
                            params: { username: item.artist.username },
                          };
                      return (
                        <div className="flex flex-col gap-3">
                          <div className="relative aspect-square w-full overflow-hidden rounded-md">
                            <MediaArtwork
                              size="fill"
                              src={item.artworkUrl}
                              alt={item.title}
                              placeholder={
                                <span className="text-lg font-bold">
                                  {item.title.slice(0, 2).toUpperCase()}
                                </span>
                              }
                              onPlay={
                                first
                                  ? () => play(first, { enqueueRest: rest })
                                  : undefined
                              }
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
                            <div
                              className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2 pt-6"
                              aria-hidden
                            />
                            <Link
                              to={navigateTo.to}
                              params={navigateTo.params}
                              className="absolute right-2 bottom-2 left-2 truncate text-sm font-semibold text-white hover:underline"
                            >
                              {item.title}
                            </Link>
                          </div>
                          <FeedItemHeader item={item} />
                        </div>
                      );
                    })()}
                </div>
              </div>
            </div>
          )}
        />
      )}

      <TrackInfoDialog
        isOpen={Boolean(infoTrack)}
        onClose={() => setInfoTrack(null)}
        track={infoTrack}
      />
    </>
  );

  return embedded ? (
    <SectionShell title="Your feed">{content}</SectionShell>
  ) : (
    wrapFeed(content)
  );
}
