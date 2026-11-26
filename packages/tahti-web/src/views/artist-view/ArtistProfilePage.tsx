import { useMemo, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  backButtonCornerClassName,
  BackButtonLink,
  ClampedText,
  Dialog,
  Tooltip,
} from '@tahti-player/ui';

import { resolvePublicVisualizerPreset } from '../../api/channel-design';
import type { FollowListDirection } from '../../api/follows';
import { artistLogo } from '../../api/profile-logo';
import type { PublicProfileRelease, TahtiPlayable } from '../../api/types';
import {
  AlbumPlayPromptDialog,
  ArtistBioSection,
  ArtistEmbeds,
  ArtistFollowButton,
  ArtistHeaderActions,
  ArtistLiveShows,
  artistLookSchemes,
  ArtistMusicTab,
  ArtistNews,
  ArtistPageHero,
  ArtistPlaylistsGrid,
  ArtistPopularTracks,
  ArtistRelatedArtists,
  ArtistReleasesGrid,
  ArtistStoreSection,
  ArtistSupportNote,
  ArtistTaggedIn,
  useArtistCatalog,
  useArtistChannelLook,
  type RelatedArtist,
} from '../../components/artist-view';
import { ArtistSoundCloudTracks } from '../../components/artist-view/ArtistSoundCloudTracks';
import { ArtistGalleryPanel } from '../../components/ArtistGalleryPanel';
import { ArtistStoryFeed } from '../../components/ArtistStoryFeed';
import { CHANNEL_SCHEME_TEXT_CLASS } from '../../components/channel-view/channelSchemeText';
import { ChannelVisualizer } from '../../components/ChannelVisualizer';
import { ImageLightbox } from '../../components/ImageLightbox';
import {
  ContentReveal,
  PageEmpty,
  PageError,
  PageErrorBanner,
  ProfileSkeleton,
} from '../../components/PageStates';
import { QueueConfirmDialog } from '../../components/QueueConfirmDialog';
import {
  releasePlayables,
  ReleaseTracklistDialog,
} from '../../components/ReleaseTracklistDialog';
import { StreamManagerPanel } from '../../components/StreamManagerPanel';
import { TrackEditDialog } from '../../components/TrackEditDialog';
import { FULL_BLEED_TOP_CANCEL } from '../../layout/contentPadding';
import { hasAccountRole, hasStudioAccess } from '../../lib/accountRoles';
import {
  artistHeaderSubtitle,
  artistProfileEmbed,
  type ArtistProfileEmbed,
} from '../../lib/artistProfile';
import { resolveArtworkVisualizerPreset } from '../../lib/artworkVisualizer';
import { artistHeroImage } from '../../lib/avatarTheme';
import { resolveStorefront } from '../../lib/channelStore';
import { collectionsOfKind } from '../../lib/collectionKind';
import { colorSchemeCssVars } from '../../lib/colorScheme';
import { countryName } from '../../lib/countries';
import { useArtistFollow } from '../../lib/useArtistFollow';
import { useAuthStore } from '../../stores/authStore';
import {
  playableFromQueueItem,
  usePlayerStore,
} from '../../stores/playerStore';
import { ArtistFollowListDialog } from './ArtistFollowListDialog';
import { artistProfileHeaderStats } from './artistProfileHeaderStats';
import {
  ArtistDesignTab,
  ArtistProfileTabRow,
  type ArtistProfileTab,
} from './ArtistProfileTabs';
import { useArtistProfileLoad } from './useArtistProfileLoad';
import { useArtistProfileTabs } from './useArtistProfileTabs';

const RELATED_ARTIST_LIMIT = 5;

export function ArtistProfilePage({ username }: { username: string }) {
  const { t } = useTranslation('web');
  const me = useAuthStore((s) => s.user);
  const profileLoaded = useAuthStore((s) => s.profileLoaded);
  const [tab, setTab] = useState<ArtistProfileTab>('stage');
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
  const isSelfEarly = me?.username === username;
  const isOwnerEarly = isSelfEarly && (hasStudioAccess(me) || !profileLoaded);
  const {
    profile,
    updateProfile,
    loading,
    loadError,
    retry,
    galleryImages,
    setGalleryImages,
    galleryLoaded,
    galleryError,
    taggedIn,
    mentionsError,
  } = useArtistProfileLoad(username, isOwnerEarly);
  const storefront = useMemo(
    () => (profile ? resolveStorefront(profile) : null),
    [profile],
  );

  const {
    channelVisual,
    channelVisualLoaded,
    lookExtras,
    discoWidgets,
    channelPosts,
    channelNews,
    liveShows,
    lookVisibility,
    setLookVisibility,
    reloadLook,
  } = useArtistChannelLook(profile?.channel?.slug, username, isOwnerEarly);

  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const currentId = usePlayerStore((s) => s.currentId);
  const status = usePlayerStore((s) => s.status);
  const queue = usePlayerStore((s) => s.queue);

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

  const playOrPromptAlbum = (release: PublicProfileRelease) => {
    const playables = releasePlayables(
      release,
      profile?.artist.displayName ?? '',
      profile?.channel?.slug,
    );
    if (playables.length === 0) {
      return;
    }
    if (usePlayerStore.getState().queue.length > 0) {
      setAlbumPrompt({ release, playables });
      return;
    }
    playAlbum(playables);
  };

  const isSelf = isSelfEarly;
  const isOwner = isOwnerEarly;
  const isAdministrator = hasAccountRole(me, 'BOARD');
  const hasGallery =
    galleryImages.length > 0 && lookVisibility.gallery !== false;

  const tabs = useArtistProfileTabs({
    profile,
    lookVisibility,
    hasGallery,
    isOwner,
    tab,
    setTab,
  });

  const { pinnedPlayables, pinnedTiles, catalogPlayables, releaseTiles } =
    useArtistCatalog(profile);

  const followChannel =
    profile?.channel?.slug != null
      ? {
          slug: profile.channel.slug,
          username: profile.artist.username,
          displayName: profile.artist.displayName,
          avatarUrl: profile.artist.avatarUrl,
        }
      : null;
  const follow = useArtistFollow(followChannel, Boolean(me && !isSelf));
  const [followList, setFollowList] = useState<FollowListDirection | null>(
    null,
  );

  if (loading) {
    return (
      <div role="status" aria-label={t('loading.loadingArtist')}>
        <ProfileSkeleton />
      </div>
    );
  }

  if (loadError && !profile) {
    return (
      <PageError
        title={t('loadErrors.couldNotLoadThisArtist')}
        description={loadError}
        onRetry={retry}
      />
    );
  }

  if (!profile) {
    return (
      <PageEmpty
        headingLevel={1}
        title={t('empties.artistNotFound')}
        description={t('empties.thisArtistProfileMayHaveBeen')}
      />
    );
  }

  const { artist, channel, collections, fanTiers } = profile;
  const albumCollections = collectionsOfKind(collections, 'album');
  const djSetCollections = collectionsOfKind(collections, 'dj-set');
  const otherCollections = collectionsOfKind(collections, 'other');
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

  const headerStats = artistProfileHeaderStats({
    profile,
    followerCount: follow.followerCount,
    onFollowers: () => setFollowList('followers'),
    onFollowing: () => setFollowList('following'),
  });

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
  } = artistLookSchemes(
    channelVisual,
    lookExtras,
    channelVisualLoaded ? artist : undefined,
  );
  const backToListen = (
    <Tooltip content={t('collectionView.backToListen')} side="right">
      <BackButtonLink to="/" aria-label={t('collectionView.backToListen')} />
    </Tooltip>
  );

  return (
    <ContentReveal
      // Cancels AppShell's content padding so the artist's colors reach the
      // pane edges, like the track page.
      className={`relative isolate flex min-h-full flex-col gap-4 overflow-hidden ${FULL_BLEED_TOP_CANCEL} ${CHANNEL_SCHEME_TEXT_CLASS}`}
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
      {artist.showPageHero === false ? (
        <div className={backButtonCornerClassName}>{backToListen}</div>
      ) : null}
      {loadError ? (
        <PageErrorBanner
          title={t('pageStates.refreshFailed')}
          description={loadError}
          onRetry={retry}
        />
      ) : null}

      <ArtistPageHero
        hidden={artist.showPageHero === false}
        leading={backToListen}
        title={artist.displayName}
        nameplate={artist}
        isMember={artist.isMember}
        {...artistHeroImage(artist)}
        roundImage
        location={countryName(artist.countryCode) || null}
        colorScheme={headerScheme}
        headerStyle={channelVisual?.headerStyle}
        videoBackgroundUrl={channelVisual?.videoBackgroundUrl}
        gradientOverride={brandGradient}
        subtitle={artistHeaderSubtitle(artist)}
        description={
          artist.bio ? (
            <ClampedText className="whitespace-pre-wrap">
              {artist.bio}
            </ClampedText>
          ) : null
        }
        backdropUrl={artistBackdropUrl}
        logo={artistLogo(artist)}
        visualizerPreset={
          resolvedVisualizerPreset ??
          resolveArtworkVisualizerPreset(artist.username)
        }
        visualSettingsJson={channelVisual?.visualSettingsJson}
        artworkUrlForVisualizer={artist.avatarUrl}
        imagePosterUrl={artist.avatarUrl ? artist.avatarPosterUrl : null}
        onImageClick={artist.avatarUrl ? () => setAvatarOpen(true) : undefined}
        stats={headerStats}
        actions={
          <>
            <ArtistHeaderActions
              profile={profile}
              isOwner={isOwner}
              isSelf={isSelf}
              onEditLook={() => setTab('design')}
            />
            {!isSelf && followChannel ? (
              <ArtistFollowButton
                displayName={artist.displayName}
                following={follow.following}
                busy={follow.busy}
                onToggle={() => void follow.toggle()}
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
                tracks={profile.tracks}
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
          onPlayRelease={playOrPromptAlbum}
          onQueueRelease={queueRelease}
          onTitleClick={setTracklistRelease}
        />
      ) : null}

      {otherCollections.length > 0 ? (
        <ArtistPlaylistsGrid
          collections={otherCollections}
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
            updateProfile((prev) =>
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

      {channel?.slug ? (
        <ArtistSoundCloudTracks
          channelSlug={channel.slug}
          surfaceStyle={sectionSurfaceStyle}
        />
      ) : null}

      <ArtistSupportNote tiers={fanTiers} tipJarUrl={artist.tipJarUrl} />

      {storefront ? (
        <ArtistStoreSection
          username={artist.username}
          tiers={storefront.tiers}
          items={storefront.items}
          paymentsReady={storefront.paymentsReady}
          isOwner={isOwner}
        />
      ) : null}

      {mentionsError && taggedIn.length === 0 ? (
        <p className="text-foreground-secondary text-xs" role="status">
          {t('artistProfilePageBatch30.couldNotLoadMentions', {
            error: mentionsError,
          })}
        </p>
      ) : null}

      {lookVisibility.feed && taggedIn.length > 0 ? (
        <ArtistTaggedIn
          mentions={taggedIn}
          surfaceStyle={sectionSurfaceStyle}
        />
      ) : null}

      {lookVisibility.feed && channelPosts.length > 0 ? (
        <ArtistStoryFeed
          posts={channelPosts}
          author={{
            username: artist.username,
            displayName: artist.displayName,
            avatarUrl: artist.avatarUrl ?? null,
          }}
        />
      ) : null}

      {lookVisibility.news ? (
        <ArtistNews news={channelNews} username={artist.username} />
      ) : null}

      <ArtistProfileTabRow
        tabs={tabs}
        tab={tab}
        onTabChange={setTab}
        galleryError={galleryError}
        showGalleryAdd={
          isOwner &&
          lookVisibility.gallery !== false &&
          galleryLoaded &&
          !galleryError &&
          galleryImages.length === 0
        }
        hasGalleryImages={galleryImages.length > 0}
        onGalleryCreated={(images) => {
          setGalleryImages(images);
          setTab('gallery');
        }}
      />

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
          onPlayRelease={playOrPromptAlbum}
          onOpenManager={() => setManagerOpen(true)}
        />
      )}

      {tab === 'albums' && albumCollections.length > 0 && (
        <div data-testid="artist-albums-tab">
          <ArtistPlaylistsGrid
            collections={albumCollections}
            username={artist.username}
          />
        </div>
      )}

      {tab === 'dj-sets' && djSetCollections.length > 0 && (
        <div data-testid="artist-dj-sets-tab">
          <ArtistPlaylistsGrid
            collections={djSetCollections}
            username={artist.username}
          />
        </div>
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
        <ArtistDesignTab
          artist={artist}
          channelSlug={channel?.slug}
          onLookVisibilityChange={setLookVisibility}
          onSaved={reloadLook}
        />
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
        onSaved={retry}
      />

      {avatarOpen && artist.avatarUrl ? (
        <ImageLightbox
          images={[{ imageUrl: artist.avatarUrl }]}
          index={0}
          label={t('artistProfilePageBatch30.profilePicture', {
            name: artist.displayName,
          })}
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
            <Dialog.Title>
              {t('artistProfilePageBatch30.manageStream')}
            </Dialog.Title>
            <StreamManagerPanel
              slug={channel.slug}
              channelState={channel.state}
              readOnly={!isOwner && !isAdministrator}
              defaultExpanded
            />
          </>
        ) : null}
      </Dialog.Root>

      <ArtistFollowListDialog
        username={username}
        artistName={artist.displayName}
        direction={followList}
        onClose={() => setFollowList(null)}
      />

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
    </ContentReveal>
  );
}
