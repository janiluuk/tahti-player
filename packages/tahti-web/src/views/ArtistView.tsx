import { Link, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeftIcon,
  CalendarDays,
  Disc3Icon,
  DownloadIcon,
  ImagesIcon,
  LibraryIcon,
  ListMusicIcon,
  MessageCircle,
  Mic,
  MusicIcon,
  PaintbrushIcon,
  RadioTowerIcon,
  UserPlusIcon,
  UsersIcon,
  UsersRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  Button,
  Dialog,
  SaveButton,
  TabLabel,
  Tabs,
  Textarea,
  Tooltip,
} from '@tahti-player/ui';

import {
  fetchPinnedAnnouncements,
  type PinnedAnnouncement,
} from '../api/announcements';
import {
  fetchMyPressKitImages,
  fetchPublicPressKitImages,
  type PublicPressKitImage,
} from '../api/artist-settings';
import {
  BRAND_ACCENTS,
  channelLookExtrasFromVisual,
  isActiveTextOverlay,
  parseColorScheme,
  resolveChannelLookExtras,
  resolvePublicVisualizerPreset,
  type ChannelLookExtras,
} from '../api/channel-design';
import { apiBase, fetchChannel, fetchProfile } from '../api/client';
import {
  fetchChannelDiscoWidgets,
  type DiscoWidgetRenderItem,
} from '../api/disco-widgets';
import { fetchPublicMentions, type PublicMention } from '../api/mentions';
import { fetchPublicRadioShow, type PublicRadioShow } from '../api/shows';
import {
  fetchChannelPosts,
  patchMeProfile,
  type ArtistPost,
} from '../api/studio-extras';
import type {
  PublicChannel,
  PublicProfile,
  PublicProfileRelease,
  TahtiPlayable,
} from '../api/types';
import {
  ArtistCollectionsTab,
  ArtistMusicTab,
  ArtistReleasesTab,
} from '../components/artist-view';
import {
  ArtistGalleryAddIcon,
  ArtistGalleryPanel,
} from '../components/ArtistGalleryPanel';
import { ChannelDesigner } from '../components/ChannelDesigner';
import { ChannelVisualizer } from '../components/ChannelVisualizer';
import { DiscoWidgetsSection } from '../components/disco-widgets/DiscoWidgetsSection';
import { EmbedButton } from '../components/EmbedButton';
import {
  EntitySocialHeader,
  type EntitySocialStat,
} from '../components/EntitySocialHeader';
import { ImageLightbox } from '../components/ImageLightbox';
import { NewsletterSubscribeToggle } from '../components/NewsletterSubscribeToggle';
import { PageEmpty, PageLoading } from '../components/PageStates';
import { QueueConfirmDialog } from '../components/QueueConfirmDialog';
import {
  releasePlayables,
  ReleaseTracklistDialog,
} from '../components/ReleaseTracklistDialog';
import { ShowEpisodeList } from '../components/ShowEpisodeList';
import { StreamManagerPanel } from '../components/StreamManagerPanel';
import { Eyebrow } from '../components/tahti/Eyebrow';
import { TrackEditDialog } from '../components/TrackEditDialog';
import { hasAccountRole } from '../lib/accountRoles';
import { resolveArtworkVisualizerPreset } from '../lib/artworkVisualizer';
import {
  loadArtistLookVisibility,
  type ArtistLookBlockId,
} from '../lib/channelLookElements';
import { colorSchemeCssVars, normalizeColorScheme } from '../lib/colorScheme';
import { isPinned } from '../lib/pinnedTracks';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { syncDocumentMetadata } from '../lib/seo';
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';
import { playableFromQueueItem, usePlayerStore } from '../stores/playerStore';

const publicPressKitUrl = (username: string): string => {
  return `${apiBase()}/api/v1/u/${encodeURIComponent(username)}/press-kit.zip`;
};

function releaseToPlayable(
  release: PublicProfile['releases'][number],
  artist: string,
  channelSlug?: string,
): TahtiPlayable | null {
  const track = release.tracks?.find((t) => t.playUrl);
  if (!track?.playUrl) {
    return null;
  }
  const isHls = track.playUrl.includes('.m3u8');
  return {
    id: `sound:${track.soundId ?? release.id}`,
    kind: 'sound',
    title: track.title,
    artist,
    coverUrl: release.artworkUrl ?? undefined,
    streamUrl: track.playUrl,
    protocol: isHls ? 'hls' : 'https',
    channelSlug,
    releaseDate: release.releaseDate ?? null,
  };
}

type ArtistProfileEmbed = {
  label: string;
  url: string;
  height: number;
};

function artistProfileEmbed(url: string): ArtistProfileEmbed | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
  const path = parsed.pathname.replace(/\/$/, '');
  const encodedUrl = encodeURIComponent(url);

  if (
    host === 'soundcloud.com' &&
    path.split('/').filter(Boolean).length === 1
  ) {
    const params = new URLSearchParams({
      url,
      color: '%23ff5500',
      auto_play: 'false',
      show_user: 'true',
      show_reposts: 'false',
      visual: 'false',
    });
    return {
      label: 'SoundCloud',
      url: `https://w.soundcloud.com/player/?${params.toString()}`,
      height: 166,
    };
  }

  if (host === 'mixcloud.com' && path.split('/').filter(Boolean).length >= 1) {
    return {
      label: 'Mixcloud',
      url: `https://player-widget.mixcloud.com/widget/iframe/?feed=${encodedUrl}&hide_cover=0&light=0`,
      height: 180,
    };
  }

  if (host === 'open.spotify.com') {
    const [kind, id] = path.split('/').filter(Boolean);
    if (kind && id && ['artist', 'show', 'playlist'].includes(kind)) {
      return {
        label: 'Spotify',
        url: `https://open.spotify.com/embed/${kind}/${encodeURIComponent(id)}`,
        height: kind === 'artist' ? 352 : 152,
      };
    }
  }

  if (host === 'twitch.tv' && path.split('/').filter(Boolean).length === 1) {
    const channelName = path.slice(1);
    const parent = encodeURIComponent(window.location.hostname);
    return {
      label: 'Twitch',
      url: `https://player.twitch.tv/?channel=${encodeURIComponent(channelName)}&parent=${parent}&autoplay=false`,
      height: 360,
    };
  }

  if (host === 'kick.com' && path.split('/').filter(Boolean).length === 1) {
    return {
      label: 'Kick',
      url: `https://player.kick.com/${encodeURIComponent(path.slice(1))}`,
      height: 360,
    };
  }

  if (
    (host === 'youtube.com' || host === 'youtu.be') &&
    (/^\/channel\/[\w-]+$/i.test(path) || /^\/@[\w-]+$/i.test(path))
  ) {
    const channelId = path.split('/').filter(Boolean).at(-1);
    return channelId
      ? {
          label: 'YouTube',
          url: `https://www.youtube-nocookie.com/embed?listType=user_uploads&list=${encodeURIComponent(channelId)}`,
          height: 220,
        }
      : null;
  }

  return null;
}

type Tab = 'music' | 'releases' | 'collections' | 'gallery' | 'design';

export function profileTrackToPlayable(
  track: PublicProfile['tracks'][number],
  artist: string,
  channelSlug?: string,
): TahtiPlayable | null {
  if (!track.playUrl) {
    return null;
  }
  const isHls = track.playUrl.includes('.m3u8');
  return {
    id: `sound:${track.id}`,
    kind: 'sound',
    title: track.title,
    artist: track.artistName ?? artist,
    coverUrl: track.bannerUrl ?? undefined,
    streamUrl: track.playUrl,
    protocol: isHls ? 'hls' : 'https',
    channelSlug,
    releaseDate: track.createdAt ?? null,
  };
}

export function ArtistView({ username }: { username: string }) {
  const me = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('music');
  const [galleryImages, setGalleryImages] = useState<PublicPressKitImage[]>([]);
  const [galleryLoaded, setGalleryLoaded] = useState(false);
  const [tracklistRelease, setTracklistRelease] =
    useState<PublicProfileRelease | null>(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [editingFullBio, setEditingFullBio] = useState(false);
  const [fullBioDraft, setFullBioDraft] = useState('');
  const [savingFullBio, setSavingFullBio] = useState(false);
  const [albumPrompt, setAlbumPrompt] = useState<{
    release: PublicProfileRelease;
    playables: TahtiPlayable[];
  } | null>(null);
  const [queueConfirm, setQueueConfirm] = useState<{
    title: string;
    playables: TahtiPlayable[];
  } | null>(null);
  const [channelVisual, setChannelVisual] = useState<Pick<
    PublicChannel,
    | 'visualPreset'
    | 'visualSettingsJson'
    | 'colorScheme'
    | 'colorSchemeJson'
    | 'headerStyle'
    | 'brandAccentPreset'
    | 'hlsUrl'
    | 'videoBackgroundUrl'
    | 'slideshowImages'
    | 'nowPlayingOverlayStyle'
    | 'nowPlayingOverlaySettingsJson'
    | 'playerOverlayMode'
    | 'playerOverlayText'
    | 'playerOverlayAlign'
    | 'usePlayerGradient'
    | 'playerColorSchemeJson'
    | 'useBackgroundGradient'
    | 'backgroundColorSchemeJson'
    | 'backgroundVisualPreset'
  > | null>(null);
  const [lookExtras, setLookExtras] = useState<ChannelLookExtras>({});
  const [editingSoundId, setEditingSoundId] = useState<string | null>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [discoWidgets, setDiscoWidgets] = useState<DiscoWidgetRenderItem[]>([]);
  const [liveShows, setLiveShows] = useState<PublicRadioShow | null>(null);
  const [taggedIn, setTaggedIn] = useState<PublicMention[]>([]);
  const [channelPosts, setChannelPosts] = useState<ArtistPost[]>([]);
  const [channelNews, setChannelNews] = useState<PinnedAnnouncement[]>([]);
  const [lookVisibility, setLookVisibility] = useState<
    Record<ArtistLookBlockId, boolean>
  >(loadArtistLookVisibility(username));

  const navigate = useNavigate();
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const currentId = usePlayerStore((s) => s.currentId);
  const queue = usePlayerStore((s) => s.queue);
  const toggleFavoriteTrack = useLibraryStore((s) => s.toggleFavoriteTrack);
  const favoriteTracks = useLibraryStore((s) => s.favoriteTracks);

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
    void fetchProfile(username).then((res) => {
      if (cancelled) {
        return;
      }
      setProfile(res.data);
      setLoading(false);

      void fetchPublicMentions(username).then((mentions) => {
        if (!cancelled) {
          setTaggedIn(mentions.data);
        }
      });

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
    });
    return () => {
      cancelled = true;
    };
  }, [username]);

  useEffect(() => {
    const slug = profile?.channel?.slug;
    if (!slug) {
      setChannelVisual(null);
      setLookExtras({});
      setDiscoWidgets([]);
      setChannelPosts([]);
      setChannelNews([]);
      setLookVisibility(loadArtistLookVisibility(username));
      return;
    }
    setLookVisibility(loadArtistLookVisibility(slug));
    setLookExtras(resolveChannelLookExtras(slug, {}));
    let cancelled = false;
    void Promise.all([
      fetchChannel(slug),
      fetchChannelDiscoWidgets(slug),
      fetchChannelPosts(slug),
      fetchPinnedAnnouncements(slug),
    ]).then(([res, widgets, posts, news]) => {
      if (cancelled) {
        return;
      }
      setChannelVisual({
        visualPreset: res.data.visualPreset,
        visualSettingsJson: res.data.visualSettingsJson,
        colorScheme: res.data.colorScheme,
        colorSchemeJson: res.data.colorSchemeJson,
        headerStyle: res.data.headerStyle,
        brandAccentPreset: res.data.brandAccentPreset,
        hlsUrl: res.data.hlsUrl,
        videoBackgroundUrl: res.data.videoBackgroundUrl,
        slideshowImages: res.data.slideshowImages,
        nowPlayingOverlayStyle: res.data.nowPlayingOverlayStyle,
        nowPlayingOverlaySettingsJson: res.data.nowPlayingOverlaySettingsJson,
        playerOverlayMode: res.data.playerOverlayMode,
        playerOverlayText: res.data.playerOverlayText,
        playerOverlayAlign: res.data.playerOverlayAlign,
        usePlayerGradient: res.data.usePlayerGradient,
        playerColorSchemeJson: res.data.playerColorSchemeJson,
        useBackgroundGradient: res.data.useBackgroundGradient,
        backgroundColorSchemeJson: res.data.backgroundColorSchemeJson,
        backgroundVisualPreset: res.data.backgroundVisualPreset,
      });
      setLookExtras(
        resolveChannelLookExtras(slug, channelLookExtrasFromVisual(res.data)),
      );
      setDiscoWidgets(widgets.data);
      setChannelPosts(posts.data);
      setChannelNews(news);
    });
    return () => {
      cancelled = true;
    };
  }, [profile?.channel?.slug, username]);

  useEffect(() => {
    const slug = profile?.channel?.slug;
    if (!slug) {
      setLiveShows(null);
      return;
    }
    let cancelled = false;
    void fetchPublicRadioShow(slug).then((result) => {
      if (!cancelled) {
        setLiveShows(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [profile?.channel?.slug]);

  useEffect(() => {
    let cancelled = false;
    setGalleryLoaded(false);
    const load = isOwner
      ? fetchMyPressKitImages().then((res) =>
          res.data.map(({ id, imageUrl, title }) => ({ id, imageUrl, title })),
        )
      : fetchPublicPressKitImages(username).then((res) => res.data);
    void load.then((images) => {
      if (cancelled) {
        return;
      }
      setGalleryImages(images);
      setGalleryLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [username, isOwner]);

  useEffect(() => {
    if (tab === 'gallery' && !hasGallery) {
      setTab('music');
    }
  }, [tab, hasGallery]);

  useEffect(() => {
    if (!profile) {
      return;
    }
    const showMusic =
      lookVisibility.player || lookVisibility.latest || lookVisibility.tracks;
    const availableTabs: Tab[] = [
      ...(showMusic &&
      (profile.tracks.length > 0 || profile.releases.length > 0)
        ? (['music'] as const)
        : []),
      ...(lookVisibility.releases && profile.releases.length > 0
        ? (['releases'] as const)
        : []),
      ...(profile.collections.some((collection) => collection.itemCount > 0)
        ? (['collections'] as const)
        : []),
      ...(hasGallery ? (['gallery'] as const) : []),
      ...(isOwner ? (['design'] as const) : []),
    ];
    if (!availableTabs.includes(tab)) {
      setTab(availableTabs[0] ?? 'music');
    }
  }, [hasGallery, isOwner, lookVisibility, profile, tab]);

  const { pinnedPlayables, pinnedTiles, catalogPlayables, releaseTiles } =
    useMemo(() => {
      if (!profile) {
        return {
          pinnedPlayables: [],
          pinnedTiles: [],
          catalogPlayables: [],
          releaseTiles: [],
        };
      }
      const artist = profile.artist.displayName;
      const slug = profile.channel?.slug;
      const pinnedTracks = [...profile.tracks]
        .filter((t) => isPinned(t))
        .sort((a, b) => (b.pinnedAt ?? '').localeCompare(a.pinnedAt ?? ''));
      const pinnedIds = new Set(pinnedTracks.map((t) => t.id));
      const toPlayable = (t: PublicProfile['tracks'][number]) =>
        profileTrackToPlayable(t, artist, slug);

      const pinnedTiles = pinnedTracks
        .map((t) => ({ track: t, playable: toPlayable(t) }))
        .filter(
          (
            x,
          ): x is {
            track: (typeof pinnedTracks)[number];
            playable: TahtiPlayable;
          } => Boolean(x.playable),
        );

      const releaseTiles = [...profile.releases]
        .sort((a, b) =>
          (b.releaseDate ?? '').localeCompare(a.releaseDate ?? ''),
        )
        .slice(0, 6)
        .map((release) => ({
          release,
          playable: releaseToPlayable(release, artist, slug),
        }));

      return {
        pinnedPlayables: pinnedTracks
          .map(toPlayable)
          .filter((p): p is TahtiPlayable => Boolean(p)),
        pinnedTiles,
        catalogPlayables: profile.tracks
          .filter((t) => !pinnedIds.has(t.id))
          .map(toPlayable)
          .filter((p): p is TahtiPlayable => Boolean(p)),
        releaseTiles,
      };
    }, [profile]);

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

  const { artist, channel, releases, collections, fanTiers } = profile;
  const profileConnections = Object.entries(artist.socialLinks ?? {}).filter(
    ([key, url]) =>
      Boolean(url) && key !== 'genres' && key !== 'showConnections',
  );
  const profileEmbeds = profileConnections
    .map(([, url]) => artistProfileEmbed(url))
    .filter((embed): embed is ArtistProfileEmbed => Boolean(embed));

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
    featuredIsCurrent &&
    (usePlayerStore.getState().status === 'playing' ||
      usePlayerStore.getState().status === 'loading');

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

  const tabs: Array<{
    id: Tab;
    label: string;
    icon: typeof MusicIcon;
  }> = [
    ...(lookVisibility.player || lookVisibility.latest || lookVisibility.tracks
      ? profile.tracks.length > 0 || releases.length > 0
        ? [{ id: 'music' as const, label: 'Music', icon: MusicIcon }]
        : []
      : []),
    ...(lookVisibility.releases && releases.length > 0
      ? [{ id: 'releases' as const, label: 'Releases', icon: Disc3Icon }]
      : []),
    ...(collections.some((collection) => collection.itemCount > 0)
      ? [
          {
            id: 'collections' as const,
            label: 'Collections',
            icon: LibraryIcon,
          },
        ]
      : []),
    ...(hasGallery
      ? [{ id: 'gallery' as const, label: 'Gallery', icon: ImagesIcon }]
      : []),
    ...(isOwner
      ? [{ id: 'design' as const, label: 'Design', icon: PaintbrushIcon }]
      : []),
  ];

  const headerStats: EntitySocialStat[] = [
    ...(artist.followerCount != null && artist.followerCount > 0
      ? [
          {
            key: 'followers',
            label: 'Followers',
            value: artist.followerCount,
            icon: UsersIcon,
          },
        ]
      : []),
    ...(artist.followingCount != null && artist.followingCount > 0
      ? [
          {
            key: 'following',
            label: 'Following',
            value: artist.followingCount,
            icon: UserPlusIcon,
          },
        ]
      : []),
    ...(profile.tracks.length > 0
      ? [
          {
            key: 'tracks',
            label: 'Tracks',
            value: profile.tracks.length,
            icon: MusicIcon,
          },
        ]
      : []),
    ...(collections.length > 0
      ? [
          {
            key: 'collections',
            label: 'Playlists',
            value: collections.length,
            icon: ListMusicIcon,
          },
        ]
      : []),
  ];

  const artistBackdropUrl = channelVisual?.videoBackgroundUrl
    ? null
    : (channelVisual?.slideshowImages?.[0] ?? null);
  const headerScheme = normalizeColorScheme(
    channelVisual?.colorScheme ??
      parseColorScheme(channelVisual?.colorSchemeJson),
  );
  const playerScheme = lookExtras.usePlayerGradient
    ? normalizeColorScheme(parseColorScheme(lookExtras.playerColorSchemeJson))
    : headerScheme;
  const pageScheme = lookExtras.useBackgroundGradient
    ? normalizeColorScheme(
        parseColorScheme(lookExtras.backgroundColorSchemeJson),
      )
    : headerScheme;
  const sectionSurfaceStyle = {
    backgroundColor: `${pageScheme.bg}e6`,
    borderColor: `${pageScheme.muted}66`,
    color: pageScheme.text,
  } as const;
  const playerStageGradient = `linear-gradient(to top, ${playerScheme.bg}cc, ${playerScheme.bg}59, ${playerScheme.bg}1a)`;
  const playerBottomGradient = `linear-gradient(to top, ${playerScheme.bg}cc, ${playerScheme.bg}73, transparent)`;
  const resolvedVisualizerPreset = channelVisual?.visualPreset
    ? resolvePublicVisualizerPreset(channelVisual.visualPreset)
    : undefined;
  const nowPlayingOverlayStyle =
    lookExtras.nowPlayingOverlayStyle ??
    channelVisual?.nowPlayingOverlayStyle ??
    null;
  const nowPlayingOverlaySettingsJson =
    lookExtras.nowPlayingOverlaySettingsJson ??
    channelVisual?.nowPlayingOverlaySettingsJson ??
    null;
  const playerOverlayMode =
    lookExtras.playerOverlayMode ?? channelVisual?.playerOverlayMode ?? null;
  const playerOverlayText =
    lookExtras.playerOverlayText ?? channelVisual?.playerOverlayText ?? null;
  const playerOverlayAlign =
    lookExtras.playerOverlayAlign ?? channelVisual?.playerOverlayAlign ?? null;
  const backgroundVisualPreset =
    lookExtras.backgroundVisualPreset ??
    channelVisual?.backgroundVisualPreset ??
    null;
  const brandGradient = BRAND_ACCENTS.find(
    (brand) => brand.id === channelVisual?.brandAccentPreset,
  )?.gradient;
  const showPlayerOverlay = isActiveTextOverlay({
    mode: playerOverlayMode,
    text: playerOverlayText,
  });

  return (
    <div
      className="relative isolate flex w-full flex-col gap-6 overflow-hidden rounded-2xl p-4 sm:p-6"
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
            {!isOwner && artist.freeSubscriptionsEnabled !== false ? (
              <NewsletterSubscribeToggle
                artistUsername={artist.username}
                artistDisplayName={artist.displayName}
                iconOnly
              />
            ) : null}
            {!isOwner &&
            artist.freeSubscriptionsEnabled !== false &&
            fanTiers.length > 0 ? (
              <Tooltip
                content={`Subscribe to ${artist.displayName}'s fan tiers`}
                side="top"
              >
                <Link
                  to="/subscribe/$username"
                  params={{ username: artist.username }}
                >
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    className="bg-background border-border rounded-md border-(length:--border-width)"
                    aria-label={`Subscribe to ${artist.displayName}'s fan tiers`}
                  >
                    <UsersRound size={16} aria-hidden />
                  </Button>
                </Link>
              </Tooltip>
            ) : null}
            {!isOwner && profile.links.presskit ? (
              <Tooltip content="Download press kit" side="top">
                <a href={publicPressKitUrl(artist.username)} download>
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    className="bg-background border-border rounded-md border-(length:--border-width)"
                    aria-label="Download press kit"
                  >
                    <DownloadIcon size={16} aria-hidden />
                  </Button>
                </a>
              </Tooltip>
            ) : null}
            {channel?.slug && !isOwner ? (
              <EmbedButton
                target={{ kind: 'channel', slug: channel.slug }}
                iconOnly
              />
            ) : null}
            {channel?.slug ? (
              <Tooltip content="Open channel" side="top">
                <Link to="/channel/$slug" params={{ slug: channel.slug }}>
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    className="bg-background border-border rounded-md border-(length:--border-width)"
                    aria-label="Open channel"
                  >
                    <RadioTowerIcon size={16} aria-hidden />
                  </Button>
                </Link>
              </Tooltip>
            ) : null}
            {isOwner && channel?.slug ? (
              <Link
                to="/channel/$slug"
                params={{ slug: channel.slug }}
                search={{ edit: true }}
              >
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-background border-border rounded-md border-(length:--border-width)"
                >
                  Edit design
                </Button>
              </Link>
            ) : isOwner ? (
              <Button
                size="sm"
                variant="secondary"
                className="bg-background border-border rounded-md border-(length:--border-width)"
                onClick={() => setTab('design')}
              >
                Edit look
              </Button>
            ) : null}
          </>
        }
        data-testid="artist-social-header"
      />

      {lookVisibility.bio !== false &&
        (editingFullBio ||
          artist.fullBio ||
          isOwner ||
          discoWidgets.length > 0) && (
          <section
            className="flex flex-col gap-5 rounded-2xl border p-4 shadow-sm sm:p-6"
            style={sectionSurfaceStyle}
          >
            {editingFullBio ? (
              <div className="flex max-w-2xl flex-col gap-2">
                <Textarea
                  autoFocus
                  rows={6}
                  placeholder="Share your full history — how you got started, your influences, milestones…"
                  value={fullBioDraft}
                  onChange={(e) => setFullBioDraft(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={savingFullBio}
                    onClick={() => setEditingFullBio(false)}
                  >
                    Cancel
                  </Button>
                  <SaveButton
                    saving={savingFullBio}
                    onClick={async () => {
                      setSavingFullBio(true);
                      const result = await patchMeProfile({
                        fullBio: fullBioDraft.trim() || null,
                      });
                      setSavingFullBio(false);
                      if (!result.ok) {
                        return;
                      }
                      setProfile((prev) =>
                        prev
                          ? {
                              ...prev,
                              artist: {
                                ...prev.artist,
                                fullBio: result.data.fullBio ?? null,
                              },
                            }
                          : prev,
                      );
                      setEditingFullBio(false);
                    }}
                  />
                </div>
              </div>
            ) : artist.fullBio ? (
              <div className="max-w-2xl">
                <p className="text-foreground text-sm whitespace-pre-wrap">
                  {artist.fullBio}
                </p>
                {isOwner && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    onClick={() => {
                      setFullBioDraft(artist.fullBio ?? '');
                      setEditingFullBio(true);
                    }}
                  >
                    Edit full bio
                  </Button>
                )}
              </div>
            ) : isOwner ? (
              <Button
                size="sm"
                variant="secondary"
                className="self-start"
                onClick={() => {
                  setFullBioDraft('');
                  setEditingFullBio(true);
                }}
              >
                + Add full bio
              </Button>
            ) : null}
            <DiscoWidgetsSection widgets={discoWidgets} />
            <div className="flex flex-wrap gap-3 text-sm">
              {isOwner && (
                <Link
                  to="/studio/channel"
                  className="text-foreground-secondary underline-offset-2 hover:underline"
                >
                  Full studio settings
                </Link>
              )}
            </div>
          </section>
        )}

      {lookVisibility.shows !== false &&
      liveShows &&
      (liveShows.upcomingEpisodes.length > 0 ||
        liveShows.pastEpisodes.length > 0) ? (
        <section
          className="flex flex-col gap-4 rounded-2xl border p-4 sm:p-6"
          style={sectionSurfaceStyle}
        >
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays size={18} aria-hidden />
              <h2 className="font-display text-lg font-bold tracking-tight">
                Live shows
              </h2>
            </div>
            <p className="text-foreground-secondary mt-1 text-sm">
              Upcoming broadcasts and recordings from this artist on Tahti
              Radio.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {liveShows.upcomingEpisodes.length > 0 ? (
              <ShowEpisodeList
                title="Upcoming"
                episodes={liveShows.upcomingEpisodes}
                icon={<Mic size={16} aria-hidden />}
                channelSlug={channel?.slug}
                username={artist.username}
              />
            ) : null}
            {liveShows.pastEpisodes.length > 0 ? (
              <ShowEpisodeList
                title="Past recordings"
                episodes={liveShows.pastEpisodes}
                icon={<MessageCircle size={16} aria-hidden />}
                channelSlug={channel?.slug}
              />
            ) : null}
          </div>
        </section>
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
        <section
          className="rounded-2xl border p-4 sm:p-6"
          style={sectionSurfaceStyle}
        >
          <div className="mb-3">
            <h2 className="font-display text-lg font-bold tracking-tight">
              Tagged in
            </h2>
            <p className="text-foreground-secondary mt-1 text-sm">
              Projects and artist pages where this artist has been credited.
            </p>
          </div>
          <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
            {taggedIn.map((mention) => {
              const href =
                mention.sourceUrl ?? `/u/${mention.mentioner.username}`;
              const title =
                mention.sourceTitle ?? mention.mentioner.displayName;
              return (
                <li
                  key={mention.id}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <a
                      href={href}
                      className="text-primary truncate text-sm font-semibold hover:underline"
                    >
                      {title}
                    </a>
                    <p className="text-foreground-secondary text-xs">
                      {mention.surface === 'TRACKLIST'
                        ? 'Tracklist credit'
                        : 'Artist description'}
                      {` · by ${mention.mentioner.displayName}`}
                    </p>
                  </div>
                  <span className="text-foreground-secondary shrink-0 text-xs">
                    {new Date(mention.createdAt).toLocaleDateString()}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {lookVisibility.feed && channelPosts.length > 0 ? (
        <section className="flex flex-col gap-3">
          <Eyebrow>Feed</Eyebrow>
          <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
            {channelPosts.map((post) => (
              <li key={post.id} className="flex flex-col gap-1 p-3">
                {post.title ? (
                  <p className="text-sm font-semibold">{post.title}</p>
                ) : null}
                <p className="text-foreground-secondary text-sm">{post.body}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {lookVisibility.news && channelNews.length > 0 ? (
        <section className="flex flex-col gap-3">
          <Eyebrow>News</Eyebrow>
          <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
            {channelNews.map((item) => (
              <li key={item.id} className="p-3 text-sm">
                {item.body}
              </li>
            ))}
          </ul>
        </section>
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

      {tab === 'music' && (
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
          overlay={{
            show: showPlayerOverlay,
            mode: playerOverlayMode,
            text: playerOverlayText,
            align: playerOverlayAlign,
            styleId: nowPlayingOverlayStyle,
            settingsJson: nowPlayingOverlaySettingsJson,
          }}
          nowPlayingHere={nowPlayingHere}
          featured={{
            playable: featuredPlayable,
            isPlaying: featuredIsPlaying,
            track: featuredTrack,
            onPlay: playFeatured,
          }}
          pinnedTiles={pinnedTiles}
          releaseTiles={releaseTiles}
          releaseCount={releases.length}
          onViewAllReleases={() => setTab('releases')}
          catalogPlayables={catalogPlayables}
          hasPinnedPlayables={pinnedPlayables.length > 0}
          onPlay={play}
          onToggleFavorite={toggleFavoriteTrack}
          favoriteTracks={favoriteTracks}
          onNavigateSmartLink={(slug) => {
            void navigate({ to: '/r/$slug', params: { slug } });
          }}
          onTitleClick={setTracklistRelease}
          onPlayRelease={playOrPromptAlbum}
          onQueueConfirm={setQueueConfirm}
          onQueueAlbum={queueAlbum}
          onEditTrack={setEditingSoundId}
          onOpenManager={() => setManagerOpen(true)}
        />
      )}

      {tab === 'releases' && <ArtistReleasesTab releases={releases} />}

      {tab === 'collections' && (
        <ArtistCollectionsTab
          collections={collections}
          username={artist.username}
        />
      )}

      {tab === 'gallery' && hasGallery && (
        <ArtistGalleryPanel
          images={galleryImages}
          isOwner={isOwner}
          onChange={(next) => {
            setGalleryImages(next);
            if (next.length === 0) {
              setTab('music');
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
            onSaved={() => {
              const slug = channel?.slug;
              if (!slug) {
                return;
              }
              void fetchChannel(slug).then((res) => {
                if (!res.data) {
                  return;
                }
                setChannelVisual({
                  visualPreset: res.data.visualPreset,
                  visualSettingsJson: res.data.visualSettingsJson,
                  colorScheme: res.data.colorScheme,
                  colorSchemeJson: res.data.colorSchemeJson,
                  headerStyle: res.data.headerStyle,
                  brandAccentPreset: res.data.brandAccentPreset,
                  hlsUrl: res.data.hlsUrl,
                  videoBackgroundUrl: res.data.videoBackgroundUrl,
                  slideshowImages: res.data.slideshowImages,
                  nowPlayingOverlayStyle: res.data.nowPlayingOverlayStyle,
                  nowPlayingOverlaySettingsJson:
                    res.data.nowPlayingOverlaySettingsJson,
                  playerOverlayMode: res.data.playerOverlayMode,
                  playerOverlayText: res.data.playerOverlayText,
                  playerOverlayAlign: res.data.playerOverlayAlign,
                  usePlayerGradient: res.data.usePlayerGradient,
                  playerColorSchemeJson: res.data.playerColorSchemeJson,
                  useBackgroundGradient: res.data.useBackgroundGradient,
                  backgroundColorSchemeJson: res.data.backgroundColorSchemeJson,
                  backgroundVisualPreset: res.data.backgroundVisualPreset,
                });
                setLookExtras(
                  resolveChannelLookExtras(
                    slug,
                    channelLookExtrasFromVisual(res.data),
                  ),
                );
              });
            }}
          />
        </div>
      )}

      {artist.socialLinks?.showConnections !== 'false' &&
      profileEmbeds.length > 0 ? (
        <section className="flex flex-col gap-3">
          <Eyebrow>Elsewhere</Eyebrow>
          <div className="grid gap-3 lg:grid-cols-2" aria-label="Artist embeds">
            {profileEmbeds.map((embed) => (
              <div
                key={`${embed.label}-${embed.url}`}
                className="border-border bg-background/40 overflow-hidden rounded-xl border"
              >
                <div className="text-foreground-secondary px-3 py-2 text-xs font-semibold tracking-wide uppercase">
                  {embed.label}
                </div>
                <iframe
                  title={`${embed.label} profile`}
                  src={embed.url}
                  width="100%"
                  height={embed.height}
                  className="block w-full border-0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </section>
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
          void fetchProfile(username).then((res) => setProfile(res.data));
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

      <Dialog.Root
        isOpen={Boolean(albumPrompt)}
        onClose={() => setAlbumPrompt(null)}
      >
        {albumPrompt && (
          <>
            <Dialog.Title>Play {albumPrompt.release.title}?</Dialog.Title>
            <Dialog.Description>
              Something&apos;s already queued — add this album to the end, or
              play it now instead?
            </Dialog.Description>
            <Dialog.Actions>
              <Dialog.Close>Cancel</Dialog.Close>
              <Button
                variant="secondary"
                onClick={() => {
                  queueAlbum(albumPrompt.playables);
                  setAlbumPrompt(null);
                }}
              >
                Queue album
              </Button>
              <Button
                onClick={() => {
                  playAlbum(albumPrompt.playables);
                  setAlbumPrompt(null);
                }}
              >
                Play now
              </Button>
            </Dialog.Actions>
          </>
        )}
      </Dialog.Root>

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
