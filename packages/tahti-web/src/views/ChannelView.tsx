import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import {
  GripVerticalIcon,
  HeartIcon,
  LoaderCircleIcon,
  MessageCircle,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  WifiOffIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button, SaveButton } from '@nuclearplayer/ui';

import {
  isValidHeaderVideoUrl,
  patchChannelVisual,
  resolvePublicVisualizerPreset,
  youtubeEmbedUrl,
} from '../api/channel-design';
import {
  archiveItemToPlayable,
  fetchChannel,
  fetchChannelArchive,
} from '../api/client';
import {
  fetchChannelDiscoWidgets,
  type DiscoWidgetRenderItem,
} from '../api/disco-widgets';
import type { ArchiveItem, PublicChannel, TahtiPlayable } from '../api/types';
import { ChannelControlsWidget } from '../components/ChannelControlsWidget';
import { ChannelDesigner } from '../components/ChannelDesigner';
import { ChannelLayersMenu } from '../components/ChannelLayersMenu';
import { ChannelShareButton } from '../components/ChannelShareButton';
import { ChannelVisualizer } from '../components/ChannelVisualizer';
import { DiscoWidgetsSection } from '../components/disco-widgets/DiscoWidgetsSection';
import { PageHeader } from '../components/PageHeader';
import { PageEmpty, PageLoading } from '../components/PageStates';
import { PlayableTrackTable } from '../components/PlayableTrackTable';
import { Eyebrow } from '../components/tahti/Eyebrow';
import { OnAirBadge } from '../components/tahti/OnAirBadge';
import { WaveformSeekbar } from '../components/tahti/WaveformSeekbar';
import {
  addItemType,
  CHANNEL_PAGE_ITEM_META,
  getLayoutPreset,
  loadChannelLayoutPresetId,
  loadChannelPageLayout,
  moveItem,
  saveChannelLayoutPresetId,
  saveChannelPageLayout,
  setItemVisible,
  type ChannelLayoutPresetId,
  type ChannelPageItem,
  type ChannelPageItemType,
} from '../lib/channelPageLayout';
import { isPinned } from '../lib/pinnedTracks';
import { syncDocumentMetadata } from '../lib/seo';
import { useAuthStore } from '../stores/authStore';
import { useLayoutStore } from '../stores/layoutStore';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';

const CHANNEL_RADIO_VIZ_SETTINGS = { speed: 1.15, intensity: 1.8 };

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
  const [layoutDirty, setLayoutDirty] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);
  const [lookTick, setLookTick] = useState(0);
  const [presetNote, setPresetNote] = useState<string | null>(null);
  const [discoWidgets, setDiscoWidgets] = useState<DiscoWidgetRenderItem[]>([]);

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

  useEffect(() => clearChatContext, [clearChatContext]);

  const isOwner = Boolean(
    me && channel && me.username === channel.user.username,
  );
  const subtle = activePresetId === 'subtle';

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
    ]).then(([ch, items, widgets]) => {
      if (cancelled) {
        return;
      }
      setChannel(ch.data);
      setArchive(items.data);
      setDiscoWidgets(widgets.data);
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
  // VIDEO_LOOP header style plays this artist's clip in place of the
  // background visualizer — GRADIENT/SOLID have no distinct treatment here
  // yet (headerStyle otherwise only affects the Studio designer's own
  // preview), so this only branches for VIDEO_LOOP.
  const showHeaderVideo =
    channel.headerStyle === 'VIDEO_LOOP' &&
    isValidHeaderVideoUrl(channel.videoBackgroundUrl);
  const chatOn = channel.chatEnabled !== false;
  const channelIsCurrent =
    currentId === `live:${slug}` || currentId === `radio:${slug}`;
  const channelIsPlaying =
    channelIsCurrent &&
    (playbackStatus === 'playing' || playbackStatus === 'loading');
  const channelIsLoading = channelIsCurrent && playbackStatus === 'loading';

  const openChat = () => {
    if (!chatOn) {
      return;
    }
    openChatRail(slug);
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

  const updateLayout = (
    next: ChannelPageItem[],
    opts?: { clearPreset?: boolean },
  ) => {
    setLayout(next);
    setLayoutDirty(true);
    if (opts?.clearPreset !== false && activePresetId) {
      setActivePresetId(null);
      saveChannelLayoutPresetId(slug, null);
    }
  };

  const saveLayout = () => {
    saveChannelPageLayout(slug, layout);
    saveChannelLayoutPresetId(slug, activePresetId);
    setLayoutDirty(false);
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
      colorScheme: preset.look.colorScheme,
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
          <div
            className={`relative min-h-[26rem] w-full overflow-hidden sm:min-h-[34rem] ${
              subtle
                ? 'border-border/60 bg-background-input rounded-lg border'
                : 'border-border rounded-xl border'
            }`}
          >
            {showHeaderVideo ? (
              youtubeEmbedUrl(channel.videoBackgroundUrl) ? (
                <iframe
                  title="Channel video backdrop"
                  src={youtubeEmbedUrl(channel.videoBackgroundUrl) ?? undefined}
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  allow="autoplay; encrypted-media"
                  aria-hidden="true"
                />
              ) : (
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  src={channel.videoBackgroundUrl ?? undefined}
                  autoPlay
                  loop
                  muted
                  playsInline
                  aria-hidden="true"
                />
              )
            ) : (
              <>
                {(channel.nowPlaying?.artworkUrl ?? channel.user.avatarUrl) ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-60"
                    style={{
                      backgroundImage: `url(${channel.nowPlaying?.artworkUrl ?? channel.user.avatarUrl})`,
                    }}
                    aria-hidden
                  />
                ) : null}
                <ChannelVisualizer
                  className="absolute inset-0 h-full w-full opacity-95 [filter:saturate(1.3)]"
                  preset="REACTIVE_GRID"
                  colorScheme={channel.colorScheme}
                  colorSchemeJson={channel.colorSchemeJson}
                  settings={CHANNEL_RADIO_VIZ_SETTINGS}
                  artworkUrl={
                    channel.nowPlaying?.artworkUrl ?? channel.user.avatarUrl
                  }
                />
              </>
            )}
            {!live && !channel.nowPlaying ? (
              <div className="absolute inset-0 z-[1] flex items-center justify-center">
                <WifiOffIcon
                  size={56}
                  strokeWidth={1.5}
                  className="text-white/25"
                  aria-hidden
                />
              </div>
            ) : (
              <div
                className={`absolute inset-x-0 bottom-0 z-[1] p-4 pr-24 sm:p-6 sm:pr-40 ${
                  subtle
                    ? 'bg-gradient-to-t from-black/80 via-black/35 to-transparent'
                    : 'bg-gradient-to-t from-black/70 to-transparent'
                }`}
              >
                {channel.nowPlaying ? (
                  <>
                    <div className="flex items-end gap-3 sm:gap-4">
                      <div className="hidden size-16 shrink-0 overflow-hidden rounded-lg bg-white/10 shadow-lg ring-1 ring-white/15 sm:block sm:size-20">
                        {channel.nowPlaying.artworkUrl ? (
                          <img
                            src={channel.nowPlaying.artworkUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className={`w-fit rounded-md bg-black/45 px-2.5 py-1 tracking-wide text-white/75 uppercase backdrop-blur-sm ${
                            subtle ? 'text-[9px] font-medium' : 'text-[10px]'
                          }`}
                        >
                          Now playing
                        </div>
                        <div
                          className={`mt-2 truncate rounded-md bg-black/45 px-2.5 py-1 text-white backdrop-blur-sm ${
                            subtle
                              ? 'text-2xl font-semibold tracking-tight sm:text-4xl'
                              : 'text-3xl font-extrabold tracking-tight sm:text-5xl'
                          }`}
                        >
                          {channel.nowPlaying.title}
                        </div>
                        <div className="mt-1 w-fit max-w-full truncate rounded-md bg-black/45 px-2.5 py-1 text-lg font-medium text-white/85 backdrop-blur-sm sm:text-2xl">
                          {channel.nowPlaying.artistName}
                        </div>
                      </div>
                    </div>
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
                  </>
                ) : (
                  <p className="text-sm text-white/80">
                    Stream is live — hit Play live to drive the visualizer.
                  </p>
                )}
              </div>
            )}
            {(live || channel.hlsUrl) && (
              <div className="absolute right-4 bottom-4 z-[2] flex items-center gap-3">
                <Button
                  size="icon"
                  variant="text"
                  className="size-11 bg-black/45 text-white backdrop-blur-sm hover:bg-black/65"
                  onClick={handleToggleFavoriteChannel}
                  aria-pressed={favorited}
                  aria-label={favorited ? 'Favorited' : 'Favorite'}
                  title={favorited ? 'Favorited' : 'Favorite'}
                >
                  <HeartIcon
                    size={20}
                    className={
                      favorited ? 'text-accent-red fill-current' : undefined
                    }
                  />
                </Button>
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
                  title={channelIsPlaying ? 'Pause stream' : 'Play stream'}
                  aria-pressed={channelIsPlaying}
                >
                  {channelIsLoading ? (
                    <LoaderCircleIcon
                      size={26}
                      className="animate-spin"
                      aria-hidden
                    />
                  ) : channelIsPlaying ? (
                    <PauseIcon size={26} className="fill-current" aria-hidden />
                  ) : (
                    <PlayIcon size={26} className="fill-current" aria-hidden />
                  )}
                </Button>
              </div>
            )}
          </div>
        );
      case 'textOverlay':
        return (
          <div className="border-border rounded-xl border border-dashed px-4 py-6 text-center">
            <p className="font-display text-2xl font-extrabold tracking-tight">
              {channel.user.displayName}
            </p>
            <p className="text-foreground-secondary mt-1 text-xs">
              Channel title overlay
            </p>
          </div>
        );
      case 'actions':
        return editing ? (
          <div className="border-border text-foreground-secondary rounded-lg border border-dashed px-4 py-3 text-sm">
            Playback controls are included in the live visualizer.
          </div>
        ) : null;
      case 'archive':
        return (
          <section className="flex flex-col gap-6">
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
          <section className="border-border flex max-w-xl items-center gap-3 rounded-lg border border-dashed px-4 py-3">
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
              <Button
                size="icon-sm"
                variant="secondary"
                onClick={openChat}
                title="Open chat in sidebar"
                aria-label="Open chat in sidebar"
              >
                <MessageCircle size={16} />
              </Button>
            ) : null}
          </section>
        );
      case 'about':
        return (
          <section className="flex flex-col gap-3">
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
      case 'links':
        return (
          <section className="border-border rounded-lg border px-4 py-3">
            <h2 className="text-sm font-bold tracking-tight">Links</h2>
            <p className="text-foreground-secondary mt-1 text-xs">
              Social links render here once profile links are loaded for this
              channel.
            </p>
          </section>
        );
      default:
        return null;
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

  const pageBody = (
    <div className="relative isolate min-h-full overflow-hidden">
      {!editing &&
        !heroVisible &&
        (showHeaderVideo ? (
          youtubeEmbedUrl(channel.videoBackgroundUrl) ? (
            <iframe
              title="Channel video backdrop"
              src={youtubeEmbedUrl(channel.videoBackgroundUrl) ?? undefined}
              className={`pointer-events-none absolute inset-0 z-0 h-full w-full ${
                live ? 'opacity-[0.32]' : 'opacity-[0.55]'
              }`}
              allow="autoplay; encrypted-media"
              aria-hidden="true"
            />
          ) : (
            <video
              className={`pointer-events-none absolute inset-0 z-0 h-full w-full object-cover ${
                live ? 'opacity-[0.32]' : 'opacity-[0.55]'
              }`}
              src={channel.videoBackgroundUrl ?? undefined}
              autoPlay
              loop
              muted
              playsInline
              aria-hidden="true"
            />
          )
        ) : (
          <ChannelVisualizer
            className={`pointer-events-none absolute inset-0 z-0 ${
              live ? 'opacity-[0.32]' : 'opacity-[0.55]'
            }`}
            preset={resolvePublicVisualizerPreset(channel.visualPreset)}
            colorScheme={channel.colorScheme}
            colorSchemeJson={channel.colorSchemeJson}
            artworkUrl={
              channel.nowPlaying?.artworkUrl ?? channel.user.avatarUrl
            }
          />
        ))}

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
        <PageHeader
          title={channel.user.displayName}
          subtitle={
            <Link
              to="/u/$username"
              params={{ username: channel.user.username }}
              className="hover:text-foreground underline-offset-2 hover:underline"
            >
              @{channel.user.username}
            </Link>
          }
          back={
            !editing ? (
              <Link
                to="/"
                className="text-foreground-secondary text-xs hover:underline"
              >
                ← Listen
              </Link>
            ) : undefined
          }
          actions={
            <>
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
              {!editing && (
                <ChannelShareButton
                  channelSlug={slug}
                  displayName={channel.user.displayName}
                  iconOnly={false}
                />
              )}
            </>
          }
        />

        {visibleItems.map((item) => {
          if (!editing && !item.visible) {
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
                updateLayout(moveItem(layout, dragId, item.id));
                setDragId(null);
              }}
              onClick={() => {
                if (editing) {
                  setSelectedId(item.id);
                }
              }}
              className={`relative ${
                editing
                  ? `rounded-xl border border-dashed p-2 ${
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border/80'
                    } ${item.visible ? '' : 'opacity-40'} ${
                      dragId === item.id ? 'opacity-50' : ''
                    }`
                  : ''
              }`}
            >
              {editing && (
                <div className="text-foreground-secondary mb-2 flex items-center gap-2 text-[10px] tracking-wide uppercase">
                  <GripVerticalIcon size={12} className="cursor-grab" />
                  {metaItem.label}
                  {!item.visible && <span>(hidden)</span>}
                </div>
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
    return pageBody;
  }

  const layersMenu = (
    <ChannelLayersMenu
      items={layout}
      selectedId={selectedId}
      activePresetId={activePresetId}
      onSelect={setSelectedId}
      onToggleVisible={(id) => {
        const row = layout.find((i) => i.id === id);
        if (!row) {
          return;
        }
        updateLayout(setItemVisible(layout, id, !row.visible));
      }}
      onRemove={(id) => {
        updateLayout(layout.filter((item) => item.id !== id));
        if (selectedId === id) {
          setSelectedId(null);
        }
      }}
      onAdd={(type: ChannelPageItemType) => {
        updateLayout(addItemType(layout, type));
      }}
      onReorder={(fromId, toId) => {
        updateLayout(moveItem(layout, fromId, toId));
      }}
      onApplyPreset={applyPreset}
      lookSlot={
        <ChannelControlsWidget
          sections={[
            {
              id: 'channel-design',
              title: 'Channel appearance',
              children: (
                <ChannelDesigner
                  lookOnly
                  reloadToken={lookTick}
                  displayName={channel.user.displayName}
                  username={channel.user.username}
                  channelSlug={slug}
                  avatarUrl={channel.user.avatarUrl}
                  bio={channel.user.bio}
                  onSaved={() => setLookTick((n) => n + 1)}
                />
              ),
            },
          ]}
        />
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
            {layoutDirty ? ' · unsaved layout' : ' · layout saved locally'}
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
            disabled={!layoutDirty}
            label="Save layout"
            onClick={saveLayout}
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
          } max-h-[40vh] shrink-0 overflow-hidden lg:flex lg:max-h-none lg:self-stretch`}
        >
          {layersMenu}
        </div>
      </div>
    </div>
  );
}
