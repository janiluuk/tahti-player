import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import {
  GripVerticalIcon,
  HeartIcon,
  ListPlusIcon,
  LoaderCircleIcon,
  MessageCircle,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  WifiOffIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@nuclearplayer/ui';

import { patchChannelVisual } from '../api/channel-design';
import {
  archiveItemToPlayable,
  fetchChannel,
  fetchChannelArchive,
} from '../api/client';
import type { ArchiveItem, PublicChannel, TahtiPlayable } from '../api/types';
import { ChannelDesigner } from '../components/ChannelDesigner';
import { ChannelLayersMenu } from '../components/ChannelLayersMenu';
import { ChannelVisualizer } from '../components/ChannelVisualizer';
import { PlayableTrackTable } from '../components/PlayableTrackTable';
import { StreamManagerPanel } from '../components/StreamManagerPanel';
import { Eyebrow } from '../components/tahti/Eyebrow';
import { OnAirBadge } from '../components/tahti/OnAirBadge';
import { hasAccountRole } from '../lib/accountRoles';
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
import { useAuthStore } from '../stores/authStore';
import { useLayoutStore } from '../stores/layoutStore';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';

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

  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const currentId = usePlayerStore((s) => s.currentId);
  const playbackStatus = usePlayerStore((s) => s.status);
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
    void Promise.all([fetchChannel(slug), fetchChannelArchive(slug)]).then(
      ([ch, items]) => {
        if (cancelled) {
          return;
        }
        setChannel(ch.data);
        setArchive(items.data);
        setLoading(false);

        const enabled = ch.data?.chatEnabled !== false;
        setChatContext({
          slug,
          enabled,
          reason: enabled ? null : 'Chat is disabled for this channel',
          autoOpen: enabled && !editing,
        });
      },
    );
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
    return (
      <p className="text-foreground-secondary text-sm">Loading channel…</p>
    );
  }

  if (!channel) {
    return <p className="text-sm">Channel not found.</p>;
  }

  const live = channel.state === 'LIVE' && Boolean(channel.hlsUrl);
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

  const handleQueueChannel = () => {
    void fetchChannel(slug).then(({ playable }) => {
      if (playable) {
        enqueue(playable);
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
            <ChannelVisualizer
              className="absolute inset-0 h-full w-full"
              preset={channel.visualPreset ?? 'AURORA'}
              colorScheme={channel.colorScheme}
              colorSchemeJson={channel.colorSchemeJson}
              artworkUrl={
                channel.nowPlaying?.artworkUrl ?? channel.user.avatarUrl
              }
            />
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
                className={`absolute inset-x-0 bottom-0 z-[1] p-4 ${
                  subtle
                    ? 'bg-gradient-to-t from-black/80 via-black/35 to-transparent'
                    : 'bg-gradient-to-t from-black/70 to-transparent'
                }`}
              >
                {channel.nowPlaying ? (
                  <>
                    <div
                      className={`tracking-wide text-white/70 uppercase ${
                        subtle ? 'text-[9px] font-medium' : 'text-[10px]'
                      }`}
                    >
                      Now playing
                    </div>
                    <div
                      className={`mt-1 text-white ${
                        subtle
                          ? 'text-2xl font-semibold tracking-tight sm:text-4xl'
                          : 'text-3xl font-extrabold tracking-tight sm:text-5xl'
                      }`}
                    >
                      {channel.nowPlaying.title}
                    </div>
                    <div className="mt-1 text-lg font-medium text-white/85 sm:text-2xl">
                      {channel.nowPlaying.artistName}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-white/80">
                    Stream is live — hit Play live to drive the visualizer.
                  </p>
                )}
              </div>
            )}
            {(live || channel.hlsUrl) && (
              <div className="absolute right-3 bottom-3 z-[2] flex items-center gap-2">
                <Button
                  size="icon"
                  variant="text"
                  className="bg-black/45 text-white backdrop-blur-sm hover:bg-black/65"
                  onClick={handleToggleFavoriteChannel}
                  aria-pressed={favorited}
                  aria-label={favorited ? 'Favorited' : 'Favorite'}
                  title={favorited ? 'Favorited' : 'Favorite'}
                >
                  <HeartIcon
                    size={18}
                    className={
                      favorited ? 'text-accent-red fill-current' : undefined
                    }
                  />
                </Button>
                <Button
                  size="icon"
                  variant="text"
                  className="bg-black/45 text-white backdrop-blur-sm hover:bg-black/65"
                  onClick={handleQueueChannel}
                  aria-label="Queue"
                  title="Queue"
                >
                  <ListPlusIcon size={18} />
                </Button>
                <Button
                  size="icon"
                  className="bg-primary text-primary-foreground h-14 w-14 rounded-full shadow-lg"
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
                      size={24}
                      className="animate-spin"
                      aria-hidden
                    />
                  ) : channelIsPlaying ? (
                    <PauseIcon size={24} className="fill-current" aria-hidden />
                  ) : (
                    <PlayIcon size={24} className="fill-current" aria-hidden />
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
            <h2 className="text-xl font-bold tracking-tight">Archive</h2>
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
                    ? 'No other public archive items.'
                    : 'No public archive items for this channel yet.'
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
      case 'subscribe':
        return (
          <Link
            to="/subscribe/$username"
            params={{ username: channel.user.username }}
            className="border-border hover:border-primary/50 block rounded-lg border px-4 py-3 transition-colors"
          >
            <div className="text-sm font-bold">Subscribe</div>
            <div className="text-foreground-secondary text-xs">
              Support {channel.user.displayName} with a fan membership.
            </div>
          </Link>
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

  const pageBody = (
    <div className="relative isolate min-h-full overflow-hidden">
      {!editing && (
        <ChannelVisualizer
          className={`pointer-events-none absolute inset-0 z-0 ${
            live ? 'opacity-[0.32]' : 'opacity-[0.55]'
          }`}
          preset={channel.visualPreset ?? 'AURORA'}
          colorScheme={channel.colorScheme}
          colorSchemeJson={channel.colorSchemeJson}
          artworkUrl={channel.nowPlaying?.artworkUrl ?? channel.user.avatarUrl}
        />
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6">
        {!editing && (
          <Link
            to="/"
            className="text-foreground-secondary text-xs hover:underline"
          >
            ← Listen
          </Link>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {channel.user.displayName}
            </h1>
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
          </div>
          <p className="text-foreground-secondary text-sm">
            <Link
              to="/u/$username"
              params={{ username: channel.user.username }}
              className="hover:text-foreground underline-offset-2 hover:underline"
            >
              @{channel.user.username}
            </Link>
          </p>
        </div>

        {live && (isOwner || hasAccountRole(me, 'BOARD')) && !editing && (
          <StreamManagerPanel
            slug={slug}
            channelState={channel.state}
            onEnded={() => {
              setChannel({ ...channel, state: 'OFFLINE', hlsUrl: null });
            }}
          />
        )}

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
        updateLayout(setItemVisible(layout, id, false));
      }}
      onAdd={(type: ChannelPageItemType) => {
        updateLayout(addItemType(layout, type));
      }}
      onReorder={(fromId, toId) => {
        updateLayout(moveItem(layout, fromId, toId));
      }}
      onApplyPreset={applyPreset}
      lookSlot={
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
          <Button
            size="sm"
            variant="secondary"
            disabled={!layoutDirty}
            onClick={saveLayout}
          >
            Save layout
          </Button>
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
