import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import {
  ArrowLeftIcon,
  GripVerticalIcon,
  HeartIcon,
  ListMusicIcon,
  MessageCircle,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  UsersIcon,
  WifiOffIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  FilterChips,
  Loader,
  SaveButton,
  Tooltip,
} from '@tahti-player/ui';

import {
  BRAND_ACCENTS,
  channelLookExtrasFromVisual,
  fillColorScheme,
  isHeaderImageUrl,
  isValidHeaderBackdropUrl,
  parseColorScheme,
  patchChannelVisual,
  resolveChannelLookExtras,
  resolvePublicVisualizerPreset,
  saveChannelLookExtras,
  youtubeEmbedUrl,
  type ChannelLink,
} from '../api/channel-design';
import {
  fetchChannel,
  fetchChannelSound,
  fetchProfile,
  soundItemToPlayable,
} from '../api/client';
import {
  fetchChannelDiscoWidgets,
  type DiscoWidgetRenderItem,
} from '../api/disco-widgets';
import { fetchPublicRadioShow, type PublicRadioShow } from '../api/shows';
import type {
  ChannelSoundItem,
  PublicChannel,
  TahtiPlayable,
} from '../api/types';
import {
  ChannelHeroBlock,
  renderChannelBlock,
} from '../components/channel-view';
import {
  ChannelDesigner,
  type ChannelDesignerHandle,
} from '../components/ChannelDesigner';
import { ChannelLayersMenu } from '../components/ChannelLayersMenu';
import { ChannelLinksEditor } from '../components/ChannelLinksEditor';
import { ChannelNavigationEditor } from '../components/ChannelNavigationEditor';
import { ChannelPlaylistPicker } from '../components/ChannelPlaylistPicker';
import { ChannelShareButton } from '../components/ChannelShareButton';
import { ChannelVisualizer } from '../components/ChannelVisualizer';
import { DiscoWidgetsSection } from '../components/disco-widgets/DiscoWidgetsSection';
import {
  EntitySocialHeader,
  type EntitySocialStat,
} from '../components/EntitySocialHeader';
import { NowPlayingOverlay } from '../components/NowPlayingOverlay';
import { PageEmpty, PageLoading } from '../components/PageStates';
import { StreamManagerPanel } from '../components/StreamManagerPanel';
import { OnAirBadge } from '../components/tahti/OnAirBadge';
import { WaveformSeekbar } from '../components/tahti/WaveformSeekbar';
import { listenerWidgetType } from '../content/listenerWidgets';
import {
  parseNowPlayingOverlaySettings,
  resolveNowPlayingOverlayPreset,
} from '../content/nowPlayingOverlayPresets';
import { useIsMobile } from '../hooks/useIsMobile';
import { hasAccountRole } from '../lib/accountRoles';
import type { ChannelLookElementId } from '../lib/channelLookElements';
import {
  addItemType,
  addPlaylistItem,
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
  setNavigationTabs,
  setPlaylistDisplay,
  setPlaylistSlug,
  type ChannelLayoutPresetId,
  type ChannelPageItem,
  type ChannelPageItemType,
} from '../lib/channelPageLayout';
import { cn } from '../lib/cn';
import { colorSchemeCssVars, normalizeColorScheme } from '../lib/colorScheme';
import { isPinned } from '../lib/pinnedTracks';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { syncDocumentMetadata } from '../lib/seo';
import { useAuthStore } from '../stores/authStore';
import { useLayoutStore } from '../stores/layoutStore';
import { useLibraryStore } from '../stores/libraryStore';
import { useListenerWidgetsStore } from '../stores/listenerWidgetsStore';
import { usePlayerStore } from '../stores/playerStore';
import { useRightRailOverrideStore } from '../stores/rightRailOverrideStore';

const CHANNEL_RADIO_VIZ_SETTINGS = { speed: 1.15, intensity: 1.8, scale: 1 };

/** Draggable blocks lock to a 16px grid — keeps free-form offsets tidy
 * instead of landing on arbitrary pixel values. */
const LAYOUT_GRID_SIZE = 16;
const snapToGrid = (value: number) =>
  Math.round(value / LAYOUT_GRID_SIZE) * LAYOUT_GRID_SIZE;

export function ChannelView({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { edit?: boolean };
  const me = useAuthStore((s) => s.user);
  const [channel, setChannel] = useState<PublicChannel | null>(null);
  const [sounds, setSounds] = useState<ChannelSoundItem[]>([]);
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
  const [activeNavTabId, setActiveNavTabId] = useState<string | null>(null);
  const [navTabContentVisible, setNavTabContentVisible] = useState(true);
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
  const [linksDirty, setLinksDirty] = useState(false);
  const [channelLinksDraft, setChannelLinksDraft] = useState<ChannelLink[]>([]);
  const linksDirtyRef = useRef(false);
  linksDirtyRef.current = linksDirty;
  const [savingLook, setSavingLook] = useState(false);
  const channelDesignerRef = useRef<ChannelDesignerHandle>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);
  const [lookTick, setLookTick] = useState(0);
  const [lookExtrasTick, setLookExtrasTick] = useState(0);
  const [presetNote, setPresetNote] = useState<string | null>(null);
  const [discoWidgets, setDiscoWidgets] = useState<DiscoWidgetRenderItem[]>([]);
  const [liveShows, setLiveShows] = useState<PublicRadioShow | null>(null);
  const [streamManagerOpen, setStreamManagerOpen] = useState(false);
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
  const isMobile = useIsMobile();
  const setChatContext = useLayoutStore((s) => s.setChatContext);
  const clearChatContext = useLayoutStore((s) => s.clearChatContext);
  const openChatRail = useLayoutStore((s) => s.openChatRail);
  const rightCollapsed = useLayoutStore((s) => s.rightCollapsed);
  const toggleRight = useLayoutStore((s) => s.toggleRight);
  const setRightCollapsed = useLayoutStore((s) => s.setRightCollapsed);
  const setRightWidth = useLayoutStore((s) => s.setRightWidth);
  const rightWidth = useLayoutStore((s) => s.rightWidth);
  const setRailOverride = useRightRailOverrideStore((s) => s.setOverride);

  useEffect(() => clearChatContext, [clearChatContext]);

  const isOwner = Boolean(
    me && channel && me.username === channel.user.username,
  );
  const isAdministrator = hasAccountRole(me, 'BOARD');
  const subtle = activePresetId === 'subtle';
  const configuredEmbedItems = useMemo(
    () =>
      listenerWidgetInstances
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
        })),
    [listenerWidgetInstances, layout],
  );

  useEffect(() => {
    setLayout(loadChannelPageLayout(slug));
    setActivePresetId(loadChannelLayoutPresetId(slug));
    setLayoutDirty(false);
  }, [slug]);

  useEffect(() => {
    if (search.edit && isOwner) {
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
      fetchChannelSound(slug),
      fetchChannelDiscoWidgets(slug),
      fetchPublicRadioShow(slug),
    ]).then(([ch, items, widgets, shows]) => {
      if (cancelled) {
        return;
      }
      setChannel(ch.data);
      setSounds(items.data);
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
            // Pre-fill the Links block from the artist's social links if
            // they haven't set up any channel-specific links yet — saves
            // re-entering the same URLs. Never overwrites a saved Links
            // block, an in-progress draft, or a dirty empty edit (lookTick
            // refetches must not clobber Links while the artist types).
            if (!ch.data.channelLinks || ch.data.channelLinks.length === 0) {
              const socialEntries = Object.entries(
                profile.data.artist.socialLinks ?? {},
              ).filter(
                ([key, url]) =>
                  Boolean(url) && key !== 'genres' && key !== 'showConnections',
              );
              if (socialEntries.length > 0) {
                setChannelLinksDraft((current) => {
                  if (linksDirtyRef.current || current.length > 0) {
                    return current;
                  }
                  return socialEntries.map(([label, url]) => ({
                    label: label.charAt(0).toUpperCase() + label.slice(1),
                    url,
                  }));
                });
              }
            }
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
    setLinksDirty(false);
  }, [channel?.slug]);

  const { pinnedPlayables, catalogPlayables } = useMemo(() => {
    const pinnedItems = [...sounds]
      .filter((item) => isPinned(item))
      .sort((a, b) => (b.pinnedAt ?? '').localeCompare(a.pinnedAt ?? ''));
    const pinnedIds = new Set(pinnedItems.map((i) => i.id));
    const toPlayable = (item: ChannelSoundItem) =>
      soundItemToPlayable(item, slug);
    return {
      pinnedPlayables: pinnedItems
        .map(toPlayable)
        .filter((p): p is TahtiPlayable => Boolean(p)),
      catalogPlayables: sounds
        .filter((item) => !pinnedIds.has(item.id))
        .map(toPlayable)
        .filter((p): p is TahtiPlayable => Boolean(p)),
    };
  }, [sounds, slug]);

  const lookExtras = useMemo(() => {
    if (!channel) {
      return resolveChannelLookExtras(slug, {});
    }
    return resolveChannelLookExtras(slug, channelLookExtrasFromVisual(channel));
  }, [slug, lookExtrasTick, channel]);

  // Opt-in section tabs: off entirely (no bar, no filtering) unless a
  // `navigation` block exists with 2+ tabs -- see channelPageLayout.ts's
  // addItemType, which seeds a single "Home" tab that alone never shows
  // the bar. An item id absent from every tab always renders, so a block
  // added after tabs exist doesn't silently disappear. Computed (and its
  // effect run) above the loading/not-found early returns below so hook
  // call order never changes between renders.
  const navigationItem = layout.find((i) => i.type === 'navigation');
  const navTabs = navigationItem?.visible
    ? (navigationItem.navigationTabs ?? [])
    : [];
  const showNavTabs = navTabs.length > 1;
  const activeNavTab =
    navTabs.find((tab) => tab.id === activeNavTabId) ?? navTabs[0] ?? null;
  const navTabbedItemIds = new Set(navTabs.flatMap((tab) => tab.itemIds));

  useEffect(() => {
    setNavTabContentVisible(false);
    const frame = requestAnimationFrame(() => setNavTabContentVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [activeNavTab?.id]);

  // NOTE: this block (through the 3 hooks below) used to sit after both the
  // `if (loading)`/`if (!channel)` early returns below AND (until an earlier
  // fix in this same pass) the `if (!editing)` early return further down --
  // any hook placed after either kind of early return is conditional on it,
  // a rules-of-hooks violation, since `loading`/`channel`/`editing` all
  // change within this same mounted instance (no remount on any of them).
  // Moved above every early return so every hook is always called on every
  // render; `layersMenu` stays gated on `editing && channel` (cheap check,
  // and it's expensive JSX that's only ever read once we're past both early
  // returns anyway -- see the mobile bottom-sheet render further below).
  const selectedType =
    selectedId === 'header'
      ? 'header'
      : layout.find((i) => i.id === selectedId)?.type;
  const lookElementId: ChannelLookElementId | null =
    selectedType === 'hero'
      ? 'player'
      : selectedType === 'header'
        ? 'backdrop'
        : selectedType === 'sound'
          ? 'tracks'
          : null;
  const lookOpenSection =
    selectedType === 'links'
      ? 'links'
      : selectedType === 'playlist'
        ? 'playlist'
        : selectedType === 'navigation'
          ? 'navigation'
          : lookElementId;

  const selectedPlaylistItem =
    selectedType === 'playlist'
      ? layout.find((item) => item.id === selectedId)
      : undefined;

  const selectedNavigationItem =
    selectedType === 'navigation'
      ? layout.find((item) => item.id === selectedId)
      : undefined;

  const layersMenu =
    editing && channel ? (
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
        onRemove={(id) => removeLayoutItem(id)}
        onAdd={(type: ChannelPageItemType) => {
          updateLayout((prev) => addItemType(prev, type));
        }}
        embedItems={configuredEmbedItems}
        onAddEmbed={(embedInstanceId) => {
          updateLayout((prev) => {
            const existing = prev.find(
              (i) =>
                i.type === 'embed' && i.embedInstanceId === embedInstanceId,
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
        onAddPlaylist={(playlistSlug) => {
          updateLayout((prev) => addPlaylistItem(prev, playlistSlug));
        }}
        onReorder={(fromId, toId) => {
          updateLayout((prev) => moveItem(prev, fromId, toId));
        }}
        onApplyPreset={(id) => applyPreset(id)}
        lookSlot={
          lookOpenSection === 'links' ? (
            <ChannelLinksEditor
              links={channelLinksDraft}
              onChange={(links) => {
                setChannelLinksDraft(links);
                setLinksDirty(true);
              }}
            />
          ) : lookOpenSection === 'playlist' && selectedPlaylistItem ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <p className="text-foreground-secondary text-xs">
                  Choose which playlist this block shows.
                </p>
                <ChannelPlaylistPicker
                  usedSlugs={layout
                    .filter(
                      (item) => item.type === 'playlist' && item.playlistSlug,
                    )
                    .map((item) => item.playlistSlug as string)}
                  initialSlug={selectedPlaylistItem.playlistSlug}
                  applyOnChange
                  onPick={(playlistSlug) => {
                    updateLayout((prev) =>
                      setPlaylistSlug(
                        prev,
                        selectedPlaylistItem.id,
                        playlistSlug,
                      ),
                    );
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-foreground-secondary text-xs">
                  How tracks appear on the page.
                </p>
                <FilterChips
                  items={[
                    { id: 'tracklist', label: 'Tracklist' },
                    { id: 'cards', label: 'Cards' },
                  ]}
                  selected={selectedPlaylistItem.playlistDisplay ?? 'tracklist'}
                  onChange={(id) => {
                    if (id !== 'tracklist' && id !== 'cards') {
                      return;
                    }
                    updateLayout((prev) =>
                      setPlaylistDisplay(prev, selectedPlaylistItem.id, id),
                    );
                  }}
                  aria-label="Playlist display"
                />
              </div>
            </div>
          ) : lookOpenSection === 'navigation' && selectedNavigationItem ? (
            <ChannelNavigationEditor
              tabs={selectedNavigationItem.navigationTabs ?? []}
              candidateItems={layout
                .filter(
                  (candidate) =>
                    candidate.visible &&
                    candidate.type !== 'hero' &&
                    candidate.type !== 'chat' &&
                    candidate.type !== 'navigation',
                )
                .map((candidate) => ({
                  id: candidate.id,
                  label:
                    candidate.type === 'playlist' && candidate.playlistSlug
                      ? candidate.playlistSlug
                      : CHANNEL_PAGE_ITEM_META[candidate.type].label,
                }))}
              onChange={(tabs) => {
                updateLayout((prev) =>
                  setNavigationTabs(prev, selectedNavigationItem.id, tabs),
                );
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
    ) : null;

  useLayoutEffect(() => {
    if (!editing || isMobile) {
      setRailOverride(null);
      return;
    }
    setRailOverride({ title: 'Channel design', content: layersMenu });
    setRightCollapsed(false);
    if (rightWidth < 360) {
      setRightWidth(360);
    }
  }, [editing, isMobile, layersMenu, setRailOverride, setRightCollapsed]);

  useEffect(() => {
    if (!editing || isMobile || rightWidth >= 360) {
      return;
    }
    setRightWidth(360);
  }, [editing, isMobile, rightWidth, setRightWidth]);

  useEffect(() => () => setRailOverride(null), [setRailOverride]);

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
    if (linksDirty) {
      setSavingLook(true);
      const result = await patchChannelVisual({
        channelLinks: channelLinksDraft,
      });
      if (result.ok) {
        saveChannelLookExtras(slug, { channelLinks: channelLinksDraft });
        setLinksDirty(false);
        setLookTick((n) => n + 1);
        setLookExtrasTick((n) => n + 1);
      } else {
        toast.error(result.error);
      }
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
      search: { edit: true },
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

  // Extracted to component scope (not per-block-render): the player must
  // stay reachable even when the "Live stage" (hero) block is hidden from
  // the page layout, so it's rendered as a fixed Stage section below,
  // independent of hero's own visibility — see
  // docs/todo/channelview-move-player-to-stage.md.
  const stagePlayer =
    !live && !channel.nowPlaying ? (
      <div className="bg-background-secondary flex items-center justify-center py-12">
        <WifiOffIcon
          size={56}
          strokeWidth={1.5}
          className="text-foreground-secondary/40"
          aria-hidden
        />
      </div>
    ) : (
      <div
        className={`relative p-4 pr-24 sm:p-6 sm:pr-40 ${
          subtle
            ? 'bg-gradient-to-t from-black/80 via-black/35 to-black/10'
            : 'bg-gradient-to-t from-black/70 to-black/5'
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
                  channelIsCurrent && duration > 0 ? currentTime / duration : 0
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
                content={rightCollapsed ? 'Expand chat' : 'Collapse chat'}
                side="top"
              >
                <Button
                  size="icon"
                  variant="text"
                  className="size-11 bg-black/45 text-white backdrop-blur-sm hover:bg-black/65"
                  onClick={handleToggleChat}
                  aria-pressed={!rightCollapsed}
                  aria-label={rightCollapsed ? 'Expand chat' : 'Collapse chat'}
                >
                  <MessageCircle size={20} aria-hidden />
                </Button>
              </Tooltip>
            )}
            <Tooltip content={favorited ? 'Favorited' : 'Favorite'} side="top">
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
                    favorited ? 'text-accent-red fill-current' : undefined
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
                  <PauseIcon size={26} className="fill-current" aria-hidden />
                ) : (
                  <PlayIcon size={26} className="fill-current" aria-hidden />
                )}
              </Button>
            </Tooltip>
          </div>
        )}
      </div>
    );

  const renderBlock = (item: ChannelPageItem) => {
    switch (item.type) {
      case 'hero':
        return (
          <ChannelHeroBlock
            itemId={item.id}
            channel={channel}
            slug={slug}
            editing={editing}
            subtle={subtle}
            selectedId={selectedId}
            onSelectHeader={() => setSelectedId('header')}
            channelVideoMuted={channelVideoMuted}
            headerAccent={headerAccent}
            headerHighlight={headerHighlight}
            headerBackground={headerBackground}
            headerForeground={headerForeground}
            brandGradient={brandGradient}
            playerScheme={playerScheme}
            usePlayerGradient={lookExtras.usePlayerGradient}
            playerColorSchemeJson={lookExtras.playerColorSchemeJson}
            heroVisualizerSettings={heroVisualizerSettings}
            showNavTabs={showNavTabs}
            navTabs={navTabs}
            activeNavTab={activeNavTab}
            onSelectNavTab={setActiveNavTabId}
            layout={layout}
            updateLayout={updateLayout}
            stagePlayer={stagePlayer}
          />
        );
      default:
        // Every other block type (sound/chat/navigation/about/links/
        // programming/stats/events/subscribe/embed/playlist) is small
        // enough (2-6 free variables each) to live in its own file --
        // see ChannelViewBlocks.tsx for the exhaustiveness guard covering
        // these, and CHANNEL_PAGE_ITEM_TYPES.
        return renderChannelBlock(item, {
          editing,
          channel,
          slug,
          isOwner,
          pinnedPlayables,
          catalogPlayables,
          channelLinksDraft,
          liveShows,
          chatOn,
          onOpenChat: openChat,
          listenerWidgetInstances,
        });
    }
  };

  // Chat is the right rail, and navigation is config-only (it drives the
  // tab bar rendered inside the hero block above) — neither ever shows as
  // its own in-page block in view mode, even if an older saved layout still
  // has one marked visible. When a navigation block has 2+ tabs, an item
  // assigned to any tab only shows while its tab is active; an item never
  // assigned to any tab always shows, so adding a new block after tabs
  // exist doesn't silently disappear from every tab.
  const baseVisibleItems = editing
    ? layout
    : layout.filter((item) => {
        if (
          !item.visible ||
          item.type === 'chat' ||
          item.type === 'navigation'
        ) {
          return false;
        }
        if (showNavTabs && navTabbedItemIds.has(item.id)) {
          return activeNavTab?.itemIds.includes(item.id) ?? true;
        }
        return true;
      });

  // Radio-station pages (tahti-radio today) show programming instead of
  // artist identity -- no bio/links/subscribe CTA, regardless of what an
  // older saved layout has marked visible, and always a Programming block
  // even if the layout was never customized to include one.
  const isRadioChannel = channel.channelKind === 'RADIO';
  const visibleItems = isRadioChannel
    ? (() => {
        const withoutArtistBlocks = baseVisibleItems.filter(
          (item) =>
            item.type !== 'about' &&
            item.type !== 'links' &&
            item.type !== 'subscribe',
        );
        return withoutArtistBlocks.some((item) => item.type === 'programming')
          ? withoutArtistBlocks
          : [
              ...withoutArtistBlocks,
              {
                id: 'programming',
                type: 'programming' as const,
                visible: true,
              },
            ];
      })()
    : baseVisibleItems;

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
      className={cn(
        'relative isolate min-h-full overflow-hidden',
        // Cancel AppShell's MAIN_CONTENT_PADDING so the channel's own
        // background reaches the edges of the pane instead of leaving a
        // plain-bg-background border around it (see TrackDetailView's
        // same trick). Editing mode stays inset — it sits inline with the
        // designer toolbar/layers menu, not full-bleed.
        !editing && '-m-6 md:-m-8',
      )}
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

      <div className="relative z-10 flex w-full flex-col gap-3 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {!editing ? (
            <Tooltip content="Back to Listen" side="right">
              <Link
                to="/"
                aria-label="Back to Listen"
                className="text-foreground-secondary hover:bg-background-secondary inline-flex size-8 items-center justify-center rounded-full"
              >
                <ArrowLeftIcon size={16} aria-hidden />
              </Link>
            </Tooltip>
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
            {(isOwner || isAdministrator) && !editing && (
              <Tooltip content="Open Stream Manager" side="top">
                <Button
                  size="icon-sm"
                  variant="secondary"
                  onClick={() => setStreamManagerOpen(true)}
                  aria-label="Open Stream Manager"
                >
                  <ListMusicIcon size={16} aria-hidden />
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

        {!heroVisible && (
          <div
            className={
              subtle
                ? 'border-border/60 overflow-hidden rounded-lg border'
                : 'border-border overflow-hidden rounded-xl border'
            }
            data-testid="channel-stage-player-fixed"
          >
            {stagePlayer}
          </div>
        )}

        <div
          key={activeNavTab?.id ?? 'no-tabs'}
          className={
            !editing && showNavTabs
              ? `flex flex-col gap-3 transition-opacity duration-200 ${navTabContentVisible ? 'opacity-100' : 'opacity-0'}`
              : 'contents'
          }
        >
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
        </div>
        {!editing ? <DiscoWidgetsSection widgets={discoWidgets} /> : null}
      </div>
    </div>
  );

  if (!editing) {
    if (!isOwner && !isAdministrator) {
      return pageBody;
    }

    return (
      <>
        {pageBody}
        <Dialog.Root
          isOpen={streamManagerOpen}
          onClose={() => setStreamManagerOpen(false)}
          className="max-w-xl"
        >
          <Dialog.Title>Stream Manager</Dialog.Title>
          <div className="mt-4">
            <StreamManagerPanel
              slug={channel.slug}
              channelState={channel.state}
              readOnly={!isOwner && !isAdministrator}
            />
          </div>
        </Dialog.Root>
      </>
    );
  }

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
            {layoutDirty || lookDirty || linksDirty
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
            disabled={!layoutDirty && !lookDirty && !linksDirty}
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

      <div className="relative min-h-0 flex-1">
        <div className="h-full min-h-0 overflow-y-auto">{pageBody}</div>
        {isMobile ? (
          <div
            className={`${
              mobileMenuOpen ? 'flex' : 'hidden'
            } border-border bg-background/80 fixed inset-x-0 bottom-0 z-40 max-h-[45vh] flex-col overflow-hidden border-t backdrop-blur-md`}
          >
            {layersMenu}
          </div>
        ) : null}
      </div>
    </div>
  );
}
