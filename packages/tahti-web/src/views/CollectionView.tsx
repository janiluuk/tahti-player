import { Link, useNavigate } from '@tanstack/react-router';
import {
  BookmarkIcon,
  ListPlusIcon,
  MusicIcon,
  PlayIcon,
  RadioIcon,
  UsersIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import {
  backButtonCornerClassName,
  BackButtonLink,
  Button,
  EditIconLink,
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
import type { PublicCollection } from '../api/types';
import { ChannelTextOverlayView } from '../components/ChannelTextOverlayView';
import { CollaborativePlaylistAdd } from '../components/CollaborativePlaylistAdd';
import { CollectionContribution } from '../components/CollectionContribution';
import { CollectionTrackList } from '../components/CollectionTrackList';
import { EmbedButton } from '../components/EmbedButton';
import {
  EntitySocialHeader,
  type EntitySocialStat,
} from '../components/EntitySocialHeader';
import { OwnerCollectionSortSounds } from '../components/OwnerCollectionSortSounds';
import { PageFrame } from '../components/PageHeader';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { ReportButton } from '../components/ReportButton';
import { RssFeedButton } from '../components/RssFeedButton';
import { Eyebrow } from '../components/tahti/Eyebrow';
import { resolveArtworkVisualizerPreset } from '../lib/artworkVisualizer';
import { collectionToPlayables } from '../lib/collectionPlayables';
import { collectionTrackMeta } from '../lib/collectionTrackMeta';
import { contrastingText } from '../lib/colorScheme';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { syncDocumentMetadata } from '../lib/seo';
import { useDominantColor } from '../lib/useDominantColor';
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

function schemeFromCoverRgb(rgb: [number, number, number] | null):
  | {
      bg: string;
      text: string;
      accent: string;
      highlight: string;
      muted: string;
    }
  | undefined {
  if (!rgb) {
    return undefined;
  }
  const [r, g, b] = rgb;
  const bg = rgbToHex(r, g, b);
  const accent = rgbToHex(
    Math.min(255, Math.round(r * 0.85 + 40)),
    Math.min(255, Math.round(g * 0.85 + 40)),
    Math.min(255, Math.round(b * 0.85 + 40)),
  );
  const highlight = rgbToHex(
    Math.min(255, Math.round(r * 0.7 + 80)),
    Math.min(255, Math.round(g * 0.7 + 80)),
    Math.min(255, Math.round(b * 0.7 + 80)),
  );
  const muted = rgbToHex(
    Math.round(r * 0.55 + 60),
    Math.round(g * 0.55 + 60),
    Math.round(b * 0.55 + 60),
  );
  return {
    bg,
    text: contrastingText(bg),
    accent,
    highlight,
    muted,
  };
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
  const { t } = useTranslation('web');
  const [collection, setCollection] = useState<
    (PublicCollection & Partial<CollectionTextLayer>) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
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
    setLoadError(null);
    void fetchCollection(slug)
      .then((res) => {
        if (cancelled) {
          return;
        }
        setCollection(res.data);
        setLoadError(
          res.meta.source === 'api' ? (res.meta.reason ?? null) : null,
        );
        if (res.data) {
          syncDocumentMetadata(window.location.pathname, {
            title: `${res.data.name} by ${res.data.user.displayName} on Tahti`,
            description:
              res.data.description ??
              `Listen to ${res.data.name}, a collection by ${res.data.user.displayName} on Tahti.`,
            image: res.data.coverUrl ?? placeholderArtworkUrl(res.data.slug),
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setCollection(null);
          setLoadError(
            err instanceof Error
              ? err.message
              : 'Could not load this collection.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug, attempt]);

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

  const trackMeta = useMemo(
    () => (collection ? collectionTrackMeta(collection) : undefined),
    [collection],
  );
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

  const coverTintUrl = collection
    ? (collection.coverUrl ?? placeholderArtworkUrl(collection.slug))
    : null;
  const coverRgb = useDominantColor(coverTintUrl);
  const coverScheme = useMemo(() => schemeFromCoverRgb(coverRgb), [coverRgb]);

  if (loading) {
    return <PageLoading label={t('collectionPage.loading')} />;
  }

  if (loadError) {
    return (
      <PageError
        title={t('collectionPage.loadError')}
        description={loadError}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  if (!collection) {
    return (
      <PageEmpty
        headingLevel={1}
        title={t('collectionPage.notFound')}
        description={t('collectionPage.notFoundDescription')}
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
            label: t('collectionPage.tracks'),
            value: playables.length,
            icon: MusicIcon,
          },
        ]
      : []),
    ...(subscription && subscription.subscriberCount > 0
      ? [
          {
            key: 'subscribers',
            label: t('collectionPage.followers'),
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

  const reloadCollection = () =>
    void fetchCollection(slug).then((res) => {
      if (res.data) {
        setCollection(res.data);
      }
    });

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
      toast.error(t('toasts.jamStartFailed'));
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
    // Full-bleed like the track page: cancel AppShell's content padding.
    <div className="-mx-6 -mt-6 min-h-full p-6 md:-mx-8 md:-mt-8 md:p-8">
      <PageFrame maxWidth="full" className="relative">
        <Tooltip
          content={t('collectionView.backToListen')}
          side="right"
          wrapperClassName={backButtonCornerClassName}
        >
          <BackButtonLink
            to="/"
            aria-label={t('collectionView.backToListen')}
          />
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
          colorScheme={coverScheme}
          visualizerPreset={resolveArtworkVisualizerPreset(collection.slug)}
          artworkUrlForVisualizer={coverUrl}
          stats={headerStats}
          actions={
            isOwner ? (
              <EditIconLink
                to="/studio/collections/$slug"
                params={{ slug }}
                label={t('actions.editInStudio')}
                search={{ edit: true }}
                className="bg-background border-border rounded-md border-(length:--border-width)"
              />
            ) : undefined
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
              {t('actions.play')}
            </Button>
            <Tooltip content={t('actions.addAllToQueue')} side="top">
              <Button
                variant="secondary"
                size="icon"
                onClick={queueAll}
                disabled={playables.length === 0}
                aria-label={t('actions.addAllToQueue')}
              >
                <ListPlusIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
            <EmbedButton target={{ kind: 'collection', slug }} />
            {collection.isPublic && collection.links?.rss ? (
              <RssFeedButton
                href={collection.links.rss}
                label={t('collectionViewLabels.rssFeedOfName', {
                  name: collection.name,
                })}
              />
            ) : null}
            <Button variant="secondary" onClick={() => void startJam()}>
              <RadioIcon size={15} aria-hidden className="mr-1.5" />
              {t('actions.startJam')}
            </Button>
            {isOwner ? (
              <OwnerCollectionSortSounds
                slug={slug}
                onSaved={reloadCollection}
              />
            ) : null}
            {!isOwner ? (
              <Button
                variant={isFavorite ? 'default' : 'secondary'}
                aria-pressed={isFavorite}
                aria-label={
                  isFavorite
                    ? t('actions.removeFromFavoritesItem', {
                        title: collection.name,
                      })
                    : t('actions.favoriteItem', { title: collection.name })
                }
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
                {isFavorite ? t('actions.favorited') : t('actions.favorite')}
              </Button>
            ) : null}
            {!isOwner && collection.isPublic && subscription ? (
              <Tooltip
                content={t('collectionView.signInToSubscribeTo')}
                side="bottom"
                disabled={Boolean(me)}
                wrapperClassName="inline-flex"
              >
                <Button
                  variant={subscription.subscribed ? 'default' : 'secondary'}
                  onClick={() => void toggleSubscription()}
                  disabled={subscriptionBusy}
                  aria-pressed={subscription.subscribed}
                  aria-description={
                    me ? undefined : 'Sign in to subscribe to this playlist'
                  }
                >
                  <BookmarkIcon size={15} aria-hidden className="mr-1.5" />
                  {subscription.subscribed ? 'Subscribed' : 'Subscribe'}
                  {subscription.subscriberCount > 0
                    ? ` (${subscription.subscriberCount})`
                    : ''}
                </Button>
              </Tooltip>
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

        <CollectionTrackList
          initialView="list"
          items={playables}
          getTrackMeta={trackMeta}
          compactActions
          getAnnotation={(item) => {
            const line = contributions.get(item.id);
            return line ? <CollectionContribution line={line} /> : null;
          }}
          empty={{
            title: t('collectionPage.emptyTracksTitle'),
            description: isOwner
              ? t('collectionPage.emptyTracksOwner')
              : t('collectionPage.emptyTracksGuest'),
          }}
        />

        {collection.items.some((i) => i.release && !i.sound) && (
          <section className="flex flex-col gap-2">
            <h2>
              <Eyebrow>{t('collectionView.linkedReleases')}</Eyebrow>
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
            onAdded={reloadCollection}
          />
        ) : null}
      </PageFrame>
    </div>
  );
}
