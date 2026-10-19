import { Link, useNavigate } from '@tanstack/react-router';
import {
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

import {
  backButtonCornerClassName,
  BackButtonLink,
  Button,
  ButtonLink,
  EmptyState,
  Tooltip,
} from '@tahti-player/ui';

import {
  fetchCollection,
  fetchCollectionSubscription,
  setCollectionSubscription,
} from '../api/client';
import {
  contributionLine,
  type ContributionLine,
} from '../api/collection-contribution';
import type { CollectionTextLayer } from '../api/collection-text-layer';
import { createJam } from '../api/jam';
import type {
  EmbedPlaybackProvider,
  PublicCollection,
  TahtiPlayable,
} from '../api/types';
import { ChannelTextOverlayView } from '../components/ChannelTextOverlayView';
import { CollaborativePlaylistAdd } from '../components/CollaborativePlaylistAdd';
import { CollectionContribution } from '../components/CollectionContribution';
import { EmbedButton } from '../components/EmbedButton';
import {
  EntitySocialHeader,
  type EntitySocialStat,
} from '../components/EntitySocialHeader';
import { PageFrame } from '../components/PageHeader';
import { PageEmpty, PageLoading } from '../components/PageStates';
import { PlayableTrackTable } from '../components/PlayableTrackTable';
import { ReportButton } from '../components/ReportButton';
import { RssFeedButton } from '../components/RssFeedButton';
import { Eyebrow } from '../components/tahti/Eyebrow';
import { resolveArtworkVisualizerPreset } from '../lib/artworkVisualizer';
import { toEmbedPlaybackProvider } from '../lib/embedSrc';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { syncDocumentMetadata } from '../lib/seo';
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';

function collectionSoundToPlayable(
  sound: NonNullable<PublicCollection['items'][number]['sound']>,
  col: PublicCollection,
): TahtiPlayable | null {
  const coverUrl =
    sound.bannerUrl ??
    col.coverUrl ??
    placeholderArtworkUrl(`${col.slug}:${sound.id}`);
  if (sound.audioUrl) {
    return {
      id: `sound:${sound.id}`,
      kind: 'sound',
      title: sound.title,
      artist: col.user.displayName,
      coverUrl,
      streamUrl: sound.audioUrl,
      protocol: sound.audioUrl.includes('.m3u8') ? 'hls' : 'https',
      channelSlug: sound.channel?.slug,
    };
  }
  if (sound.embedProvider && sound.embedUri) {
    const provider: EmbedPlaybackProvider = toEmbedPlaybackProvider(
      sound.embedProvider,
    );
    return {
      id: `sound:${sound.id}`,
      kind: 'sound',
      title: sound.title,
      artist: col.user.displayName,
      coverUrl,
      streamUrl: '',
      protocol: 'https',
      channelSlug: sound.channel?.slug,
      sourceProvider: provider,
      embed: { provider, embedUri: sound.embedUri },
    };
  }
  return null;
}

/** Every playable in a collection — both Tahti-hosted tracks and the
 * provider's-own-widget (hearthis.at / Mixcloud / Spotify / Bandcamp)
 * embeds — in original item order, so listeners see one list. */
function collectionToPlayables(col: PublicCollection): TahtiPlayable[] {
  const out: TahtiPlayable[] = [];
  for (const item of col.items) {
    if (!item.sound) {
      continue;
    }
    const playable = collectionSoundToPlayable(item.sound, col);
    if (playable) {
      out.push(playable);
    }
  }
  return out;
}

function contributionsByPlayableId(
  col: PublicCollection,
): Map<string, ContributionLine> {
  const out = new Map<string, ContributionLine>();
  for (const item of col.items) {
    const line = contributionLine(item, col.user.username);
    if (item.sound && line) {
      out.set(`sound:${item.sound.id}`, line);
    }
  }
  return out;
}

export function CollectionView({ slug }: { slug: string }) {
  const [collection, setCollection] = useState<
    (PublicCollection & Partial<CollectionTextLayer>) | null
  >(null);
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

  const contributions = useMemo(
    () =>
      collection
        ? contributionsByPlayableId(collection)
        : new Map<string, ContributionLine>(),
    [collection],
  );

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
    <PageFrame maxWidth="full" className="relative">
      <Tooltip
        content="Back to Listen"
        side="right"
        wrapperClassName={backButtonCornerClassName}
      >
        <BackButtonLink to="/" aria-label="Back to Listen" />
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
              <ButtonLink
                to="/studio/collections/$slug"
                params={{ slug }}
                variant="secondary"
                size="icon-sm"
                aria-label="Edit in Studio"
                className="bg-background border-border rounded-md border-(length:--border-width)"
              >
                <PencilIcon size={14} aria-hidden />
              </ButtonLink>
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
          {collection.isPublic && collection.links?.rss ? (
            <RssFeedButton
              href={collection.links.rss}
              label={`RSS feed of ${collection.name}`}
            />
          ) : null}
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
          {!isOwner && collection.isPublic ? (
            <ReportButton
              targetType="COLLECTION"
              targetId={slug}
              label={collection.name}
            />
          ) : null}
        </div>
      </EntitySocialHeader>

      <ChannelTextOverlayView
        mode={collection.textLayerMode}
        text={collection.textLayerText}
        align={collection.textLayerAlign}
      />

      {playables.length > 0 && (
        <PlayableTrackTable
          items={playables}
          compactActions
          emptyMessage="No tracks yet."
          getAnnotation={(item) => {
            const line = contributions.get(item.id);
            return line ? <CollectionContribution line={line} /> : null;
          }}
        />
      )}

      {playables.length === 0 && (
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

      {collection.collaborative && collection.isPublic ? (
        <CollaborativePlaylistAdd
          slug={collection.slug}
          existingSoundIds={collection.items.flatMap((item) =>
            item.sound ? [item.sound.id] : [],
          )}
          onAdded={() =>
            void fetchCollection(slug).then((res) => {
              if (res.data) {
                setCollection(res.data);
              }
            })
          }
        />
      ) : null}
    </PageFrame>
  );
}
