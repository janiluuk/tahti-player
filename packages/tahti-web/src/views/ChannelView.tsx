import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  backButtonCornerClassName,
  BackButtonLink,
  Tooltip,
} from '@tahti-player/ui';

import {
  BRAND_ACCENTS,
  channelLookExtrasFromVisual,
  parseColorScheme,
  resolveChannelLookExtras,
} from '../api/channel-design';
import { AutoplayUnmuteNotice } from '../components/AutoplayUnmuteNotice';
import {
  ChannelBlockFrame,
  ChannelEditToolbar,
  ChannelExtrasSections,
  ChannelHeroBlock,
  ChannelLayersPanel,
  ChannelListeningPartyBanner,
  ChannelLiveTracklist,
  ChannelPageBackdrop,
  ChannelRefreshBanner,
  ChannelStagePlayer,
  ChannelUnavailable,
  heroVisualizerSettingsFor,
  renderChannelBlock,
  useChannelData,
  useChannelLinksDraft,
  useEditRail,
  usePresetLookDraft,
} from '../components/channel-view';
import { ChannelFallbackHeader } from '../components/channel-view/ChannelFallbackHeader';
import { ChannelFeatureSettings } from '../components/channel-view/ChannelFeatureSettings';
import { channelHeaderStats } from '../components/channel-view/channelHeaderStats';
import { ChannelPageActions } from '../components/channel-view/ChannelPageActions';
import {
  ChannelPageSections,
  type ChannelPageTab,
} from '../components/channel-view/ChannelPageTabs';
import { CHANNEL_SCHEME_TEXT_CLASS } from '../components/channel-view/channelSchemeText';
import { ChannelStoreSection } from '../components/channel-view/ChannelStoreSection';
import { channelTrackMeta } from '../components/channel-view/channelTrackMeta';
import { ChannelEmbedsSection } from '../components/channel-view/ChannelViewBlocks';
import { channelVisibleItems } from '../components/channel-view/channelVisibleItems';
import { StreamManagerDialog } from '../components/channel-view/StreamManagerDialog';
import { unplacedEmbedItems } from '../components/channel-view/unplacedEmbedItems';
import { useChannelLookSave } from '../components/channel-view/useChannelLookSave';
import { useChannelPlayables } from '../components/channel-view/useChannelPlayables';
import { RadioStationDial } from '../components/radio/RadioStationDial';
import { useChannelAutoplay } from '../hooks/useChannelAutoplay';
import { useChannelLayoutEditing } from '../hooks/useChannelLayoutEditing';
import { useHasFanTiers } from '../hooks/useHasFanTiers';
import { useIsMobile } from '../hooks/useIsMobile';
import { useServerChannelLayout } from '../hooks/useServerChannelLayout';
import { hasAccountRole } from '../lib/accountRoles';
import {
  getLayoutPreset,
  type ChannelLayoutPresetId,
  type ChannelPageItem,
} from '../lib/channelPageLayout';
import { cn } from '../lib/cn';
import { colorSchemeCssVars, normalizeColorScheme } from '../lib/colorScheme';
import { splitEmbedPlayables } from '../lib/splitEmbedPlayables';
import { useArtistFollow } from '../lib/useArtistFollow';
import { useAuthStore } from '../stores/authStore';
import { useListenerWidgetsStore } from '../stores/listenerWidgetsStore';
import { usePlayerStore } from '../stores/playerStore';

export function ChannelView({ slug }: { slug: string }) {
  const { t } = useTranslation('web');
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
    revertLayout,
  } = useChannelLayoutEditing(slug);
  const [activeNavTabId, setActiveNavTabId] = useState<string | null>(null);
  const [pageTab, setPageTab] = useState<ChannelPageTab>('music');
  const [navTabContentVisible, setNavTabContentVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);
  const [lookTick, setLookTick] = useState(0);
  const [lookExtrasTick, setLookExtrasTick] = useState(0);
  const {
    channel,
    sounds,
    discoWidgets,
    channelBlocks,
    liveShows,
    artistSocialLinks,
    storefront,
    loading,
    channelFailed,
    refreshError,
    retryChannel,
    sectionStatus,
    retrySection,
  } = useChannelData(slug, lookTick);
  useChannelAutoplay(channel, !editing);
  const linksDraft = useChannelLinksDraft(channel, artistSocialLinks);
  const channelLinksDraft = linksDraft.links;
  const presetDraft = usePresetLookDraft();
  const bumpLookExtras = () => {
    setLookTick((n) => n + 1);
    setLookExtrasTick((n) => n + 1);
  };
  const lookSave = useChannelLookSave({
    slug,
    layoutDirty,
    saveLayout,
    revertLayout,
    linksDraft,
    presetDraft,
    onLookSaved: () => setLookTick((n) => n + 1),
    onLinksSaved: bumpLookExtras,
  });
  const [streamManagerOpen, setStreamManagerOpen] = useState(false);
  const listenerWidgetInstances = useListenerWidgetsStore((s) => s.instances);

  const currentId = usePlayerStore((s) => s.currentId);
  const playbackStatus = usePlayerStore((s) => s.status);
  const isMobile = useIsMobile();

  const isOwner = Boolean(
    me && channel && me.username === channel.user.username,
  );
  const isAdministrator = hasAccountRole(me, 'BOARD');

  useServerChannelLayout({
    slug,
    channel,
    isOwner,
    editing,
    layoutDirty,
    setLayout,
  });
  const follow = useArtistFollow(
    channel
      ? {
          slug,
          username: channel.user.username,
          displayName: channel.user.displayName,
          avatarUrl: channel.user.avatarUrl,
        }
      : null,
    Boolean(me && !isOwner),
  );
  const hasFanTiers = useHasFanTiers(channel?.user.username ?? null);
  const subtle = activePresetId === 'subtle';
  const configuredEmbedItems = useMemo(
    () =>
      unplacedEmbedItems(
        listenerWidgetInstances,
        layout,
        t('channelViewLeftovers.externalPlayer'),
      ),
    [listenerWidgetInstances, layout],
  );
  useEffect(() => {
    setEditing(Boolean(search.edit && isOwner));
  }, [search.edit, isOwner]);

  const { pinnedPlayables, catalogPlayables, channelTrackIds } =
    useChannelPlayables(sounds, slug);

  const getTrackMeta = useMemo(() => channelTrackMeta(sounds), [sounds]);
  const channelPlayables = useMemo(
    () => [...pinnedPlayables, ...catalogPlayables],
    [pinnedPlayables, catalogPlayables],
  );
  const embedPlayables = useMemo(
    () => splitEmbedPlayables(channelPlayables).embeds,
    [channelPlayables],
  );

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

  const avatarVisible =
    layout.find((i) => i.type === 'avatar')?.visible ?? true;
  const bioVisible = layout.find((i) => i.type === 'about')?.visible ?? true;
  const linksVisible = layout.find((i) => i.type === 'links')?.visible ?? false;
  const subscribeOn =
    layout.find((i) => i.type === 'subscribe')?.visible ?? false;
  const subscribeVisible =
    channel?.channelKind !== 'RADIO' &&
    !isOwner &&
    hasFanTiers === true &&
    subscribeOn;
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
        designerRef={lookSave.designerRef}
        presetLook={presetDraft.pending}
        lookTick={lookTick}
        onLookDirtyChange={lookSave.setLookDirty}
        onLookBusyChange={lookSave.setLookBusy}
        onLookSaved={bumpLookExtras}
      />
    ) : null;

  useEditRail(editing && !isMobile, 'Channel design', layersMenu);

  if (loading || !channel) {
    return (
      <ChannelUnavailable
        slug={slug}
        loading={loading}
        failed={channelFailed}
        onRetry={retryChannel}
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
    if (chatOn) {
      setPageTab('chat');
    }
  };

  // Done saves everything, not just the layout: the look and links used to be
  // silently discarded here while the layout was kept.
  const exitEdit = async () => {
    await lookSave.saveAll();
    setEditing(false);
    setSelectedId(null);
    presetDraft.setNote(null);
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
    presetDraft.stage(preset.name, preset.look);
    lookSave.setLookDirty(true);
  };

  const isRadioChannel = channel.channelKind === 'RADIO';
  // The player stays reachable even when the "Live stage" (hero) block is
  // hidden from the layout, so it is also rendered as a fixed Stage section
  // below, independent of hero's own visibility.
  const stage = (
    <ChannelStagePlayer
      channel={channel}
      slug={slug}
      live={live}
      subtle={subtle}
      chatOn={chatOn}
      follow={isOwner ? null : follow}
      signedIn={Boolean(me)}
      trackIds={channelTrackIds}
      playables={channelPlayables}
      onOpenChat={openChat}
    />
  );
  const stagePlayer = (
    <>
      <AutoplayUnmuteNotice />
      {isRadioChannel && !editing ? (
        <RadioStationDial
          current={{ kind: 'channel', slug, name: channel.user.displayName }}
          label={channel.user.displayName}
        >
          {stage}
        </RadioStationDial>
      ) : (
        stage
      )}
      {live ? <ChannelLiveTracklist slug={slug} /> : null}
    </>
  );

  const featureSettings = editing ? (
    <ChannelFeatureSettings
      layout={layout}
      updateLayout={updateLayout}
      isRadioChannel={channel.channelKind === 'RADIO'}
    />
  ) : null;

  const pageActions = !editing ? (
    <ChannelPageActions
      channel={channel}
      slug={slug}
      isOwner={isOwner}
      isAdministrator={isAdministrator}
      follow={!isOwner && me && !live && !channel.nowPlaying ? follow : null}
      onEditDesign={isOwner ? startEdit : undefined}
      onOpenStreamManager={
        isOwner || isAdministrator
          ? () => setStreamManagerOpen(true)
          : undefined
      }
    />
  ) : null;

  const renderBlock = (item: ChannelPageItem) => {
    switch (item.type) {
      case 'hero':
        return (
          <ChannelHeroBlock
            itemId={item.id}
            leading={editing ? undefined : backButton}
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
            avatarVisible={avatarVisible}
            bioVisible={bioVisible}
            links={channelLinksDraft}
            linksVisible={linksVisible}
            subscribeVisible={editing ? subscribeOn : subscribeVisible}
            showOffFeatures={editing}
            stagePlayer={stagePlayer}
            identityActions={editing ? featureSettings : pageActions}
          />
        );
      default:
        // Every other block type (sound/navigation/about/links/
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
          getTrackMeta,
          channelLinksDraft,
          liveShows,
          sectionStatus,
          onRetrySection: retrySection,
          listenerWidgetInstances,
        });
    }
  };

  const visibleItems = channelVisibleItems({
    layout,
    editing,
    showNavTabs,
    navTabbedItemIds,
    activeNavTabItemIds: activeNavTab?.itemIds,
    isRadioChannel,
  });

  // Exactly one <ChannelVisualizer> (one WebGL context, one RAF loop) per
  // page view, matching prod ("no point running two full WebGL scenes when
  // only one is ever visible" — apps/web's _channel-page-visualizer.tsx).
  // The hero block, when present, already renders its own full-strength
  // instance below; this page-wide ambient one is only the fallback for
  // layouts that don't include a hero block at all.
  const heroVisible = visibleItems.some((item) => item.type === 'hero');

  const renderFrame = (item: ChannelPageItem) => {
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
  };
  const showHeaderStats =
    layout.find((item) => item.type === 'headerStats')?.visible ?? true;
  const headerStats =
    showHeaderStats || editing
      ? channelHeaderStats(channel, follow.followerCount)
      : [];

  const headerShown = !heroVisible && channel.user.showPageHero !== false;
  const backButton = (
    <Tooltip content={t('channelViewText.backToListen')} side="right">
      <BackButtonLink to="/" aria-label={t('channelViewText.backToListen')} />
    </Tooltip>
  );
  const pageBody = (
    <div
      className={cn(
        'relative isolate min-h-full overflow-hidden',
        CHANNEL_SCHEME_TEXT_CLASS,
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

      <div className="relative z-10 flex w-full flex-col gap-1.5 px-4 py-3 sm:px-6 sm:py-4">
        {!editing && !heroVisible && !headerShown ? (
          <div className={backButtonCornerClassName}>{backButton}</div>
        ) : null}
        <ChannelRefreshBanner error={refreshError} onRetry={retryChannel} />
        {!heroVisible ? (
          <ChannelFallbackHeader
            channel={channel}
            editing={editing}
            subtle={subtle}
            actions={pageActions ?? featureSettings}
            backButton={backButton}
            stats={headerStats}
            statsDimmed={editing && !showHeaderStats}
            onSelectHeader={() => setSelectedId('header')}
            stagePlayer={stagePlayer}
          />
        ) : null}

        {/* The hero carries the stage player, so it stays above the tabs. */}
        {visibleItems.filter((i) => i.type === 'hero').map(renderFrame)}

        {!editing ? <ChannelListeningPartyBanner slug={slug} /> : null}

        <ChannelPageSections
          tab={pageTab}
          onTabChange={setPageTab}
          editing={editing}
          chatOn={chatOn}
          slug={slug}
          isOwner={isOwner}
          embeds={
            sectionStatus.sounds === 'ready' && embedPlayables.length > 0 ? (
              <ChannelEmbedsSection
                embeds={embedPlayables}
                pinnedPlayables={pinnedPlayables}
                getTrackMeta={getTrackMeta}
              />
            ) : null
          }
          music={
            <>
              <div
                key={activeNavTab?.id ?? 'no-tabs'}
                className={cn(
                  editing
                    ? 'flex flex-col gap-2'
                    : 'grid grid-cols-1 gap-4 lg:grid-cols-2',
                  !editing &&
                    showNavTabs &&
                    `transition-opacity duration-200 ${navTabContentVisible ? 'opacity-100' : 'opacity-0'}`,
                )}
                data-testid="channel-blocks"
              >
                {visibleItems.filter((i) => i.type !== 'hero').map(renderFrame)}
              </div>
              <ChannelStoreSection
                storefront={storefront}
                username={channel.user.username}
                isOwner={isOwner}
                hidden={editing || isRadioChannel}
              />
              {!editing ? (
                <ChannelExtrasSections
                  slug={slug}
                  blocks={channelBlocks}
                  widgets={discoWidgets}
                  widgetsStatus={sectionStatus.widgets}
                  onRetryWidgets={() => retrySection('widgets')}
                />
              ) : null}
            </>
          }
        />
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
        <StreamManagerDialog
          isOpen={streamManagerOpen}
          onClose={() => setStreamManagerOpen(false)}
          slug={channel.slug}
          channelState={channel.state}
          readOnly={!isOwner && !isAdministrator}
        />
      </>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <ChannelEditToolbar
        dirty={lookSave.dirty}
        note={presetDraft.note}
        saving={lookSave.saving}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((v) => !v)}
        onRevert={lookSave.revertAll}
        onSave={() => void lookSave.saveAll()}
        onDone={() => void exitEdit()}
      />

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
