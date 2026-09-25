import { Link } from '@tanstack/react-router';
import {
  ArrowLeftIcon,
  ImagesIcon,
  ListMusicIcon,
  MonitorPlayIcon,
  MusicIcon,
  PaintbrushIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  Dialog,
  FavoriteButton,
  TabLabel,
  Tabs,
  Tooltip,
} from '@tahti-player/ui';

import {
  fetchMyPressKitImages,
  fetchPublicPressKitImages,
  type PublicPressKitImage,
} from '../api/artist-settings';
import { resolvePublicVisualizerPreset } from '../api/channel-design';
import { fetchProfile } from '../api/client';
import { fetchPublicMentions, type PublicMention } from '../api/mentions';
import type {
  PublicProfile,
  PublicProfileRelease,
  TahtiPlayable,
} from '../api/types';
import {
  AlbumPlayPromptDialog,
  ArtistBioSection,
  ArtistEmbeds,
  ArtistFeed,
  ArtistHeaderActions,
  ArtistLiveShows,
  artistLookSchemes,
  ArtistMusicTab,
  ArtistNews,
  ArtistPlaylistsGrid,
  ArtistPopularTracks,
  ArtistRelatedArtists,
  ArtistReleasesGrid,
  ArtistTaggedIn,
  useArtistCatalog,
  useArtistChannelLook,
  type RelatedArtist,
} from '../components/artist-view';
import {
  ArtistGalleryAddIcon,
  ArtistGalleryPanel,
} from '../components/ArtistGalleryPanel';
import { ChannelDesigner } from '../components/ChannelDesigner';
import { ChannelVisualizer } from '../components/ChannelVisualizer';
import {
  EntitySocialHeader,
  type EntitySocialStat,
} from '../components/EntitySocialHeader';
import { ImageLightbox } from '../components/ImageLightbox';
import { PageEmpty, PageLoading } from '../components/PageStates';
import { QueueConfirmDialog } from '../components/QueueConfirmDialog';
import {
  releasePlayables,
  ReleaseTracklistDialog,
} from '../components/ReleaseTracklistDialog';
import { StreamManagerPanel } from '../components/StreamManagerPanel';
import { TrackEditDialog } from '../components/TrackEditDialog';
import { hasAccountRole } from '../lib/accountRoles';
import {
  artistProfileEmbed,
  profileTrackToPlayable,
  type ArtistProfileEmbed,
} from '../lib/artistProfile';
import { resolveArtworkVisualizerPreset } from '../lib/artworkVisualizer';
import { colorSchemeCssVars } from '../lib/colorScheme';
import { countryName } from '../lib/countries';
import { isPinned } from '../lib/pinnedTracks';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { syncDocumentMetadata } from '../lib/seo';
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';
import { playableFromQueueItem, usePlayerStore } from '../stores/playerStore';

export { profileTrackToPlayable };

type Tab = 'stage' | 'gallery' | 'design';

const RELATED_ARTIST_LIMIT = 5;

/** Keyed by username so navigating between artists resets all local state. */
export function ArtistView({ username }: { username: string }) {
  return <ArtistProfilePage key={username} username={username} />;
}

function ArtistProfilePage({ username }: { username: string }) {
  const me = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('stage');
  const [galleryImages, setGalleryImages] = useState<PublicPressKitImage[]>([]);
  const [galleryLoaded, setGalleryLoaded] = useState(false);
  const [tracklistRelease, setTracklistRelease] =
    useState<PublicProfileRelease | null>(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [albumPrompt, setAlbumPrompt] = useState<{
    release: PublicProfileRelease;
    playables: TahtiPlayable[];
  } | null>(null);
  const [queueConfirm, setQueueConfirm] = useState<{
    title: string;
    playables: TahtiPlayable[];
  } | null>(null);
  const [editingSoundId, setEditingSoundId] = useState<string | null>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [taggedIn, setTaggedIn] = useState<PublicMention[]>([]);

  const {
    channelVisual,
    lookExtras,
    discoWidgets,
    channelPosts,
    channelNews,
    liveShows,
    lookVisibility,
    setLookVisibility,
    reloadLook,
  } = useArtistChannelLook(profile?.channel?.slug, username);

  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const currentId = usePlayerStore((s) => s.currentId);
  const status = usePlayerStore((s) => s.status);
  const queue = usePlayerStore((s) => s.queue);
  const toggleFavoriteTrack = useLibraryStore((s) => s.toggleFavoriteTrack);
  const favoriteTracks = useLibraryStore((s) => s.favoriteTracks);
  const toggleFavoriteChannel = useLibraryStore((s) => s.toggleFavoriteChannel);
  const favoriteChannels = useLibraryStore((s) => s.favoriteChannels);

  const playAlbum = (playables: TahtiPlayable[]) => {
    const [head, ...rest] = playables;
    if (head) {
      play(head, { enqueueRest: rest });
    }
  };

  const queueAlbum = (playables: TahtiPlayable[]) => {
    for (const item of playables) {
      enqueue(item);
    }
  };

  const playOrPromptAlbum = (
    release: PublicProfileRelease,
    artist: string,
    channelSlug?: string,
  ) => {
    const playables = releasePlayables(release, artist, channelSlug);
    if (playables.length === 0) {
      return;
    }
    if (usePlayerStore.getState().queue.length > 0) {
      setAlbumPrompt({ release, playables });
      return;
    }
    playAlbum(playables);
  };

  const isOwner = Boolean(me && me.username === username);
  const isAdministrator = hasAccountRole(me, 'BOARD');
  const hasGallery =
    galleryImages.length > 0 && lookVisibility.gallery !== false;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchProfile(username)
      .then((res) => {
        if (cancelled) {
          return;
        }
        setProfile(res.data);
        if (res.data) {
          const { displayName, bio, avatarUrl } = res.data.artist;
          syncDocumentMetadata(window.location.pathname, {
            title: `${displayName} on Tahti`,
            description:
              bio ??
              `Explore ${displayName}'s music, releases, collections, and live channel on Tahti.`,
            image: avatarUrl ?? undefined,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    void fetchPublicMentions(username)
      .then((mentions) => !cancelled && setTaggedIn(mentions.data))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [username]);

  useEffect(() => {
    let cancelled = false;
    setGalleryLoaded(false);
    const load = isOwner
      ? fetchMyPressKitImages().then((res) =>
          res.data.map(({ id, imageUrl, title }) => ({ id, imageUrl, title })),
        )
      : fetchPublicPressKitImages(username).then((res) => res.data);
    void load
      .then((images) => {
        if (!cancelled) {
          setGalleryImages(images);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setGalleryLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [username, isOwner]);

  const tabs = useMemo(() => {
    const list: Array<{ id: Tab; label: string; icon: typeof MusicIcon }> = [];
    if (!profile) {
      return list;
    }
    if (
      profile.tracks.length > 0 &&
      (lookVisibility.player || profile.tracks.some((t) => isPinned(t)))
    ) {
      list.push({ id: 'stage', label: 'Stage', icon: MonitorPlayIcon });
    }
    if (hasGallery) {
      list.push({ id: 'gallery', label: 'Gallery', icon: ImagesIcon });
    }
    if (isOwner) {
      list.push({ id: 'design', label: 'Design', icon: PaintbrushIcon });
    }
    return list;
  }, [hasGallery, isOwner, lookVisibility, profile]);

  useEffect(() => {
    if (profile && !tabs.some((item) => item.id === tab)) {
      setTab(tabs[0]?.id ?? 'stage');
    }
  }, [profile, tab, tabs]);

  const { pinnedPlayables, pinnedTiles, catalogPlayables, releaseTiles } =
    useArtistCatalog(profile);

  if (loading) {
    return <PageLoading label="Loading artist…" />;
  }

  if (!profile) {
    return (
      <PageEmpty
        title="Artist not found"
        description="This artist profile may have been removed or is not available."
      />
    );
  }

  const { artist, channel, collections, fanTiers } = profile;
  const profileEmbeds = Object.entries(artist.socialLinks ?? {})
    .filter(
      ([key, url]) =>
        Boolean(url) && key !== 'genres' && key !== 'showConnections',
    )
    .map(([, url]) => artistProfileEmbed(url))
    .filter((embed): embed is ArtistProfileEmbed => Boolean(embed));

  const relatedArtists: RelatedArtist[] = [];
  for (const { mentioner } of taggedIn) {
    if (
      mentioner.username !== artist.username &&
      !relatedArtists.some((a) => a.username === mentioner.username)
    ) {
      relatedArtists.push(mentioner);
    }
  }
  const popularPlayables = [...pinnedPlayables, ...catalogPlayables];
  const showPopular = lookVisibility.tracks && popularPlayables.length > 0;
  const showRelated = relatedArtists.length > 0;
  const favoriteSlug = channel?.slug ?? null;
  const isFavoriteArtist = Boolean(
    favoriteSlug && favoriteChannels.some((c) => c.slug === favoriteSlug),
  );

  const queueRelease = (
    release: PublicProfileRelease,
    playables: TahtiPlayable[],
  ) => {
    if (playables.length > 1) {
      setQueueConfirm({ title: release.title, playables });
      return;
    }
    queueAlbum(playables);
  };

  const currentQueueItem = queue.find((q) => q.id === currentId);
  const currentPlayable = currentQueueItem
    ? playableFromQueueItem(currentQueueItem)
    : null;
  const nowPlayingHere =
    currentPlayable?.artist === artist.displayName ? currentPlayable : null;
  const featuredPlayable = pinnedPlayables[0] ?? catalogPlayables[0] ?? null;
  const featuredTrack = profile.tracks.find(
    (track) => `sound:${track.id}` === featuredPlayable?.id,
  );
  const featuredIsCurrent = featuredPlayable?.id === currentId;
  const featuredIsPlaying =
    featuredIsCurrent && (status === 'playing' || status === 'loading');

  const playFeatured = () => {
    if (!featuredPlayable) {
      return;
    }
    if (featuredIsCurrent) {
      usePlayerStore
        .getState()
        .setStatus(featuredIsPlaying ? 'paused' : 'playing');
      return;
    }
    play(featuredPlayable);
  };

  const stat = (
    key: string,
    label: string,
    value: number | null | undefined,
    icon: EntitySocialStat['icon'],
  ): EntitySocialStat[] =>
    value != null && value > 0 ? [{ key, label, value, icon }] : [];
  const headerStats: EntitySocialStat[] = [
    ...stat('followers', 'Followers', artist.followerCount, UsersIcon),
    ...stat('following', 'Following', artist.followingCount, UserPlusIcon),
    ...stat('tracks', 'Tracks', profile.tracks.length, MusicIcon),
    ...stat('collections', 'Playlists', collections.length, ListMusicIcon),
  ];

  const {
    headerScheme,
    playerScheme,
    pageScheme,
    artistBackdropUrl,
    sectionSurfaceStyle,
    playerStageGradient,
    playerBottomGradient,
    resolvedVisualizerPreset,
    backgroundVisualPreset,
    brandGradient,
    overlay,
  } = artistLookSchemes(channelVisual, lookExtras);

  return (
    <div
      className="relative isolate flex w-full flex-col gap-4 overflow-hidden rounded-2xl p-4 sm:p-6"
      style={{
        ...colorSchemeCssVars(pageScheme),
        color: pageScheme.text,
      }}
      data-channel-scheme
    >
      <div
        className="absolute inset-0 -z-[2]"
        style={{ backgroundColor: pageScheme.bg }}
        aria-hidden
      />
      {backgroundVisualPreset ? (
        <ChannelVisualizer
          className="pointer-events-none absolute inset-0 -z-[1] size-full opacity-20"
          artworkUrl={artist.avatarUrl}
          colorScheme={pageScheme}
          preset={resolvePublicVisualizerPreset(backgroundVisualPreset)}
        />
      ) : null}
      <Tooltip content="Back to Listen" side="right">
        <Link
          to="/"
          aria-label="Back to Listen"
          className="inline-flex size-8 w-fit items-center justify-center rounded-full hover:bg-white/10"
          style={{ color: pageScheme.muted }}
        >
          <ArrowLeftIcon size={16} aria-hidden />
        </Link>
      </Tooltip>

      <EntitySocialHeader
        title={artist.displayName}
        imageUrl={artist.avatarUrl ?? placeholderArtworkUrl(artist.username)}
        imageAlt=""
        roundImage
        location={countryName(artist.countryCode) || null}
        colorScheme={headerScheme}
        headerStyle={channelVisual?.headerStyle}
        videoBackgroundUrl={channelVisual?.videoBackgroundUrl}
        gradientOverride={brandGradient}
        subtitle={`@${artist.username}${artist.pronouns ? ` · ${artist.pronouns}` : ''}`}
        description={
          artist.bio ? (
            <p className="line-clamp-2 whitespace-pre-wrap">{artist.bio}</p>
          ) : null
        }
        backdropUrl={artistBackdropUrl}
        visualizerPreset={
          resolvedVisualizerPreset ??
          resolveArtworkVisualizerPreset(artist.username)
        }
        visualSettingsJson={channelVisual?.visualSettingsJson}
        artworkUrlForVisualizer={artist.avatarUrl}
        onImageClick={artist.avatarUrl ? () => setAvatarOpen(true) : undefined}
        stats={headerStats}
        actions={
          <>
            <ArtistHeaderActions
              profile={profile}
              isOwner={isOwner}
              onEditLook={() => setTab('design')}
            />
            {me && !isOwner && favoriteSlug ? (
              <FavoriteButton
                size="sm"
                isFavorite={isFavoriteArtist}
                onToggle={() =>
                  toggleFavoriteChannel({
                    slug: favoriteSlug,
                    displayName: artist.displayName,
                    avatarUrl: artist.avatarUrl,
                  })
                }
                ariaLabelAdd={`Add ${artist.displayName} to favorite artists`}
                ariaLabelRemove={`Remove ${artist.displayName} from favorite artists`}
                className="bg-background border-border rounded-md border-(length:--border-width)"
                data-testid="artist-favorite-button"
              />
            ) : null}
          </>
        }
        data-testid="artist-social-header"
      />

      {showPopular || showRelated ? (
        <div className="flex flex-col gap-4 md:flex-row">
          {showPopular ? (
            <div
              className={showRelated ? 'min-w-0 md:w-2/3' : 'w-full min-w-0'}
            >
              <ArtistPopularTracks
                items={popularPlayables}
                isOwner={isOwner}
                onEditTrack={setEditingSoundId}
              />
            </div>
          ) : null}
          {showRelated ? (
            <div
              className={showPopular ? 'min-w-0 md:w-1/3' : 'w-full min-w-0'}
            >
              <ArtistRelatedArtists
                artists={relatedArtists.slice(0, RELATED_ARTIST_LIMIT)}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {(lookVisibility.releases || lookVisibility.latest) &&
      releaseTiles.length > 0 ? (
        <ArtistReleasesGrid
          releases={releaseTiles}
          artistName={artist.displayName}
          channelSlug={channel?.slug}
          isFavorite={(playable) =>
            favoriteTracks.some((t) => t.id === playable.id)
          }
          onPlayRelease={(release) =>
            playOrPromptAlbum(release, artist.displayName, channel?.slug)
          }
          onQueueRelease={queueRelease}
          onToggleFavorite={toggleFavoriteTrack}
          onTitleClick={setTracklistRelease}
        />
      ) : null}

      {collections.length > 0 ? (
        <ArtistPlaylistsGrid
          collections={collections}
          username={artist.username}
        />
      ) : null}

      {lookVisibility.bio !== false && (
        <ArtistBioSection
          artist={artist}
          isOwner={isOwner}
          discoWidgets={discoWidgets}
          surfaceStyle={sectionSurfaceStyle}
          onFullBioSaved={(fullBio) =>
            setProfile((prev) =>
              prev ? { ...prev, artist: { ...prev.artist, fullBio } } : prev,
            )
          }
        />
      )}

      {lookVisibility.shows !== false &&
      liveShows &&
      (liveShows.upcomingEpisodes.length > 0 ||
        liveShows.pastEpisodes.length > 0) ? (
        <ArtistLiveShows
          shows={liveShows}
          channelSlug={channel?.slug}
          username={artist.username}
          surfaceStyle={sectionSurfaceStyle}
        />
      ) : null}

      {fanTiers.length > 0 && (
        <p className="text-foreground-secondary text-xs">
          Fan tiers:{' '}
          {fanTiers
            .map((t) => `${t.name} (€${(t.amountCents / 100).toFixed(0)})`)
            .join(', ')}
        </p>
      )}

      {lookVisibility.feed && taggedIn.length > 0 ? (
        <ArtistTaggedIn
          mentions={taggedIn}
          surfaceStyle={sectionSurfaceStyle}
        />
      ) : null}

      {lookVisibility.feed && channelPosts.length > 0 ? (
        <ArtistFeed posts={channelPosts} />
      ) : null}

      {lookVisibility.news && channelNews.length > 0 ? (
        <ArtistNews news={channelNews} />
      ) : null}

      <div className="border-border flex flex-wrap items-center gap-2 border-b pb-3">
        {tabs.length > 0 ? (
          <Tabs.Root
            selectedIndex={Math.max(
              0,
              tabs.findIndex((item) => item.id === tab),
            )}
            onChange={(index) => {
              const next = tabs[index];
              if (next) {
                setTab(next.id);
              }
            }}
          >
            <Tabs.List className="w-fit flex-wrap">
              {tabs.map((item) => (
                <Tabs.Tab key={item.id}>
                  <TabLabel icon={<item.icon size={14} />}>
                    {item.label}
                  </TabLabel>
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.Root>
        ) : null}
        {isOwner &&
        lookVisibility.gallery !== false &&
        galleryLoaded &&
        galleryImages.length === 0 ? (
          <ArtistGalleryAddIcon
            onCreated={(images) => {
              setGalleryImages(images);
              setTab('gallery');
            }}
          />
        ) : null}
      </div>

      {tab === 'stage' && (
        <ArtistMusicTab
          channel={channel}
          visualSettingsJson={channelVisual?.visualSettingsJson}
          artist={artist}
          isOwner={isOwner}
          isAdministrator={isAdministrator}
          visibility={lookVisibility}
          scheme={playerScheme}
          borderMuted={pageScheme.muted}
          stageGradient={playerStageGradient}
          bottomGradient={playerBottomGradient}
          visualizerPreset={resolvedVisualizerPreset}
          overlay={overlay}
          nowPlayingHere={nowPlayingHere}
          featured={{
            playable: featuredPlayable,
            isPlaying: featuredIsPlaying,
            track: featuredTrack,
            onPlay: playFeatured,
          }}
          pinnedTiles={pinnedTiles}
          onPlay={play}
          onToggleFavorite={toggleFavoriteTrack}
          favoriteTracks={favoriteTracks}
          onOpenManager={() => setManagerOpen(true)}
        />
      )}

      {tab === 'gallery' && hasGallery && (
        <ArtistGalleryPanel
          images={galleryImages}
          isOwner={isOwner}
          onChange={(next) => {
            setGalleryImages(next);
            if (next.length === 0) {
              setTab('stage');
            }
          }}
        />
      )}

      {tab === 'design' && isOwner && (
        <div className="flex flex-col gap-3">
          {channel?.slug ? (
            <p className="text-foreground-secondary text-sm">
              Full layout editing (layers, hide/add, drag) lives on the{' '}
              <Link
                to="/channel/$slug"
                params={{ slug: channel.slug }}
                search={{ edit: true }}
                className="underline-offset-2 hover:underline"
              >
                channel page
              </Link>
              .
            </p>
          ) : null}
          <ChannelDesigner
            displayName={artist.displayName}
            username={artist.username}
            channelSlug={channel?.slug}
            avatarUrl={artist.avatarUrl}
            bio={artist.bio}
            compact
            onLookVisibilityChange={setLookVisibility}
            onSaved={reloadLook}
          />
        </div>
      )}

      {artist.socialLinks?.showConnections !== 'false' &&
      profileEmbeds.length > 0 ? (
        <ArtistEmbeds embeds={profileEmbeds} />
      ) : null}

      <ReleaseTracklistDialog
        isOpen={Boolean(tracklistRelease)}
        onClose={() => setTracklistRelease(null)}
        release={tracklistRelease}
        artistName={artist.displayName}
        channelSlug={channel?.slug}
      />

      <TrackEditDialog
        soundId={editingSoundId}
        onClose={() => setEditingSoundId(null)}
        onSaved={() => {
          void fetchProfile(username)
            .then((res) => setProfile(res.data))
            .catch(() => undefined);
        }}
      />

      {avatarOpen && artist.avatarUrl ? (
        <ImageLightbox
          images={[{ imageUrl: artist.avatarUrl }]}
          index={0}
          label={`${artist.displayName} profile picture`}
          onClose={() => setAvatarOpen(false)}
        />
      ) : null}

      <AlbumPlayPromptDialog
        title={albumPrompt?.release.title ?? null}
        onClose={() => setAlbumPrompt(null)}
        onQueue={() => {
          if (albumPrompt) {
            queueAlbum(albumPrompt.playables);
          }
          setAlbumPrompt(null);
        }}
        onPlayNow={() => {
          if (albumPrompt) {
            playAlbum(albumPrompt.playables);
          }
          setAlbumPrompt(null);
        }}
      />

      <Dialog.Root
        isOpen={managerOpen}
        onClose={() => setManagerOpen(false)}
        className="max-w-2xl"
      >
        {channel ? (
          <>
            <Dialog.Title>Manage stream</Dialog.Title>
            <StreamManagerPanel
              slug={channel.slug}
              channelState={channel.state}
              readOnly={!isOwner && !isAdministrator}
              defaultExpanded
            />
          </>
        ) : null}
      </Dialog.Root>

      <QueueConfirmDialog
        isOpen={Boolean(queueConfirm)}
        count={queueConfirm?.playables.length ?? 0}
        sourceLabel={queueConfirm?.title ?? ''}
        onCancel={() => setQueueConfirm(null)}
        onConfirm={() => {
          if (queueConfirm) {
            queueAlbum(queueConfirm.playables);
          }
          setQueueConfirm(null);
        }}
      />
    </div>
  );
}
