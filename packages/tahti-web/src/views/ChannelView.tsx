import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import {
  ArrowLeftIcon,
  ListMusicIcon,
  PencilIcon,
  UsersIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, SaveButton, Tooltip } from '@tahti-player/ui';

import {
  BRAND_ACCENTS,
  channelLookExtrasFromVisual,
  fillColorScheme,
  isHeaderImageUrl,
  parseColorScheme,
  patchChannelVisual,
  resolveChannelLookExtras,
  saveChannelLookExtras,
} from '../api/channel-design';
import { soundItemToPlayable } from '../api/client';
import type { ChannelSoundItem, TahtiPlayable } from '../api/types';
import {
  ChannelBlockFrame,
  ChannelHeroBlock,
  ChannelLayersPanel,
  ChannelPageBackdrop,
  ChannelStagePlayer,
  heroVisualizerSettingsFor,
  renderChannelBlock,
  useChannelData,
  useChannelLinksDraft,
  useEditRail,
} from '../components/channel-view';
import type { ChannelDesignerHandle } from '../components/ChannelDesigner';
import { ChannelShareButton } from '../components/ChannelShareButton';
import { DiscoWidgetsSection } from '../components/disco-widgets/DiscoWidgetsSection';
import {
  EntitySocialHeader,
  type EntitySocialStat,
} from '../components/EntitySocialHeader';
import { PageEmpty, PageLoading } from '../components/PageStates';
import { StreamManagerPanel } from '../components/StreamManagerPanel';
import { OnAirBadge } from '../components/tahti/OnAirBadge';
import { listenerWidgetType } from '../content/listenerWidgets';
import { useChannelLayoutEditing } from '../hooks/useChannelLayoutEditing';
import { useIsMobile } from '../hooks/useIsMobile';
import { hasAccountRole } from '../lib/accountRoles';
import {
  BACKDROP_FOLDED_ITEM_TYPES,
  getLayoutPreset,
  type ChannelLayoutPresetId,
  type ChannelPageItem,
  type ChannelPageItemType,
} from '../lib/channelPageLayout';
import { cn } from '../lib/cn';
import { colorSchemeCssVars, normalizeColorScheme } from '../lib/colorScheme';
import { isPinned } from '../lib/pinnedTracks';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { useAuthStore } from '../stores/authStore';
import { useLayoutStore } from '../stores/layoutStore';
import { useListenerWidgetsStore } from '../stores/listenerWidgetsStore';
import { usePlayerStore } from '../stores/playerStore';

export function ChannelView({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { edit?: boolean };
  const me = useAuthStore((s) => s.user);
  const {
    layout,
    setLayout,
    activePresetId,
    setActivePresetId,
    editing,
    setEditing,
    selectedId,
    setSelectedId,
    dragId,
    setDragId,
    moveDrag,
    setMoveDrag,
    layoutDirty,
    setLayoutDirty,
    updateLayout,
    removeLayoutItem,
    saveLayout,
  } = useChannelLayoutEditing(slug);
  const [activeNavTabId, setActiveNavTabId] = useState<string | null>(null);
  const [navTabContentVisible, setNavTabContentVisible] = useState(true);
  const [lookDirty, setLookDirty] = useState(false);
  const [savingLook, setSavingLook] = useState(false);
  const channelDesignerRef = useRef<ChannelDesignerHandle>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);
  const [lookTick, setLookTick] = useState(0);
  const [lookExtrasTick, setLookExtrasTick] = useState(0);
  const {
    channel,
    sounds,
    discoWidgets,
    liveShows,
    artistSocialLinks,
    loading,
  } = useChannelData(slug, lookTick);
  const linksDraft = useChannelLinksDraft(channel, artistSocialLinks);
  const channelLinksDraft = linksDraft.links;
  const linksDirty = linksDraft.dirty;
  const [presetNote, setPresetNote] = useState<string | null>(null);
  const [streamManagerOpen, setStreamManagerOpen] = useState(false);
  const listenerWidgetInstances = useListenerWidgetsStore((s) => s.instances);

  const currentId = usePlayerStore((s) => s.currentId);
  const playbackStatus = usePlayerStore((s) => s.status);
  const isMobile = useIsMobile();
  const setChatContext = useLayoutStore((s) => s.setChatContext);
  const clearChatContext = useLayoutStore((s) => s.clearChatContext);
  const openChatRail = useLayoutStore((s) => s.openChatRail);
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

  // The URL owns edit mode, so the browser's back button leaves it too.
  useEffect(() => {
    setEditing(Boolean(search.edit && isOwner));
  }, [search.edit, isOwner]);

  // Chat follows the page: on while the channel loads, then per the
  // channel's own setting. Kept out of the data fetch so toggling edit mode
  // doesn't refetch the page.
  useEffect(() => {
    if (loading || !channel) {
      setChatContext({ slug, enabled: true, autoOpen: !editing });
      return;
    }
    const enabled = channel.chatEnabled !== false;
    setChatContext({
      slug,
      enabled,
      reason: enabled ? null : 'Chat is disabled for this channel',
      autoOpen: enabled && !editing,
    });
  }, [slug, setChatContext, editing, loading, channel?.chatEnabled]);

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
  // Bio/CTA/avatar are folded into the backdrop (ChannelBackdropCard),
  // driven by the same 'about'/'subscribe'/'avatar' ChannelPageItems as
  // before -- just no longer surfaced as their own draggable blocks (see
  // BACKDROP_FOLDED_ITEM_TYPES). Fall back true/true/false to match
  // defaultChannelPageLayout's own defaults in case normalizeLayout ever
  // runs against a not-yet-normalized array.
  const avatarVisible =
    layout.find((i) => i.type === 'avatar')?.visible ?? true;
  const bioVisible = layout.find((i) => i.type === 'about')?.visible ?? true;
  const subscribeVisible =
    layout.find((i) => i.type === 'subscribe')?.visible ?? false;
  const layersMenu =
    editing && channel ? (
      <ChannelLayersPanel
        channel={channel}
        slug={slug}
        layout={layout}
        updateLayout={updateLayout}
        removeLayoutItem={removeLayoutItem}
        selectedId={selectedId}
        onSelect={setSelectedId}
        activePresetId={activePresetId}
        onApplyPreset={(id) => applyPreset(id)}
        embedItems={configuredEmbedItems}
        links={channelLinksDraft}
        onLinksChange={linksDraft.edit}
        designerRef={channelDesignerRef}
        lookTick={lookTick}
        onLookDirtyChange={setLookDirty}
        onLookSaved={() => {
          setLookTick((n) => n + 1);
          setLookExtrasTick((n) => n + 1);
        }}
      />
    ) : null;

  useEditRail(editing && !isMobile, 'Channel design', layersMenu);

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
  const heroVisualizerSettings = heroVisualizerSettingsFor(channel);
  const backgroundVisualPreset = lookExtras.backgroundVisualPreset ?? null;
  const brandGradient = BRAND_ACCENTS.find(
    (brand) => brand.id === channel.brandAccentPreset,
  )?.gradient;
  const chatOn = channel.chatEnabled !== false;
  const channelVideoMuted =
    !currentId ||
    (playbackStatus !== 'playing' && playbackStatus !== 'loading');

  const openChat = () => {
    if (!chatOn) {
      return;
    }
    openChatRail(slug);
  };

  // Combined save for the single toolbar button: the layers menu embeds
  // ChannelDesigner in `lookOnly` mode for its look controls, which used to
  // render its own separate "Save look" button right next to this one —
  // confusing to have two saves in the same panel. This one now covers both.
  const saveAll = async () => {
    if (layoutDirty) {
      saveLayout();
    }
    setSavingLook(true);
    try {
      if (lookDirty) {
        await channelDesignerRef.current?.save();
      }
      if (linksDirty) {
        const result = await patchChannelVisual({
          channelLinks: channelLinksDraft,
        });
        if (result.ok) {
          saveChannelLookExtras(slug, { channelLinks: channelLinksDraft });
          linksDraft.markSaved();
          setLookTick((n) => n + 1);
          setLookExtrasTick((n) => n + 1);
        } else {
          toast.error(result.error);
        }
      }
    } catch {
      toast.error('Could not save your changes. Try again.');
    } finally {
      setSavingLook(false);
    }
  };

  // Done saves everything, not just the layout: the look and links used to be
  // silently discarded here while the layout was kept.
  const exitEdit = async () => {
    await saveAll();
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
    })
      .then((result) => {
        if (result.ok) {
          setLookTick((n) => n + 1);
        }
      })
      .catch(() => toast.error('Could not apply the preset look. Try again.'));
  };

  // The player stays reachable even when the "Live stage" (hero) block is
  // hidden from the layout, so it is also rendered as a fixed Stage section
  // below, independent of hero's own visibility.
  const stagePlayer = (
    <ChannelStagePlayer
      channel={channel}
      slug={slug}
      live={live}
      subtle={subtle}
      chatOn={chatOn}
    />
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
            avatarVisible={avatarVisible}
            bioVisible={bioVisible}
            subscribeVisible={subscribeVisible}
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
  const baseVisibleItems = (
    editing
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
        })
  ).filter(
    // Bio/CTA/avatar are folded into the backdrop itself (rendered inside
    // ChannelHeroBlock's <ChannelBackdropCard>, see avatarVisible/
    // bioVisible/subscribeVisible below) -- never their own positioned
    // block/grid card, in either edit or view mode, unlike chat/navigation
    // above which are still config-only-in-view-mode but do get a
    // draggable position card while editing.
    (item) =>
      !BACKDROP_FOLDED_ITEM_TYPES.includes(item.type as ChannelPageItemType),
  );

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
      {!editing && (
        <ChannelPageBackdrop
          channel={channel}
          pageScheme={pageScheme}
          backgroundVisualPreset={backgroundVisualPreset}
          heroVisible={heroVisible}
          live={live}
          channelVideoMuted={channelVideoMuted}
        />
      )}

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
            return (
              <ChannelBlockFrame
                key={item.id}
                item={item}
                editing={editing}
                selected={selectedId === item.id}
                dragId={dragId}
                setDragId={setDragId}
                moveDrag={moveDrag}
                setMoveDrag={setMoveDrag}
                onSelect={setSelectedId}
                updateLayout={updateLayout}
                onRemove={removeLayoutItem}
              >
                {renderBlock(item)}
              </ChannelBlockFrame>
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
          <Button size="sm" onClick={() => void exitEdit()}>
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
