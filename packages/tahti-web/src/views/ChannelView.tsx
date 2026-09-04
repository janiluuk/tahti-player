import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import {
  DownloadIcon,
  GripVerticalIcon,
  HeartIcon,
  LayoutDashboardIcon,
  MessageCircle,
  Mic,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  Settings2Icon,
  UsersIcon,
  WifiOffIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  Badge,
  Button,
  Loader,
  SaveButton,
  StatChip,
  TabLabel,
  Tabs,
  Tooltip,
} from '@tahti-player/ui';

import {
  BRAND_ACCENTS,
  fillColorScheme,
  isHeaderImageUrl,
  isValidHeaderBackdropUrl,
  loadChannelLookExtras,
  parseColorScheme,
  patchChannelVisual,
  resolvePublicVisualizerPreset,
  saveChannelLookExtras,
  youtubeEmbedUrl,
  type ChannelLink,
} from '../api/channel-design';
import {
  archiveItemToPlayable,
  fetchChannel,
  fetchChannelArchive,
  fetchProfile,
} from '../api/client';
import {
  fetchChannelDiscoWidgets,
  type DiscoWidgetRenderItem,
} from '../api/disco-widgets';
import { fetchPublicRadioShow, type PublicRadioShow } from '../api/shows';
import type { ArchiveItem, PublicChannel, TahtiPlayable } from '../api/types';
import { ChannelBackdropCard } from '../components/ChannelBackdropCard';
import {
  ChannelDesigner,
  type ChannelDesignerHandle,
} from '../components/ChannelDesigner';
import { ChannelLayersMenu } from '../components/ChannelLayersMenu';
import { ChannelLinksEditor } from '../components/ChannelLinksEditor';
import { ChannelShareButton } from '../components/ChannelShareButton';
import { type TextOverlayDraft } from '../components/ChannelTextOverlayEditor';
import { ChannelTextOverlayView } from '../components/ChannelTextOverlayView';
import { ChannelVisualizer } from '../components/ChannelVisualizer';
import { DiscoWidgetsSection } from '../components/disco-widgets/DiscoWidgetsSection';
import {
  EntitySocialHeader,
  type EntitySocialStat,
} from '../components/EntitySocialHeader';
import { ListenerWidgetEmbed } from '../components/ListenerWidgetEmbed';
import { NowPlayingOverlay } from '../components/NowPlayingOverlay';
import { PageHeader } from '../components/PageHeader';
import { PageEmpty, PageLoading } from '../components/PageStates';
import { PlayableTrackTable } from '../components/PlayableTrackTable';
import { ShowEpisodeList } from '../components/ShowEpisodeList';
import { SocialLinkIcon } from '../components/SocialLinkIcon';
import { StreamManagerPanel } from '../components/StreamManagerPanel';
import { Eyebrow } from '../components/tahti/Eyebrow';
import { OnAirBadge } from '../components/tahti/OnAirBadge';
import { WaveformSeekbar } from '../components/tahti/WaveformSeekbar';
import { listenerWidgetType } from '../content/listenerWidgets';
import {
  parseNowPlayingOverlaySettings,
  resolveNowPlayingOverlayPreset,
} from '../content/nowPlayingOverlayPresets';
import { hasAccountRole } from '../lib/accountRoles';
import type { ChannelLookElementId } from '../lib/channelLookElements';
import {
  addItemType,
  CHANNEL_PAGE_ITEM_META,
  getLayoutPreset,
  loadChannelLayoutPresetId,
  loadChannelPageLayout,
  moveItem,
  saveChannelLayoutPresetId,
  saveChannelPageLayout,
  setItemOffset,
  setItemVisible,
  setItemWidth,
  type ChannelLayoutPresetId,
  type ChannelPageItem,
  type ChannelPageItemType,
} from '../lib/channelPageLayout';
import { colorSchemeCssVars, normalizeColorScheme } from '../lib/colorScheme';
import { downloadM3uPlaylist } from '../lib/m3uPlaylist';
import { isPinned } from '../lib/pinnedTracks';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { syncDocumentMetadata } from '../lib/seo';
import { useAuthStore } from '../stores/authStore';
import { useLayoutStore } from '../stores/layoutStore';
import { useLibraryStore } from '../stores/libraryStore';
import { useListenerWidgetsStore } from '../stores/listenerWidgetsStore';
import { usePlayerStore } from '../stores/playerStore';

const CHANNEL_RADIO_VIZ_SETTINGS = { speed: 1.15, intensity: 1.8, scale: 1 };

/** Draggable blocks lock to a 16px grid — keeps free-form offsets tidy
 * instead of landing on arbitrary pixel values. */
const LAYOUT_GRID_SIZE = 16;
const snapToGrid = (value: number) =>
  Math.round(value / LAYOUT_GRID_SIZE) * LAYOUT_GRID_SIZE;

export function ChannelView({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { edit?: string };
  const me = useAuthStore((s) => s.user);
  const [channel, setChannel] = useState<PublicChannel | null>(null);
  const [archive, setArchive] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<ChannelPageItem[]>(() =>
    loadChannelPageLayout(slug),
  );
  const [activePresetId, setActivePresetId] =
    useState<ChannelLayoutPresetId | null>(() =>
      loadChannelLayoutPresetId(slug),
    );
  const [editing, setEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [moveDrag, setMoveDrag] = useState<{
    id: string;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [layoutDirty, setLayoutDirty] = useState(false);
  const [lookDirty, setLookDirty] = useState(false);
  const [linksOrOverlayDirty, setLinksOrOverlayDirty] = useState(false);
  const [channelLinksDraft, setChannelLinksDraft] = useState<ChannelLink[]>([]);
  const [textOverlayDraft, setTextOverlayDraft] = useState<TextOverlayDraft>({
    mode: 'NONE',
    text: '',
    align: 'CENTER',
  });
  const [savingLook, setSavingLook] = useState(false);
  const channelDesignerRef = useRef<ChannelDesignerHandle>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);
  const [lookTick, setLookTick] = useState(0);
  const [lookExtrasTick, setLookExtrasTick] = useState(0);
  const [presetNote, setPresetNote] = useState<string | null>(null);
  const [discoWidgets, setDiscoWidgets] = useState<DiscoWidgetRenderItem[]>([]);
  const [liveShows, setLiveShows] = useState<PublicRadioShow | null>(null);
  const [channelTab, setChannelTab] = useState<'overview' | 'manage'>(
    'overview',
  );
  const listenerWidgetInstances = useListenerWidgetsStore((s) => s.instances);

  const play = usePlayerStore((s) => s.play);
  const currentId = usePlayerStore((s) => s.currentId);
  const playbackStatus = usePlayerStore((s) => s.status);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const setPlaybackStatus = usePlayerStore((s) => s.setStatus);
  const toggleFavoriteChannel = useLibraryStore((s) => s.toggleFavoriteChannel);
  const favorited = useLibraryStore((s) =>
    s.favoriteChannels.some((c) => c.slug === slug),
  );
  const setChatContext = useLayoutStore((s) => s.setChatContext);
  const clearChatContext = useLayoutStore((s) => s.clearChatContext);
  const openChatRail = useLayoutStore((s) => s.openChatRail);
  const rightCollapsed = useLayoutStore((s) => s.rightCollapsed);
  const toggleRight = useLayoutStore((s) => s.toggleRight);

  useEffect(() => clearChatContext, [clearChatContext]);

  const isOwner = Boolean(
    me && channel && me.username === channel.user.username,
  );
  const isAdministrator = hasAccountRole(me, 'BOARD');
  const subtle = activePresetId === 'subtle';
  const configuredEmbedItems = listenerWidgetInstances
    .filter((instance) => Boolean(listenerWidgetType(instance.typeId)))
    .filter(
      (instance) =>
        !layout.some(
          (item) =>
            item.type === 'embed' && item.embedInstanceId === instance.id,
        ),
    )
    .map((instance) => ({
      id: instance.id,
      label: instance.label,
      hint: listenerWidgetType(instance.typeId)?.name ?? 'External player',
      embedInstanceId: instance.id,
    }));

  useEffect(() => {
    setLayout(loadChannelPageLayout(slug));
    setActivePresetId(loadChannelLayoutPresetId(slug));
    setLayoutDirty(false);
  }, [slug]);

  useEffect(() => {
    if (search.edit === '1' && isOwner) {
      setEditing(true);
    }
  }, [search.edit, isOwner]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setChatContext({
      slug,
      enabled: true,
      autoOpen: !editing,
    });
    void Promise.all([
      fetchChannel(slug),
      fetchChannelArchive(slug),
      fetchChannelDiscoWidgets(slug),
      fetchPublicRadioShow(slug),
    ]).then(([ch, items, widgets, shows]) => {
      if (cancelled) {
        return;
      }
      setChannel(ch.data);
      setArchive(items.data);
      setDiscoWidgets(widgets.data);
      setLiveShows(shows.data);
      setLoading(false);

      if (ch.data) {
        const name = ch.data.user.displayName;
        syncDocumentMetadata(window.location.pathname, {
          title: `${name} live on Tahti`,
          description:
            ch.data.user.bio ??
            `Listen to ${name}'s live channel, archive, and programme on Tahti.`,
          image: ch.data.user.avatarUrl ?? undefined,
        });

        // The Stats block needs a real follower count, which lives on the
        // artist profile rather than the channel itself — fetched
        // separately so a slow/failed profile lookup never blocks the
        // channel page from rendering.
        void fetchProfile(ch.data.user.username)
          .then((profile) => {
            if (cancelled) {
              return;
            }
            setChannel((current) =>
              current
                ? {
                    ...current,
                    followerCount: profile.data.artist.followerCount ?? null,
                  }
                : current,
            );
          })
          .catch(() => {});
      }

      const enabled = ch.data?.chatEnabled !== false;
      setChatContext({
        slug,
        enabled,
        reason: enabled ? null : 'Chat is disabled for this channel',
        autoOpen: enabled && !editing,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [slug, setChatContext, editing, lookTick]);

  // Seed the Links / Text overlay editors' drafts once per channel visit
  // (keyed on the slug, not on every refetch) so in-progress typing in the
  // side panel is never clobbered by an unrelated look/layout save
  // elsewhere on the page bumping lookTick.
  useEffect(() => {
    if (!channel) {
      return;
    }
    setChannelLinksDraft(channel.channelLinks ?? []);
    setTextOverlayDraft({
      mode: channel.textOverlayMode ?? 'NONE',
      text: channel.textOverlayText ?? '',
      align: channel.textOverlayAlign ?? 'CENTER',
    });
    setLinksOrOverlayDirty(false);
  }, [channel?.slug]);

  const { pinnedPlayables, catalogPlayables } = useMemo(() => {
    const pinnedItems = [...archive]
      .filter((item) => isPinned(item))
      .sort((a, b) => (b.pinnedAt ?? '').localeCompare(a.pinnedAt ?? ''));
    const pinnedIds = new Set(pinnedItems.map((i) => i.id));
    const toPlayable = (item: ArchiveItem) => archiveItemToPlayable(item, slug);
    return {
      pinnedPlayables: pinnedItems
        .map(toPlayable)
        .filter((p): p is TahtiPlayable => Boolean(p)),
      catalogPlayables: archive
        .filter((item) => !pinnedIds.has(item.id))
        .map(toPlayable)
        .filter((p): p is TahtiPlayable => Boolean(p)),
    };
  }, [archive, slug]);

  if (loading) {
    return <PageLoading label="Loading channel…" />;
  }

  if (!channel) {
    return (
      <PageEmpty
        title="Channel not found"
        description="This channel may have been removed or is not available."
      />
    );
  }

  const live = channel.state === 'LIVE' && Boolean(channel.hlsUrl);
  // Keep the public page in sync with the header choice made in Studio.
  const showHeaderVideo =
    channel.headerStyle === 'VIDEO_LOOP' &&
    isValidHeaderBackdropUrl(channel.videoBackgroundUrl);
  const showSolidHeader = channel.headerStyle === 'SOLID';
  const lookExtras = useMemo(() => {
    const stored = loadChannelLookExtras(slug);
    return {
      ...stored,
      ...(channel.usePlayerGradient !== undefined
        ? { usePlayerGradient: channel.usePlayerGradient }
        : {}),
      ...(channel.playerColorSchemeJson !== undefined
        ? { playerColorSchemeJson: channel.playerColorSchemeJson }
        : {}),
      ...(channel.useBackgroundGradient !== undefined
        ? { useBackgroundGradient: channel.useBackgroundGradient }
        : {}),
      ...(channel.backgroundColorSchemeJson !== undefined
        ? { backgroundColorSchemeJson: channel.backgroundColorSchemeJson }
        : {}),
      ...(channel.backgroundVisualPreset !== undefined
        ? { backgroundVisualPreset: channel.backgroundVisualPreset }
        : {}),
    };
  }, [slug, lookExtrasTick, channel]);
  const pageScheme = normalizeColorScheme(
    lookExtras.useBackgroundGradient
      ? parseColorScheme(lookExtras.backgroundColorSchemeJson)
      : channel.colorScheme,
  );
  const headerScheme = normalizeColorScheme(channel.colorScheme);
  const playerScheme = lookExtras.usePlayerGradient
    ? normalizeColorScheme(parseColorScheme(lookExtras.playerColorSchemeJson))
    : headerScheme;
  const headerBackground = headerScheme.bg;
  const headerAccent = headerScheme.accent;
  const headerHighlight = headerScheme.highlight;
  const headerForeground = headerScheme.text;
  const heroVisualizerSettings = channel.visualSettingsJson
    ? undefined
    : CHANNEL_RADIO_VIZ_SETTINGS;
  const backgroundVisualPreset = lookExtras.backgroundVisualPreset ?? null;
  const brandGradient = BRAND_ACCENTS.find(
    (brand) => brand.id === channel.brandAccentPreset,
  )?.gradient;
  const headerBackdropIsImage = isHeaderImageUrl(channel.videoBackgroundUrl);
  const chatOn = channel.chatEnabled !== false;
  const channelIsCurrent =
    currentId === `live:${slug}` || currentId === `radio:${slug}`;
  const channelIsPlaying =
    channelIsCurrent &&
    (playbackStatus === 'playing' || playbackStatus === 'loading');
  const channelIsLoading = channelIsCurrent && playbackStatus === 'loading';
  const channelVideoMuted =
    !currentId ||
    (playbackStatus !== 'playing' && playbackStatus !== 'loading');

  const openChat = () => {
    if (!chatOn) {
      return;
    }
    openChatRail(slug);
  };

  const handleToggleChat = () => {
    if (!chatOn) {
      return;
    }
    if (rightCollapsed) {
      openChatRail(slug);
    } else {
      toggleRight();
    }
  };

  const handlePlayChannel = () => {
    if (channelIsCurrent) {
      setPlaybackStatus(channelIsPlaying ? 'paused' : 'playing');
      return;
    }
    void fetchChannel(slug).then(({ playable }) => {
      if (playable) {
        play(playable);
      }
    });
  };

  const handleDownloadPlaylist = () => {
    void fetchChannel(slug).then(({ playable }) => {
      if (playable) {
        downloadM3uPlaylist({
          title: `${channel.user.displayName} on Tahti`,
          streamUrl: playable.streamUrl,
          fileSlug: slug,
        });
      }
    });
  };

  const handleToggleFavoriteChannel = () =>
    toggleFavoriteChannel({
      slug,
      displayName: channel.user.displayName,
      avatarUrl: channel.user.avatarUrl,
    });

  // Takes an updater (not a precomputed array) so each call always builds on
  // the latest layout — reading the closed-over `layout` variable directly
  // races when two edits (e.g. a fast double-click on "Add") fire before
  // React re-renders between them, both computing from the same stale array
  // and silently dropping one of the changes (or duplicating an item).
  const updateLayout = (
    updater:
      | ChannelPageItem[]
      | ((prev: ChannelPageItem[]) => ChannelPageItem[]),
    opts?: { clearPreset?: boolean },
  ) => {
    setLayout((prev) =>
      typeof updater === 'function' ? updater(prev) : updater,
    );
    setLayoutDirty(true);
    if (opts?.clearPreset !== false && activePresetId) {
      setActivePresetId(null);
      saveChannelLayoutPresetId(slug, null);
    }
  };

  const removeLayoutItem = (id: string) => {
    updateLayout((prev) => prev.filter((item) => item.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const saveLayout = () => {
    saveChannelPageLayout(slug, layout);
    saveChannelLayoutPresetId(slug, activePresetId);
    setLayoutDirty(false);
  };

  // Combined save for the single toolbar button: the layers menu embeds
  // ChannelDesigner in `lookOnly` mode for its look controls, which used to
  // render its own separate "Save look" button right next to this one —
  // confusing to have two saves in the same panel. This one now covers both.
  const saveAll = async () => {
    if (layoutDirty) {
      saveLayout();
    }
    if (lookDirty) {
      setSavingLook(true);
      await channelDesignerRef.current?.save();
      setSavingLook(false);
    }
    if (linksOrOverlayDirty) {
      setSavingLook(true);
      saveChannelLookExtras(slug, {
        channelLinks: channelLinksDraft,
        textOverlayMode: textOverlayDraft.mode,
        textOverlayText: textOverlayDraft.text,
        textOverlayAlign: textOverlayDraft.align,
      });
      setLinksOrOverlayDirty(false);
      setLookTick((n) => n + 1);
      setLookExtrasTick((n) => n + 1);
      setSavingLook(false);
    }
  };

  const exitEdit = () => {
    if (layoutDirty) {
      saveLayout();
    }
    setEditing(false);
    setSelectedId(null);
    setPresetNote(null);
    void navigate({
      to: '/channel/$slug',
      params: { slug },
      search: {},
    });
  };

  const startEdit = () => {
    setEditing(true);
    setMobileMenuOpen(true);
    void navigate({
      to: '/channel/$slug',
      params: { slug },
      search: { edit: '1' },
    });
  };

  const applyPreset = (id: ChannelLayoutPresetId) => {
    const preset = getLayoutPreset(id);
    if (!preset) {
      return;
    }
    setLayout(preset.items);
    setActivePresetId(id);
    setLayoutDirty(true);
    setSelectedId(null);
    setPresetNote(`Applied "${preset.name}" — save layout to keep it.`);
    void patchChannelVisual({
      visualPreset: preset.look.visualPreset,
      headerStyle: preset.look.headerStyle,
      brandAccentPreset: preset.look.brandAccentPreset,
      colorScheme: fillColorScheme(preset.look.colorScheme),
    }).then((result) => {
      if (result.ok) {
        setLookTick((n) => n + 1);
      }
    });
  };

  const renderBlock = (item: ChannelPageItem) => {
    switch (item.type) {
      case 'hero':
        return (
          <ChannelBackdropCard
            className={
              editing
                ? ''
                : subtle
                  ? 'border-border/60 bg-background-input rounded-lg border'
                  : 'border-border rounded-xl border'
            }
            displayName={channel.user.displayName}
            username={channel.user.username}
            channelSlug={slug}
            avatarUrl={channel.user.avatarUrl}
            bio={channel.user.bio}
            headerStyle={channel.headerStyle ?? 'GRADIENT'}
            videoBackgroundUrl={channel.videoBackgroundUrl}
            muted={channelVideoMuted}
            accent={headerAccent}
            highlight={headerHighlight}
            bg={headerBackground}
            fg={headerForeground}
            gradientOverride={brandGradient}
            visualPreset={channel.visualPreset ?? 'AURORA'}
            colorScheme={playerScheme}
            colorSchemeJson={
              lookExtras.usePlayerGradient
                ? (lookExtras.playerColorSchemeJson ?? null)
                : channel.colorSchemeJson
            }
            artworkUrl={
              channel.nowPlaying?.artworkUrl ?? channel.user.avatarUrl
            }
            galleryMode={channel.galleryMode}
            slideshowImages={channel.slideshowImages}
            visualizerSettings={heroVisualizerSettings}
            visualSettingsJson={channel.visualSettingsJson}
            badge={
              live ? (
                <OnAirBadge />
              ) : (
                <span className="rounded border border-white/25 px-2 py-0.5 font-mono text-[10px] uppercase opacity-80">
                  {channel.state}
                </span>
              )
            }
            navItems={[
              { id: 'home', label: 'Home', active: true },
              {
                id: 'tracks',
                label: 'Tracks',
                onClick: () =>
                  document
                    .getElementById('channel-block-archive')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
              },
              {
                id: 'about',
                label: 'About',
                onClick: () =>
                  document
                    .getElementById('channel-block-about')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
              },
            ]}
            quickAdd={
              editing
                ? [
                    !layout.find((i) => i.type === 'links')?.visible
                      ? {
                          id: 'links',
                          label: 'Links',
                          onClick: () =>
                            updateLayout((prev) => addItemType(prev, 'links')),
                        }
                      : null,
                    !layout.find((i) => i.type === 'about')?.visible
                      ? {
                          id: 'about',
                          label: 'Bio',
                          onClick: () =>
                            updateLayout((prev) => addItemType(prev, 'about')),
                        }
                      : null,
                    !layout.find((i) => i.type === 'stats')?.visible
                      ? {
                          id: 'stats',
                          label: 'Stats',
                          onClick: () =>
                            updateLayout((prev) => addItemType(prev, 'stats')),
                        }
                      : null,
                  ].filter((chip): chip is NonNullable<typeof chip> =>
                    Boolean(chip),
                  )
                : undefined
            }
            onEditIdentity={editing ? () => setSelectedId('header') : undefined}
            identitySelected={selectedId === 'header'}
            backgroundSelected={selectedId === item.id}
            editable={editing}
            bottomSlot={
              !live && !channel.nowPlaying ? (
                <div className="flex items-center justify-center py-16">
                  <WifiOffIcon
                    size={56}
                    strokeWidth={1.5}
                    className="text-white/25"
                    aria-hidden
                  />
                </div>
              ) : (
                <div
                  className={`p-4 pr-24 sm:p-6 sm:pr-40 ${
                    subtle
                      ? 'bg-gradient-to-t from-black/80 via-black/35 to-transparent'
                      : 'bg-gradient-to-t from-black/70 to-transparent'
                  }`}
                >
                  {channel.nowPlaying ? (
                    <NowPlayingOverlay
                      presetId={resolveNowPlayingOverlayPreset(
                        channel.nowPlayingOverlayStyle,
                      )}
                      title={channel.nowPlaying.title}
                      artist={channel.nowPlaying.artistName}
                      artworkUrl={channel.nowPlaying.artworkUrl}
                      settings={parseNowPlayingOverlaySettings(
                        channel.nowPlayingOverlaySettingsJson,
                      )}
                      seekbar={
                        <WaveformSeekbar
                          trackId={`channel:${slug}`}
                          progress={
                            channelIsCurrent && duration > 0
                              ? currentTime / duration
                              : 0
                          }
                          bars={72}
                          className="mt-3 h-10 max-w-2xl"
                          playedColor={channel.colorScheme?.accent}
                          unplayedColor={channel.colorScheme?.muted}
                          onSeek={
                            channelIsCurrent && duration > 0
                              ? (fraction) => seekTo(fraction * duration)
                              : undefined
                          }
                        />
                      }
                    />
                  ) : (
                    <p className="text-sm text-white/80">
                      Stream is live — hit Play live to drive the visualizer.
                    </p>
                  )}
                  {(live || channel.hlsUrl) && (
                    <div className="absolute right-4 bottom-4 z-[2] flex items-center gap-3">
                      {chatOn && (
                        <Tooltip
                          content={
                            rightCollapsed ? 'Expand chat' : 'Collapse chat'
                          }
                          side="top"
                        >
                          <Button
                            size="icon"
                            variant="text"
                            className="size-11 bg-black/45 text-white backdrop-blur-sm hover:bg-black/65"
                            onClick={handleToggleChat}
                            aria-pressed={!rightCollapsed}
                            aria-label={
                              rightCollapsed ? 'Expand chat' : 'Collapse chat'
                            }
                          >
                            <MessageCircle size={20} aria-hidden />
                          </Button>
                        </Tooltip>
                      )}
                      <Tooltip
                        content={favorited ? 'Favorited' : 'Favorite'}
                        side="top"
                      >
                        <Button
                          size="icon"
                          variant="text"
                          className="size-11 bg-black/45 text-white backdrop-blur-sm hover:bg-black/65"
                          onClick={handleToggleFavoriteChannel}
                          aria-pressed={favorited}
                          aria-label={favorited ? 'Favorited' : 'Favorite'}
                        >
                          <HeartIcon
                            size={20}
                            className={
                              favorited
                                ? 'text-accent-red fill-current'
                                : undefined
                            }
                            aria-hidden
                          />
                        </Button>
                      </Tooltip>
                      <Tooltip
                        content={
                          channelIsLoading
                            ? 'Loading stream'
                            : channelIsPlaying
                              ? 'Pause stream'
                              : live
                                ? 'Play live'
                                : 'Play stream'
                        }
                        side="top"
                      >
                        <Button
                          size="icon"
                          className="bg-primary text-primary-foreground h-16 w-16 rounded-full shadow-lg"
                          onClick={handlePlayChannel}
                          aria-label={
                            channelIsLoading
                              ? 'Loading stream'
                              : channelIsPlaying
                                ? 'Pause stream'
                                : live
                                  ? 'Play live'
                                  : 'Play stream'
                          }
                          aria-pressed={channelIsPlaying}
                        >
                          {channelIsLoading ? (
                            <Loader />
                          ) : channelIsPlaying ? (
                            <PauseIcon
                              size={26}
                              className="fill-current"
                              aria-hidden
                            />
                          ) : (
                            <PlayIcon
                              size={26}
                              className="fill-current"
                              aria-hidden
                            />
                          )}
                        </Button>
                      </Tooltip>
                    </div>
                  )}
                </div>
              )
            }
          />
        );
      case 'textOverlay': {
        const overlay = editing
          ? textOverlayDraft
          : {
              mode: channel.textOverlayMode ?? 'NONE',
              text: channel.textOverlayText ?? '',
              align: channel.textOverlayAlign ?? 'CENTER',
            };
        return (
          <div
            className={`px-4 py-6 text-center ${editing ? '' : 'border-border rounded-xl border border-dashed'}`}
          >
            <ChannelTextOverlayView
              mode={overlay.mode}
              text={overlay.text}
              align={overlay.align}
              accent={channel.colorScheme?.accent}
              highlight={channel.colorScheme?.highlight}
            />
            {!overlay.text?.trim() && (
              <p className="text-foreground-secondary text-xs">
                {editing
                  ? 'Pick a text effect and enter a headline in the side panel.'
                  : 'Channel title overlay'}
              </p>
            )}
          </div>
        );
      }
      case 'actions':
        return editing ? (
          <div className="flex items-center gap-2 px-1 py-2">
            <Badge
              variant="pill"
              color="blue"
              className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 px-3 py-1.5"
            >
              <PlayIcon size={12} className="fill-current" /> Play
            </Badge>
            <Badge
              variant="pill"
              color="secondary"
              className="inline-flex items-center gap-1.5 px-3 py-1.5"
            >
              <HeartIcon size={12} /> Favorite
            </Badge>
            <span className="text-foreground-secondary ml-1 text-xs">
              Included in the live visualizer stage.
            </span>
          </div>
        ) : null;
      case 'archive':
        return (
          <section id="channel-block-archive" className="flex flex-col gap-6">
            {!editing && (
              <h2 className="text-xl font-bold tracking-tight">Tracks</h2>
            )}
            {pinnedPlayables.length > 0 && (
              <div className="flex flex-col gap-3">
                <Eyebrow>Pinned</Eyebrow>
                <PlayableTrackTable
                  items={pinnedPlayables}
                  emptyMessage="No pinned tracks."
                />
              </div>
            )}
            <div className="flex flex-col gap-3">
              {pinnedPlayables.length > 0 && <Eyebrow>Catalog</Eyebrow>}
              <PlayableTrackTable
                items={catalogPlayables}
                emptyMessage={
                  pinnedPlayables.length > 0
                    ? 'No other public tracks.'
                    : 'No public tracks for this channel yet.'
                }
              />
            </div>
          </section>
        );
      case 'chat':
        // Chat lives in the Nuclear right rail only — never embed a second panel.
        return (
          <section
            className={`flex max-w-xl items-center gap-3 px-4 py-3 ${editing ? '' : 'border-border rounded-lg border border-dashed'}`}
          >
            <MessageCircle
              size={18}
              className="text-foreground-secondary shrink-0 opacity-70"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold tracking-tight">Live chat</div>
              <p className="text-foreground-secondary text-xs">
                {chatOn
                  ? 'Shown in the right sidebar Chat tab — not duplicated on this page.'
                  : 'Chat is disabled for this channel.'}
              </p>
            </div>
            {chatOn ? (
              <Tooltip content="Open chat in sidebar" side="top">
                <Button
                  size="icon-sm"
                  variant="secondary"
                  onClick={openChat}
                  aria-label="Open chat in sidebar"
                >
                  <MessageCircle size={16} aria-hidden />
                </Button>
              </Tooltip>
            ) : null}
          </section>
        );
      case 'about':
        return (
          <section id="channel-block-about" className="flex flex-col gap-3">
            {channel.user.bio ? (
              <p className="text-foreground text-sm whitespace-pre-wrap">
                {channel.user.bio}
              </p>
            ) : (
              <p className="text-foreground-secondary text-sm">No bio yet.</p>
            )}
            <Link
              to="/u/$username"
              params={{ username: channel.user.username }}
              className="text-sm underline-offset-2 hover:underline"
            >
              Full artist profile →
            </Link>
          </section>
        );
      case 'links': {
        const links = editing
          ? channelLinksDraft
          : (channel.channelLinks ?? []);
        return (
          <section
            className={`px-4 py-3 ${editing ? '' : 'border-border rounded-lg border'}`}
          >
            <h2 className="text-sm font-bold tracking-tight">Links</h2>
            {links.length === 0 ? (
              <p className="text-foreground-secondary mt-1 text-xs">
                {editing
                  ? 'Add links in the side panel to show them here.'
                  : 'No links yet.'}
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {links
                  .filter((link) => link.label.trim() && link.url.trim())
                  .map((link) => (
                    <a
                      key={`${link.label}-${link.url}`}
                      href={link.url}
                      target={
                        link.url.startsWith('mailto:') ? undefined : '_blank'
                      }
                      rel="noopener noreferrer"
                      className="border-border hover:border-primary/50 hover:bg-primary/5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
                    >
                      <SocialLinkIcon label={link.label} url={link.url} />
                      {link.label}
                    </a>
                  ))}
              </div>
            )}
          </section>
        );
      }
      case 'stats':
        return (
          <section
            className={`flex items-center gap-6 px-4 py-3 ${editing ? '' : 'border-border rounded-lg border'}`}
          >
            <StatChip value={channel.followerCount ?? '—'} label="Followers" />
          </section>
        );
      case 'events': {
        if (
          !liveShows ||
          (liveShows.upcomingEpisodes.length === 0 &&
            liveShows.pastEpisodes.length === 0)
        ) {
          return editing ? (
            <div className="px-4 py-3 text-sm">
              <h2 className="text-sm font-bold tracking-tight">Live shows</h2>
              <p className="text-foreground-secondary mt-1 text-xs">
                No scheduled or past broadcasts yet — this block shows once
                there are some.
              </p>
            </div>
          ) : null;
        }
        return (
          <section
            className={`flex flex-col gap-4 px-4 py-3 ${editing ? '' : 'border-border rounded-lg border'}`}
          >
            <h2 className="text-sm font-bold tracking-tight">Live shows</h2>
            <div className="grid gap-5 lg:grid-cols-2">
              {liveShows.upcomingEpisodes.length > 0 ? (
                <ShowEpisodeList
                  title="Upcoming"
                  episodes={liveShows.upcomingEpisodes}
                  icon={<Mic size={16} aria-hidden />}
                  channelSlug={slug}
                  username={channel.user.username}
                />
              ) : null}
              {liveShows.pastEpisodes.length > 0 ? (
                <ShowEpisodeList
                  title="Past recordings"
                  episodes={liveShows.pastEpisodes}
                  icon={<MessageCircle size={16} aria-hidden />}
                  channelSlug={slug}
                />
              ) : null}
            </div>
          </section>
        );
      }
      case 'subscribe':
        return editing ? (
          <div className="px-4 py-3 text-sm">
            <h2 className="text-sm font-bold tracking-tight">
              Support {channel.user.displayName}
            </h2>
            <p className="text-foreground-secondary mt-1 text-xs">
              Fan membership pitch — links out to the subscribe page.
            </p>
            <span className="border-primary/40 text-primary mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-semibold">
              Subscribe (preview)
            </span>
          </div>
        ) : isOwner ? null : (
          <section className="border-border rounded-lg border px-4 py-3">
            <h2 className="text-sm font-bold tracking-tight">
              Support {channel.user.displayName}
            </h2>
            <p className="text-foreground-secondary mt-1 text-xs">
              Become a fan member for perks and to help keep the channel
              running.
            </p>
            <Link
              to="/subscribe/$username"
              params={{ username: channel.user.username }}
              className="mt-3 inline-block"
            >
              <Button size="sm" variant="secondary">
                Subscribe
              </Button>
            </Link>
          </section>
        );
      case 'embed': {
        const instance = listenerWidgetInstances.find(
          (candidate) => candidate.id === item.embedInstanceId,
        );
        return instance ? <ListenerWidgetEmbed instance={instance} /> : null;
      }
      default: {
        // Exhaustiveness guard: adding a type to CHANNEL_PAGE_ITEM_TYPES
        // without a matching case here used to compile fine and silently
        // render nothing — this turns that into a build error instead.
        const unhandled: never = item.type;
        void unhandled;
        return null;
      }
    }
  };

  // Chat is the right rail — never show an in-page chat block in view mode
  // (even if an older saved layout still has chat visible).
  const visibleItems = editing
    ? layout
    : layout.filter((item) => item.visible && item.type !== 'chat');

  // Exactly one <ChannelVisualizer> (one WebGL context, one RAF loop) per
  // page view, matching prod ("no point running two full WebGL scenes when
  // only one is ever visible" — apps/web's _channel-page-visualizer.tsx).
  // The hero block, when present, already renders its own full-strength
  // instance below; this page-wide ambient one is only the fallback for
  // layouts that don't include a hero block at all.
  const heroVisible = visibleItems.some((item) => item.type === 'hero');
  const channelHeaderStats: EntitySocialStat[] =
    channel.followerCount != null && channel.followerCount > 0
      ? [
          {
            key: 'followers',
            label: 'Followers',
            value: channel.followerCount,
            icon: UsersIcon,
          },
        ]
      : [];

  const pageBody = (
    <div
      className="relative isolate min-h-full overflow-hidden"
      style={{
        ...colorSchemeCssVars(pageScheme),
        backgroundColor: pageScheme.bg,
        color: pageScheme.text,
      }}
      data-channel-scheme
    >
      {!editing && backgroundVisualPreset ? (
        <ChannelVisualizer
          className="pointer-events-none absolute inset-0 z-0 size-full opacity-25"
          preset={resolvePublicVisualizerPreset(backgroundVisualPreset)}
          colorScheme={pageScheme}
          artworkUrl={channel.user.avatarUrl}
        />
      ) : null}
      {!editing &&
        !heroVisible &&
        !backgroundVisualPreset &&
        (showHeaderVideo ? (
          youtubeEmbedUrl(channel.videoBackgroundUrl, channelVideoMuted) ? (
            <iframe
              title="Channel video backdrop"
              src={
                youtubeEmbedUrl(
                  channel.videoBackgroundUrl,
                  channelVideoMuted,
                ) ?? undefined
              }
              className={`pointer-events-none absolute inset-0 z-0 h-full w-full ${
                live ? 'opacity-[0.32]' : 'opacity-[0.55]'
              }`}
              allow="autoplay; encrypted-media"
              aria-hidden="true"
            />
          ) : headerBackdropIsImage ? (
            <img
              className={`pointer-events-none absolute inset-0 z-0 h-full w-full object-cover ${
                live ? 'opacity-[0.32]' : 'opacity-[0.55]'
              }`}
              src={channel.videoBackgroundUrl ?? undefined}
              alt=""
            />
          ) : (
            <video
              className={`pointer-events-none absolute inset-0 z-0 h-full w-full object-cover ${
                live ? 'opacity-[0.32]' : 'opacity-[0.55]'
              }`}
              src={channel.videoBackgroundUrl ?? undefined}
              autoPlay
              loop
              muted={channelVideoMuted}
              playsInline
              aria-hidden="true"
            />
          )
        ) : showSolidHeader ? (
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{ backgroundColor: headerBackground }}
            aria-hidden
          />
        ) : channel.headerStyle === 'GRADIENT' ? (
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              backgroundImage: `linear-gradient(135deg, ${headerBackground}, ${headerAccent} 55%, ${headerHighlight})`,
            }}
            aria-hidden
          />
        ) : (
          <ChannelVisualizer
            className={`pointer-events-none absolute inset-0 z-0 ${
              live ? 'opacity-[0.32]' : 'opacity-[0.55]'
            }`}
            preset={resolvePublicVisualizerPreset(channel.visualPreset)}
            colorScheme={pageScheme}
            colorSchemeJson={channel.colorSchemeJson}
            visualSettingsJson={channel.visualSettingsJson}
            settings={heroVisualizerSettings}
            artworkUrl={
              channel.nowPlaying?.artworkUrl ?? channel.user.avatarUrl
            }
          />
        ))}

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {!editing ? (
            <Link
              to="/"
              className="text-foreground-secondary text-xs hover:underline"
            >
              ← Listen
            </Link>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap items-center gap-2">
            {live ? (
              <OnAirBadge />
            ) : (
              <span className="text-foreground-secondary border-border rounded border px-2 py-0.5 font-mono text-xs uppercase">
                {channel.state}
              </span>
            )}
            {isOwner && !editing && (
              <Button size="sm" variant="secondary" onClick={startEdit}>
                <span className="inline-flex items-center gap-1.5">
                  <PencilIcon size={14} />
                  Edit design
                </span>
              </Button>
            )}
            {!editing && live && (
              <Tooltip content="Download playlist" side="top">
                <Button
                  size="icon-sm"
                  variant="secondary"
                  onClick={handleDownloadPlaylist}
                  aria-label="Download playlist"
                >
                  <DownloadIcon size={16} aria-hidden />
                </Button>
              </Tooltip>
            )}
            {!editing && (
              <ChannelShareButton
                channelSlug={slug}
                displayName={channel.user.displayName}
                iconOnly={false}
              />
            )}
          </div>
        </div>

        {!heroVisible && (
          <div
            onClick={() => {
              if (editing) {
                setSelectedId('header');
              }
            }}
            className={editing ? 'cursor-pointer rounded-lg' : undefined}
          >
            <EntitySocialHeader
              title={channel.user.displayName}
              imageUrl={
                channel.user.avatarUrl ??
                placeholderArtworkUrl(channel.user.username)
              }
              roundImage
              colorScheme={channel.colorScheme}
              subtitle={
                <Link
                  to="/u/$username"
                  params={{ username: channel.user.username }}
                  className="hover:text-foreground underline-offset-2 hover:underline"
                >
                  @{channel.user.username}
                </Link>
              }
              description={
                channel.user.bio ? (
                  <p className="line-clamp-2 whitespace-pre-wrap">
                    {channel.user.bio}
                  </p>
                ) : null
              }
              backdropUrl={
                channel.videoBackgroundUrl &&
                isHeaderImageUrl(channel.videoBackgroundUrl)
                  ? channel.videoBackgroundUrl
                  : null
              }
              stats={channelHeaderStats}
              data-testid="channel-social-header"
            />
          </div>
        )}

        {visibleItems.map((item) => {
          if (!editing && !item.visible) {
            return null;
          }
          if (!editing && !heroVisible && item.type === 'stats') {
            return null;
          }
          const metaItem = CHANNEL_PAGE_ITEM_META[item.type];
          const selected = selectedId === item.id;
          return (
            <div
              key={item.id}
              draggable={editing}
              onDragStart={() => {
                if (editing) {
                  setDragId(item.id);
                }
              }}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => {
                if (editing) {
                  e.preventDefault();
                }
              }}
              onDrop={(e) => {
                if (!editing || !dragId) {
                  return;
                }
                e.preventDefault();
                updateLayout((prev) => moveItem(prev, dragId, item.id));
                setDragId(null);
              }}
              onClick={() => {
                if (editing) {
                  setSelectedId(item.id);
                }
              }}
              onPointerMove={(event) => {
                if (moveDrag?.id !== item.id) {
                  return;
                }
                updateLayout((prev) =>
                  setItemOffset(
                    prev,
                    item.id,
                    snapToGrid(
                      moveDrag.offsetX + event.clientX - moveDrag.startX,
                    ),
                    snapToGrid(
                      moveDrag.offsetY + event.clientY - moveDrag.startY,
                    ),
                  ),
                );
              }}
              onPointerUp={() => setMoveDrag(null)}
              onPointerCancel={() => setMoveDrag(null)}
              className={`group relative ${
                editing
                  ? `rounded-xl border border-dashed p-2 ${
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border/80'
                    } ${item.visible ? '' : 'opacity-40'} ${
                      dragId === item.id ? 'opacity-50' : ''
                    }`
                  : ''
              } ${
                item.width === 'compact'
                  ? 'mx-auto w-[65%] max-w-full'
                  : item.width === 'wide'
                    ? 'mx-auto w-[85%] max-w-full'
                    : 'w-full'
              }`}
              style={
                editing &&
                (item.offsetX !== undefined || item.offsetY !== undefined)
                  ? {
                      transform: `translate(${item.offsetX ?? 0}px, ${item.offsetY ?? 0}px)`,
                      zIndex: selected ? 2 : 1,
                    }
                  : undefined
              }
            >
              {editing && (
                <>
                  <div
                    className="text-foreground-secondary mb-2 flex touch-none items-center gap-2 pr-9 text-[10px] tracking-wide uppercase"
                    // Opts this handle out of the block's own `draggable`
                    // (used for stack reordering, above) — without this the
                    // browser's native drag-and-drop and this handle's
                    // pointer-capture free-offset drag both try to own the
                    // same gesture, so grabbing the handle would sometimes
                    // reorder the stack instead of (or in addition to)
                    // repositioning the block.
                    draggable={false}
                    onDragStart={(event) => event.preventDefault()}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      event.currentTarget.setPointerCapture(event.pointerId);
                      setMoveDrag({
                        id: item.id,
                        startX: event.clientX,
                        startY: event.clientY,
                        offsetX: item.offsetX ?? 0,
                        offsetY: item.offsetY ?? 0,
                      });
                    }}
                    onPointerUp={(event) => {
                      if (
                        event.currentTarget.hasPointerCapture(event.pointerId)
                      ) {
                        event.currentTarget.releasePointerCapture(
                          event.pointerId,
                        );
                      }
                      setMoveDrag(null);
                    }}
                  >
                    <GripVerticalIcon size={12} className="cursor-grab" />
                    {metaItem.label}
                    {!item.visible && <span>(hidden)</span>}
                    <span className="text-foreground-secondary/70 normal-case">
                      · drag to place
                    </span>
                  </div>
                  <Tooltip content={`Remove ${metaItem.label}`} side="top">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="text"
                      className="text-foreground-secondary hover:text-foreground absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                      aria-label={`Remove ${metaItem.label}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        removeLayoutItem(item.id);
                      }}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <XIcon size={15} aria-hidden />
                    </Button>
                  </Tooltip>
                </>
              )}
              {renderBlock(item)}
            </div>
          );
        })}
        {!editing ? <DiscoWidgetsSection widgets={discoWidgets} /> : null}
      </div>
    </div>
  );

  if (!editing) {
    if (!isOwner && !isAdministrator) {
      return pageBody;
    }

    const isLiveChannel = channel.state === 'LIVE';
    return (
      <div className="flex min-h-full flex-col gap-3">
        <Tabs.Root
          selectedIndex={channelTab === 'manage' ? 1 : 0}
          onChange={(index) =>
            setChannelTab(index === 1 ? 'manage' : 'overview')
          }
        >
          <Tabs.List>
            <Tabs.Tab>
              <TabLabel icon={<LayoutDashboardIcon size={14} />}>
                Overview
              </TabLabel>
            </Tabs.Tab>
            <Tabs.Tab>
              <TabLabel icon={<Settings2Icon size={14} />}>Manage</TabLabel>
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
        {channelTab === 'overview' ? (
          pageBody
        ) : (
          <section className="flex flex-col gap-4">
            <PageHeader
              title={isLiveChannel ? 'Command center' : 'Stream manager'}
              subtitle={
                isLiveChannel
                  ? 'Monitor and control this live channel.'
                  : 'Manage the channel replay and its rotation.'
              }
            />
            <StreamManagerPanel
              slug={channel.slug}
              channelState={channel.state}
              readOnly={!isOwner && !isAdministrator}
              defaultExpanded
            />
          </section>
        )}
      </div>
    );
  }

  const selectedType =
    selectedId === 'header'
      ? 'header'
      : layout.find((i) => i.id === selectedId)?.type;
  const lookElementId: ChannelLookElementId | null =
    selectedType === 'hero' || selectedType === 'textOverlay'
      ? 'player'
      : selectedType === 'header'
        ? 'backdrop'
        : selectedType === 'archive'
          ? 'tracks'
          : null;
  const lookOpenSection = selectedType === 'links' ? 'links' : lookElementId;

  const layersMenu = (
    <ChannelLayersMenu
      items={layout}
      selectedId={selectedId}
      lookOpenSection={lookOpenSection}
      activePresetId={activePresetId}
      onSelect={setSelectedId}
      onToggleVisible={(id) => {
        updateLayout((prev) => {
          const row = prev.find((i) => i.id === id);
          return row ? setItemVisible(prev, id, !row.visible) : prev;
        });
      }}
      onResize={(id, width) => {
        updateLayout((prev) => setItemWidth(prev, id, width));
      }}
      onRemove={removeLayoutItem}
      onAdd={(type: ChannelPageItemType) => {
        updateLayout((prev) => addItemType(prev, type));
      }}
      embedItems={configuredEmbedItems}
      onAddEmbed={(embedInstanceId) => {
        updateLayout((prev) => {
          const existing = prev.find(
            (i) => i.type === 'embed' && i.embedInstanceId === embedInstanceId,
          );
          if (existing) {
            return setItemVisible(prev, existing.id, true);
          }
          return [
            ...prev,
            {
              id: `embed-${embedInstanceId}`,
              type: 'embed',
              embedInstanceId,
              visible: true,
            },
          ];
        });
      }}
      onReorder={(fromId, toId) => {
        updateLayout((prev) => moveItem(prev, fromId, toId));
      }}
      onApplyPreset={applyPreset}
      lookSlot={
        lookOpenSection === 'links' ? (
          <ChannelLinksEditor
            links={channelLinksDraft}
            onChange={(links) => {
              setChannelLinksDraft(links);
              setLinksOrOverlayDirty(true);
            }}
          />
        ) : (
          <ChannelDesigner
            ref={channelDesignerRef}
            lookOnly
            reloadToken={lookTick}
            displayName={channel.user.displayName}
            username={channel.user.username}
            channelSlug={slug}
            avatarUrl={channel.user.avatarUrl}
            bio={channel.user.bio}
            lookOpenSection={lookElementId}
            onDirtyChange={setLookDirty}
            onSaved={() => {
              setLookTick((n) => n + 1);
              setLookExtrasTick((n) => n + 1);
            }}
          />
        )
      }
    />
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div>
          <div className="text-xs font-bold tracking-wide uppercase">
            Channel design
          </div>
          <p className="text-foreground-secondary text-xs">
            Pick a preset, then drag / hide / add. Layout saves in this browser
            for now.
            {layoutDirty || lookDirty || linksOrOverlayDirty
              ? ' · unsaved changes'
              : ' · saved locally'}
          </p>
          {presetNote && (
            <p className="text-foreground-secondary mt-1 text-xs">
              {presetNote}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="sm:hidden"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? 'Hide menu' : 'Layers menu'}
          </Button>
          <SaveButton
            disabled={!layoutDirty && !lookDirty && !linksOrOverlayDirty}
            saving={savingLook}
            label="Save changes"
            savingLabel="Saving…"
            onClick={() => void saveAll()}
          />
          <Button size="sm" onClick={exitEdit}>
            Done
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-1">
          {pageBody}
        </div>
        <div
          className={`${
            mobileMenuOpen ? 'flex' : 'hidden'
          } max-h-[40vh] shrink-0 overflow-visible lg:flex lg:max-h-none lg:self-stretch`}
        >
          {layersMenu}
        </div>
      </div>
    </div>
  );
}
