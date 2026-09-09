import { Link, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeftIcon,
  BookmarkIcon,
  ListMusicIcon,
  ListPlusIcon,
  MusicIcon,
  PencilIcon,
  PlayIcon,
  RadioIcon,
  UsersIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button, EmptyState, Tooltip } from '@tahti-player/ui';

import {
  fetchCollection,
  fetchCollectionSubscription,
  setCollectionSubscription,
} from '../api/client';
import { createJam } from '../api/jam';
import type {
  CollectionSound,
  PublicCollection,
  TahtiPlayable,
} from '../api/types';
import { EmbedButton } from '../components/EmbedButton';
import { EmbedTrackRow } from '../components/EmbedTrackRow';
import {
  EntitySocialHeader,
  type EntitySocialStat,
} from '../components/EntitySocialHeader';
import { PageFrame } from '../components/PageHeader';
import { PageEmpty, PageLoading } from '../components/PageStates';
import { PlayableTrackTable } from '../components/PlayableTrackTable';
import { Eyebrow } from '../components/tahti/Eyebrow';
import { resolveArtworkVisualizerPreset } from '../lib/artworkVisualizer';
import type { EmbedProvider } from '../lib/embedSrc';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { syncDocumentMetadata } from '../lib/seo';
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';

function collectionToPlayables(col: PublicCollection): TahtiPlayable[] {
  const out: TahtiPlayable[] = [];
  for (const item of col.items) {
    const sound = item.sound;
    if (!sound?.audioUrl) {
      continue;
    }
    const isHls = sound.audioUrl.includes('.m3u8');
    out.push({
      id: `sound:${sound.id}`,
      kind: 'sound',
      title: sound.title,
      artist: col.user.displayName,
      coverUrl:
        sound.bannerUrl ??
        col.coverUrl ??
        placeholderArtworkUrl(`${col.slug}:${sound.id}`),
      streamUrl: sound.audioUrl,
      protocol: isHls ? 'hls' : 'https',
      channelSlug: sound.channel?.slug,
    });
  }
  return out;
}

export function CollectionView({ slug }: { slug: string }) {
  const [collection, setCollection] = useState<PublicCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const me = useAuthStore((s) => s.user);
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const isFavorite = useLibraryStore((s) =>
    s.favoritePlaylists.some((item) => item.slug === slug),
  );
  const toggleFavoritePlaylist = useLibraryStore(
    (s) => s.toggleFavoritePlaylist,
  );
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<{
    subscribed: boolean;
    subscriberCount: number;
  } | null>(null);
  const [subscriptionBusy, setSubscriptionBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchCollection(slug).then((res) => {
      if (cancelled) {
        return;
      }
      setCollection(res.data);
      setLoading(false);
      if (res.data) {
        syncDocumentMetadata(window.location.pathname, {
          title: `${res.data.name} by ${res.data.user.displayName} on Tahti`,
          description:
            res.data.description ??
            `Listen to ${res.data.name}, a collection by ${res.data.user.displayName} on Tahti.`,
          image: res.data.coverUrl ?? placeholderArtworkUrl(res.data.slug),
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    void fetchCollectionSubscription(slug).then((result) => {
      if (!cancelled) {
        setSubscription(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const playables = useMemo(
    () => (collection ? collectionToPlayables(collection) : []),
    [collection],
  );

  // Items Tahti references but never hosts — only the provider's own
  // widget can play them, so they can't go through the track table.
  const embedItems = useMemo(() => {
    if (!collection) {
      return [];
    }
    const out: { sound: CollectionSound; provider: EmbedProvider }[] = [];
    for (const item of collection.items) {
      const sound = item.sound;
      if (sound && !sound.audioUrl && sound.embedProvider && sound.embedUri) {
        out.push({ sound, provider: sound.embedProvider });
      }
    }
    return out;
  }, [collection]);

  if (loading) {
    return <PageLoading label="Loading collection…" />;
  }

  if (!collection) {
    return (
      <PageEmpty
        title="Collection not found"
        description="This collection may have been removed or is not available."
      />
    );
  }

  const isOwner = Boolean(me && me.username === collection.user.username);
  const coverUrl =
    collection.coverUrl ?? placeholderArtworkUrl(collection.slug);
  const backdropUrl =
    collection.backdropUrl ??
    collection.slideshowImages?.[0] ??
    collection.videoBackgroundUrl ??
    null;

  const headerStats: EntitySocialStat[] = [
    ...(playables.length > 0
      ? [
          {
            key: 'tracks',
            label: 'Tracks',
            value: playables.length,
            icon: MusicIcon,
          },
        ]
      : []),
    ...(subscription && subscription.subscriberCount > 0
      ? [
          {
            key: 'subscribers',
            label: 'Followers',
            value: subscription.subscriberCount,
            icon: UsersIcon,
          },
        ]
      : []),
  ];

  const playAll = () => {
    const [head, ...rest] = playables;
    if (head) {
      play(head, { enqueueRest: rest });
    }
  };

  const queueAll = () => {
    for (const item of playables) {
      enqueue(item);
    }
  };

  const startJam = async () => {
    if (!me) {
      void navigate({ to: '/login' });
      return;
    }
    try {
      const session = await createJam(slug);
      void navigate({ to: '/jam/$code', params: { code: session.code } });
    } catch {
      toast.error("Couldn't start a Jam for this playlist.");
    }
  };

  const toggleSubscription = async () => {
    if (!subscription || subscriptionBusy) {
      return;
    }
    if (!me) {
      void navigate({ to: '/login' });
      return;
    }
    setSubscriptionBusy(true);
    try {
      setSubscription(
        await setCollectionSubscription(slug, !subscription.subscribed),
      );
    } finally {
      setSubscriptionBusy(false);
    }
  };

  return (
    <PageFrame maxWidth="full">
      <Tooltip content="Back to Listen" side="right">
        <Link
          to="/"
          aria-label="Back to Listen"
          className="text-foreground-secondary hover:bg-background-secondary inline-flex size-8 w-fit items-center justify-center rounded-full"
        >
          <ArrowLeftIcon size={16} aria-hidden />
        </Link>
      </Tooltip>

      <EntitySocialHeader
        title={collection.name}
        imageUrl={coverUrl}
        imageAlt=""
        subtitle={
          <>
            by{' '}
            <Link
              to="/u/$username"
              params={{ username: collection.user.username }}
              className="hover:text-foreground underline-offset-2 hover:underline"
            >
              {collection.user.displayName}
            </Link>
            {collection.collaborative ? ' (collaborative)' : ''}
          </>
        }
        description={collection.description}
        backdropUrl={backdropUrl}
        visualizerPreset={resolveArtworkVisualizerPreset(collection.slug)}
        artworkUrlForVisualizer={coverUrl}
        stats={headerStats}
        actions={
          isOwner ? (
            <Tooltip content="Edit in Studio" side="top">
              <Link to="/studio/collections/$slug" params={{ slug }}>
                <Button
                  variant="secondary"
                  size="icon-sm"
                  className="bg-background border-border rounded-md border-(length:--border-width)"
                  aria-label="Edit in Studio"
                >
                  <PencilIcon size={14} aria-hidden />
                </Button>
              </Link>
            </Tooltip>
          ) : (
            <Tooltip
              content={isFavorite ? 'Remove from favorites' : 'Favorite'}
              side="top"
            >
              <Button
                variant={isFavorite ? 'default' : 'secondary'}
                size="icon-sm"
                className="bg-background border-border rounded-md border-(length:--border-width)"
                aria-pressed={isFavorite}
                aria-label={isFavorite ? 'Favorited' : 'Favorite'}
                onClick={() =>
                  toggleFavoritePlaylist({
                    slug,
                    name: collection.name,
                    ownerUsername: collection.user.username,
                    coverUrl: collection.coverUrl,
                  })
                }
              >
                <BookmarkIcon size={15} aria-hidden />
              </Button>
            </Tooltip>
          )
        }
        data-testid="collection-social-header"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={playAll}
            disabled={playables.length === 0}
          >
            <PlayIcon size={16} aria-hidden className="mr-1.5" />
            Play
          </Button>
          <Tooltip content="Add all to queue" side="top">
            <Button
              variant="secondary"
              size="icon"
              onClick={queueAll}
              disabled={playables.length === 0}
              aria-label="Add all to queue"
            >
              <ListPlusIcon size={16} aria-hidden />
            </Button>
          </Tooltip>
          <EmbedButton target={{ kind: 'collection', slug }} />
          <Button variant="secondary" onClick={() => void startJam()}>
            <RadioIcon size={15} aria-hidden className="mr-1.5" />
            Start a Jam
          </Button>
          {!isOwner ? (
            <Button
              variant={isFavorite ? 'default' : 'secondary'}
              aria-pressed={isFavorite}
              onClick={() =>
                toggleFavoritePlaylist({
                  slug,
                  name: collection.name,
                  ownerUsername: collection.user.username,
                  coverUrl: collection.coverUrl,
                })
              }
            >
              <BookmarkIcon size={15} aria-hidden className="mr-1.5" />
              {isFavorite ? 'Favorited' : 'Favorite'}
            </Button>
          ) : null}
          {!isOwner && collection.isPublic && subscription ? (
            <Button
              variant={subscription.subscribed ? 'default' : 'secondary'}
              onClick={() => void toggleSubscription()}
              disabled={subscriptionBusy}
              aria-pressed={subscription.subscribed}
              title={me ? undefined : 'Sign in to subscribe to this playlist'}
            >
              <BookmarkIcon size={15} aria-hidden className="mr-1.5" />
              {subscription.subscribed ? 'Subscribed' : 'Subscribe'}
              {subscription.subscriberCount > 0
                ? ` (${subscription.subscriberCount})`
                : ''}
            </Button>
          ) : null}
        </div>
      </EntitySocialHeader>

      {playables.length > 0 && (
        <PlayableTrackTable
          items={playables}
          compactActions
          emptyMessage="No tracks yet."
        />
      )}

      {embedItems.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2>
            <Eyebrow>Elsewhere</Eyebrow>
          </h2>
          <ul className="flex flex-col gap-2">
            {embedItems.map(({ sound, provider }) => (
              <EmbedTrackRow
                key={sound.id}
                title={sound.title}
                provider={provider}
                embedUri={sound.embedUri!}
              />
            ))}
          </ul>
        </section>
      )}

      {playables.length === 0 && embedItems.length === 0 && (
        <EmptyState
          icon={<ListMusicIcon size={40} className="opacity-40" />}
          title="No tracks in this playlist"
          description={
            isOwner
              ? 'Add tracks from search results or your library.'
              : "This playlist doesn't have any tracks yet."
          }
        />
      )}

      {collection.items.some((i) => i.release && !i.sound) && (
        <section className="flex flex-col gap-2">
          <h2>
            <Eyebrow>Linked releases</Eyebrow>
          </h2>
          <ul className="text-sm">
            {collection.items
              .filter((i) => i.release)
              .map((i) => (
                <li key={i.release!.id}>
                  {i.release!.smartLinkSlug ? (
                    <Link
                      to="/r/$slug"
                      params={{ slug: i.release!.smartLinkSlug }}
                      className="underline-offset-2 hover:underline"
                    >
                      {i.release!.title}
                    </Link>
                  ) : (
                    i.release!.title
                  )}
                </li>
              ))}
          </ul>
        </section>
      )}
    </PageFrame>
  );
}
