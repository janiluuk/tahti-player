import { Link } from '@tanstack/react-router';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { SaveButton } from '@tahti-player/ui';

import {
  fillColorScheme,
  isHeaderImageUrl,
  isValidHeaderBackdropUrl,
  isVisualPreset,
  shouldDockVisualizerTuning,
  VISUAL_PRESETS,
  type VisualPreset,
} from '../api/channel-design';
import {
  isChannelLookElementId,
  type ArtistLookBlockId,
  type ChannelLookElementId,
} from '../lib/channelLookElements';
import {
  type ChannelLookBundle,
  type ChannelPageItem,
} from '../lib/channelPageLayout';
import {
  AppliedPresetBanner,
  BackdropPanel,
  DeletePresetDialog,
  DesignerToolbar,
  IdentityToggles,
  LAYOUT_ONLY_LOOK_IDS,
  LayoutOnlyLookHint,
  OverlayConfigDialog,
  PlayerOverlayControls,
  PlayerPanel,
  PlayerVisualizerControls,
  ResetConfirmDialog,
  resolveHeaderDesignMode,
  SavedLooksRow,
  SavePresetDialog,
  TopBarTextField,
  TuningSliders,
  VideoOrImageField,
  VisualizerPickerDialog,
  type HeaderDesignMode,
  type PlayerDesignTab,
} from './channel-designer';
import { ChannelPagePreview } from './channel-designer/ChannelPagePreview';
import { SlideshowControls } from './channel-designer/SlideshowControls';
import { useChannelLook } from './channel-designer/useChannelLook';
import { useDockedControlsRail } from './channel-designer/useDockedControlsRail';
import { useLookVisibility } from './channel-designer/useLookVisibility';
import { ChannelElementEditor } from './ChannelElementEditor';
import { ChannelTextOverlayEditor } from './ChannelTextOverlayEditor';
import { PageLoading } from './PageStates';

type TabId = 'visualizer' | 'color-scheme' | 'header';
type LookSection =
  | ChannelLookElementId
  | 'player-design'
  | 'visual-style'
  | 'links'
  | 'text-overlay';

type Props = {
  displayName: string;
  username: string;
  channelSlug?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  /** Compact for profile tab; full for Studio. */
  compact?: boolean;
  /** Side-panel look controls only (no hero preview chrome). */
  lookOnly?: boolean;
  /** Mount a real, animating Three.js preview in the preview chrome (the
   * one place tuning docks). Default true. Set false wherever this
   * designer can render *underneath* a page that may already have its own
   * live ChannelVisualizer running — e.g. the global Settings modal, which
   * can stay open over the owner's own live channel page — so we never end
   * up with two live WebGL contexts at once (see 7a8060d7). */
  livePreview?: boolean;
  onSaved?: () => void;
  /** Remount / reload trigger when an external preset applies a look. */
  reloadToken?: number;
  /** A layout preset's look to apply to the draft (not saved until the
   * owner saves); a new `token` applies it again. */
  presetLook?: { token: number; look: ChannelLookBundle } | null;
  lookOpenSection?: LookSection | null;
  onDirtyChange?: (dirty: boolean) => void;
  onLookVisibilityChange?: (
    visibility: Record<ArtistLookBlockId, boolean>,
  ) => void;
  /** The channel page's own layout array + updater — only ever passed by
   * `ChannelView`'s editing mode, which owns the real `ChannelPageItem[]`.
   * Backs the Backdrop panel's avatar/bio/subscribe toggles (see
   * BACKDROP_FOLDED_ITEM_TYPES); those toggles simply don't render for
   * any other caller of this component (ArtistView, StudioBrandingView,
   * ChannelSetupDialog), which have no page layout to toggle. */
  layout?: ChannelPageItem[];
  onLayoutChange?: (
    updater:
      ChannelPageItem[] | ((prev: ChannelPageItem[]) => ChannelPageItem[]),
  ) => void;
};

export type ChannelDesignerHandle = {
  save: () => Promise<void>;
};

export const ChannelDesigner = forwardRef<ChannelDesignerHandle, Props>(
  function ChannelDesigner(
    {
      displayName,
      username,
      channelSlug,
      avatarUrl,
      bio,
      compact,
      lookOnly,
      livePreview = true,
      onSaved,
      reloadToken = 0,
      presetLook,
      lookOpenSection,
      onDirtyChange,
      onLookVisibilityChange,
      layout,
      onLayoutChange,
    }: Props,
    ref,
  ) {
    const { dockControlsInRail, controlsForRailRef } =
      useDockedControlsRail(lookOnly);

    const layoutSlug = channelSlug ?? username;
    const {
      appliedPresetName,
      applyLocal,
      applyPreset,
      editBackgroundScheme,
      editGalleryMode,
      editPlayerScheme,
      editSlideshow,
      editVideoUrl,
      backgroundScheme,
      busy,
      clearVideo,
      confirmDeletePreset,
      confirmReset,
      confirmSavePreset,
      deletePresetTarget,
      dirty,
      galleryFiles,
      galleryImageList,
      galleryMode,
      galleryPreviewIndex,
      keepAppliedPreset,
      openSavePresetModal,
      overlaySettings,
      pendingVideoFile,
      pendingVideoPreviewUrl,
      playerScheme,
      presetBusy,
      presetNameInput,
      presets,
      previewPreset,
      previewStyle,
      previousSave,
      removeBackdrop,
      removeGalleryImage,
      reorderGalleryImage,
      resetConfirmOpen,
      restorePreviousSave,
      revertAppliedPreset,
      save,
      savePresetOpen,
      scheme,
      selectGalleryFiles,
      selectVideoFile,
      setDeletePresetTarget,
      setGalleryPreviewIndex,
      setOverlaySetting,
      setPresetNameInput,
      setPresetSetting,
      setResetConfirmOpen,
      setSavePresetOpen,
      slideshowAutoplay,
      slideshowInterval,
      slideshowPreset,
      slideshowTransition,
      videoBackgroundUrl,
      visual,
      visualSettings,
      visualSettingsJson,
    } = useChannelLook({ layoutSlug, reloadToken, onSaved, onDirtyChange });
    useImperativeHandle(ref, () => ({ save }), [save]);

    // Applied once the saved look has loaded, so the load cannot overwrite
    // it; a remount (the panel switched section and back) applies it again
    // on top of the reloaded look, since it is still unsaved.
    const appliedPresetTokenRef = useRef<number | null>(null);
    const lookLoaded = visual !== null;
    useEffect(() => {
      if (
        !presetLook ||
        !lookLoaded ||
        appliedPresetTokenRef.current === presetLook.token
      ) {
        return;
      }
      appliedPresetTokenRef.current = presetLook.token;
      const { look } = presetLook;
      applyLocal(
        {
          visualPreset: look.visualPreset,
          headerStyle: look.headerStyle,
          brandAccentPreset: look.brandAccentPreset,
        },
        fillColorScheme(look.colorScheme),
      );
    }, [presetLook, lookLoaded]);

    const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);
    const [videoUrlOpen, setVideoUrlOpen] = useState(false);
    const [showVisualizerSettings, setShowVisualizerSettings] = useState(false);
    const [overlayConfigOpen, setOverlayConfigOpen] = useState(false);
    const [visualizerPickerOpen, setVisualizerPickerOpen] = useState(false);
    const [visualizerPickerPreset, setVisualizerPickerPreset] =
      useState<Exclude<VisualPreset, 'MINIMAL'>>('AURORA');
    const [activeTab, setActiveTab] = useState<TabId>('visualizer');
    const [playerDesignTab, setPlayerDesignTab] =
      useState<PlayerDesignTab>('gradient');
    const [highlightSection, setHighlightSection] = useState<
      'header' | 'visualizer' | null
    >(null);
    const [selectedLookId, setSelectedLookId] =
      useState<ChannelLookElementId>('backdrop');
    const { lookBlockVisible, toggleSelectedLook } = useLookVisibility({
      layoutSlug,
      reloadToken,
      layout,
      onLayoutChange,
      onLookVisibilityChange,
    });

    useEffect(() => {
      if (!lookOpenSection) {
        return;
      }
      if (
        lookOpenSection === 'player-design' ||
        lookOpenSection === 'text-overlay'
      ) {
        setSelectedLookId('player');
      } else if (
        lookOpenSection === 'visual-style' ||
        lookOpenSection === 'links'
      ) {
        setSelectedLookId('backdrop');
      } else if (isChannelLookElementId(lookOpenSection)) {
        setSelectedLookId(lookOpenSection);
      }
    }, [lookOpenSection]);

    // One timer for the transient highlight, so an earlier click's timeout
    // cannot clear a newer highlight, and none fires after unmount.
    const highlightTimerRef = useRef<number | undefined>(undefined);
    useEffect(() => () => window.clearTimeout(highlightTimerRef.current), []);
    const flashHighlight = (section: 'header' | 'visualizer' | null) => {
      window.clearTimeout(highlightTimerRef.current);
      setHighlightSection(section);
      if (section) {
        highlightTimerRef.current = window.setTimeout(
          () => setHighlightSection(null),
          1600,
        );
      }
    };

    const focusPreviewSection = (
      tab: 'header' | 'visualizer',
      elementId: string,
    ) => {
      setActiveTab(tab);
      flashHighlight(tab);
      document
        .getElementById(elementId)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    if (!visual) {
      return <PageLoading label="Loading designer…" />;
    }

    // VIDEO_LOOP without a playable clip or image isn't a state worth saving —
    // the header would just render empty on the real channel page.
    const videoLoopNeedsUrl =
      visual.headerStyle === 'VIDEO_LOOP' &&
      !pendingVideoFile &&
      !isValidHeaderBackdropUrl(videoBackgroundUrl);
    const showHeaderVideo =
      visual.headerStyle === 'VIDEO_LOOP' &&
      (pendingVideoFile !== null ||
        isValidHeaderBackdropUrl(videoBackgroundUrl));
    const previewVideoUrl = pendingVideoPreviewUrl ?? videoBackgroundUrl;
    const headerBackdropIsImage = pendingVideoFile
      ? pendingVideoFile.type.startsWith('image/')
      : isHeaderImageUrl(previewVideoUrl);

    const availableVisualizers = VISUAL_PRESETS.filter(
      (preset) => preset !== 'MINIMAL',
    );
    const activeVisualizer: Exclude<VisualPreset, 'MINIMAL'> =
      isVisualPreset(previewPreset) && previewPreset !== 'MINIMAL'
        ? previewPreset
        : 'AURORA';
    const visualizerEnabled = visual.visualPreset !== 'MINIMAL';
    const slideshowHeaderSelected = galleryMode !== 'NONE';
    const hasBackdrop =
      pendingVideoFile !== null ||
      videoBackgroundUrl.trim().length > 0 ||
      galleryImageList.length > 0;

    const changeVisualizer = (direction: -1 | 1) => {
      const activeIndex = availableVisualizers.indexOf(activeVisualizer);
      const nextIndex =
        (activeIndex + direction + availableVisualizers.length) %
        availableVisualizers.length;
      const nextPreset = availableVisualizers[nextIndex];
      if (!nextPreset) {
        return;
      }
      applyLocal({ visualPreset: nextPreset });
    };

    // Only the full (non-lookOnly) chrome, with a live preview allowed, ever
    // gets a real preview to dock tuning into.
    const hasLivePreview = !lookOnly && livePreview;

    const dockTuning =
      shouldDockVisualizerTuning({
        preset: previewPreset,
        visualizerEnabled,
        activeTab,
      }) &&
      showVisualizerSettings &&
      !visualizerPickerOpen;

    const headerDesignMode: HeaderDesignMode = resolveHeaderDesignMode(
      visual.headerStyle,
      slideshowHeaderSelected,
    );

    const setHeaderDesignMode = (mode: HeaderDesignMode) => {
      if (mode === 'SLIDESHOW') {
        editGalleryMode((modeValue) =>
          modeValue === 'NONE' ? 'STATIC_SLIDESHOW' : modeValue,
        );
        applyLocal({ headerStyle: 'GRADIENT' });
        return;
      }
      editGalleryMode('NONE');
      applyLocal({ headerStyle: mode });
    };

    const slideshowControls = (
      <SlideshowControls
        images={galleryImageList}
        previewIndex={galleryPreviewIndex}
        onPreviewIndexChange={setGalleryPreviewIndex}
        busy={busy}
        onReorder={reorderGalleryImage}
        onRemove={removeGalleryImage}
        pickerOpen={galleryPickerOpen}
        onPickerOpenChange={setGalleryPickerOpen}
        pickedFiles={galleryFiles}
        onFilesPicked={selectGalleryFiles}
        galleryMode={galleryMode}
        onGalleryModeChange={editGalleryMode}
        preset={slideshowPreset}
        onPresetChange={(preset) => editSlideshow({ preset })}
        interval={slideshowInterval}
        onIntervalChange={(interval) => editSlideshow({ interval })}
        transition={slideshowTransition}
        onTransitionChange={(transition) => editSlideshow({ transition })}
        autoplay={slideshowAutoplay}
        onAutoplayChange={(autoplay) => editSlideshow({ autoplay })}
      />
    );

    const videoBackdropSlot = (
      <VideoOrImageField
        variant="backdrop"
        disabled={busy}
        pendingFile={pendingVideoFile}
        url={videoBackgroundUrl}
        urlOpen={videoUrlOpen}
        onUrlOpenChange={setVideoUrlOpen}
        onUrlChange={editVideoUrl}
        onFiles={selectVideoFile}
        previewUrl={pendingVideoPreviewUrl}
        isImage={headerBackdropIsImage}
        onRemove={clearVideo}
      />
    );

    // Bio/CTA/avatar folded into the backdrop instead of being separate
    // draggable page blocks (see BACKDROP_FOLDED_ITEM_TYPES in
    // channelPageLayout.ts) -- only rendered when this ChannelDesigner
    // instance is nested inside ChannelView's editing mode, which is the
    // only caller that owns a real page `layout` to toggle.
    const identityTogglesSlot =
      layout && onLayoutChange ? (
        <IdentityToggles layout={layout} onLayoutChange={onLayoutChange} />
      ) : null;

    const backdropPanel = (
      <>
        {identityTogglesSlot}
        <TopBarTextField
          value={visual.topBarText ?? ''}
          onChange={(topBarText) => applyLocal({ topBarText })}
        />
        <BackdropPanel
          scheme={scheme}
          backgroundScheme={backgroundScheme}
          useBackgroundGradient={visual.useBackgroundGradient ?? false}
          brandAccentPreset={visual.brandAccentPreset}
          headerMode={headerDesignMode}
          hasBackdrop={hasBackdrop}
          backgroundVisualPreset={visual.backgroundVisualPreset}
          onPageBackgroundChange={(bg) => {
            if (visual.useBackgroundGradient) {
              editBackgroundScheme({ ...backgroundScheme, bg });
              return;
            }
            applyLocal({ brandAccentPreset: null }, { ...scheme, bg });
          }}
          onHeaderModeChange={setHeaderDesignMode}
          onRemoveBackdrop={removeBackdrop}
          onSchemeChange={(next) =>
            applyLocal({ brandAccentPreset: null }, next)
          }
          onBrandAccent={(brand) =>
            applyLocal(
              { brandAccentPreset: brand.id },
              {
                ...scheme,
                accent: brand.accent,
                highlight: brand.highlight,
              },
            )
          }
          onUseBackgroundGradient={(useBackgroundGradient) => {
            // Seed from the header colors only when there is nothing custom
            // yet — `visual.backgroundColorSchemeJson` is never updated
            // locally, so checking it re-seeded (wiping edits) on every toggle.
            if (
              useBackgroundGradient &&
              Object.keys(backgroundScheme).length === 0
            ) {
              editBackgroundScheme(scheme);
            }
            applyLocal({ useBackgroundGradient });
          }}
          onBackgroundSchemeChange={editBackgroundScheme}
          onBackgroundVisualPreset={(preset) =>
            applyLocal({ backgroundVisualPreset: preset })
          }
          videoSlot={videoBackdropSlot}
          slideshowSlot={slideshowControls}
        />
      </>
    );

    const visualizerSlot = (
      <PlayerVisualizerControls
        activeVisualizer={activeVisualizer}
        visualizerEnabled={visualizerEnabled}
        showSettings={showVisualizerSettings}
        tuningSlot={
          dockTuning ? (
            <TuningSliders
              preset={visual.visualPreset}
              visualSettings={visualSettings}
              onSettingChange={setPresetSetting}
            />
          ) : undefined
        }
        onOpenPicker={() => {
          setVisualizerPickerPreset(activeVisualizer);
          setVisualizerPickerOpen(true);
        }}
        onPrevious={() => changeVisualizer(-1)}
        onNext={() => changeVisualizer(1)}
        onToggleSettings={() =>
          setShowVisualizerSettings((isVisible) => !isVisible)
        }
        onToggleEnabled={() => {
          if (visualizerEnabled) {
            applyLocal({ visualPreset: 'MINIMAL' });
          } else {
            applyLocal({ visualPreset: activeVisualizer });
          }
        }}
      />
    );

    const channelTextOverlaySection = (
      <ChannelTextOverlayEditor
        value={{
          mode: visual.textOverlayMode ?? 'NONE',
          text: visual.textOverlayText ?? '',
          align: visual.textOverlayAlign ?? 'CENTER',
        }}
        onChange={(next) =>
          applyLocal({
            textOverlayMode: next.mode,
            textOverlayText: next.text,
            textOverlayAlign: next.align,
          })
        }
      />
    );

    const playerOverlaySection = (
      <PlayerOverlayControls
        playerOverlay={{
          mode: visual.playerOverlayMode ?? 'NONE',
          text: visual.playerOverlayText ?? '',
          align: visual.playerOverlayAlign ?? 'CENTER',
        }}
        onPlayerOverlayChange={(next) =>
          applyLocal({
            playerOverlayMode: next.mode,
            playerOverlayText: next.text,
            playerOverlayAlign: next.align,
          })
        }
        previewStyle={previewStyle}
        nowPlayingStyle={visual.nowPlayingOverlayStyle}
        onNowPlayingStyleChange={(id) =>
          applyLocal({ nowPlayingOverlayStyle: id })
        }
        overlaySettings={overlaySettings}
        displayName={displayName}
        avatarUrl={avatarUrl}
        onConfigureText={() => setOverlayConfigOpen(true)}
      />
    );

    const playerVideoSlot = (
      <VideoOrImageField
        variant="compact"
        disabled={busy}
        pendingFile={pendingVideoFile}
        url={videoBackgroundUrl}
        urlOpen={videoUrlOpen}
        onUrlOpenChange={setVideoUrlOpen}
        onUrlChange={editVideoUrl}
        onFiles={selectVideoFile}
      />
    );

    const playerPanel = (
      <PlayerPanel
        tab={playerDesignTab}
        onTabChange={setPlayerDesignTab}
        usePlayerGradient={visual.usePlayerGradient ?? false}
        playerScheme={playerScheme}
        onUsePlayerGradient={(usePlayerGradient) => {
          if (usePlayerGradient && Object.keys(playerScheme).length === 0) {
            editPlayerScheme(scheme);
          }
          applyLocal({ usePlayerGradient });
        }}
        onPlayerSchemeChange={editPlayerScheme}
        onPlayerBrandAccent={(brand) => {
          editPlayerScheme({
            ...playerScheme,
            accent: brand.accent,
            highlight: brand.highlight,
          });
        }}
        videoSlot={playerVideoSlot}
        visualizerSlot={visualizerSlot}
        overlaySlot={playerOverlaySection}
        footerSlot={channelTextOverlaySection}
      />
    );

    const saveButton = (
      <SaveButton
        disabled={!dirty || videoLoopNeedsUrl}
        saving={busy}
        label={lookOnly ? 'Save look' : 'Save layout'}
        savingLabel={lookOnly ? 'Saving look…' : 'Saving layout…'}
        onClick={() => void save()}
      />
    );

    const openChannelLink = channelSlug ? (
      <Link
        to="/channel/$slug"
        params={{ slug: channelSlug }}
        className="text-primary text-sm font-semibold underline-offset-2 hover:underline"
      >
        Open my channel →
      </Link>
    ) : (
      <Link
        to="/u/$username"
        params={{ username }}
        className="text-primary text-sm font-semibold underline-offset-2 hover:underline"
      >
        Open my channel →
      </Link>
    );

    const selectLookElement = (id: ChannelLookElementId) => {
      setSelectedLookId(id);
      flashHighlight(
        id === 'backdrop' ? 'header' : id === 'player' ? 'visualizer' : null,
      );
    };

    const lookEditorItems = [
      ...LAYOUT_ONLY_LOOK_IDS.map((id) => ({
        id,
        disabled: !lookBlockVisible(id),
        content: <LayoutOnlyLookHint elementId={id} />,
      })),
      {
        id: 'player' as const,
        disabled: !lookBlockVisible('player'),
        content: playerPanel,
      },
      {
        id: 'backdrop' as const,
        content: backdropPanel,
      },
    ];

    const controls = (
      <ChannelElementEditor
        selectedId={selectedLookId}
        onSelect={selectLookElement}
        onToggleDisabled={toggleSelectedLook}
        items={lookEditorItems}
        className={`${lookOnly || dockControlsInRail ? 'h-full' : ''} ${highlightSection ? 'ring-primary ring-2' : ''}`}
      />
    );
    controlsForRailRef.current = dockControlsInRail ? controls : null;

    if (lookOnly) {
      return <div className="flex h-full min-h-0 flex-col">{controls}</div>;
    }

    return (
      <>
        <div className={`flex flex-col gap-4 ${compact ? '' : 'w-full'}`}>
          <DesignerToolbar
            dirty={dirty}
            hasPreviousSave={previousSave != null}
            onOpenSavePresetModal={openSavePresetModal}
            onRequestReset={() => setResetConfirmOpen(true)}
            onRestorePreviousSave={restorePreviousSave}
            saveButton={saveButton}
            openChannelLink={openChannelLink}
          />

          <SavedLooksRow
            presets={presets}
            presetBusy={presetBusy}
            onApply={applyPreset}
            onRequestDelete={setDeletePresetTarget}
          />

          {appliedPresetName && (
            <AppliedPresetBanner
              presetName={appliedPresetName}
              onRevert={() => void revertAppliedPreset()}
              onKeep={keepAppliedPreset}
            />
          )}

          <div
            className={`grid min-h-0 grid-cols-1 gap-4 lg:items-start ${
              dockControlsInRail ? '' : 'lg:grid-cols-[minmax(0,1fr)_24rem]'
            }`}
          >
            <ChannelPagePreview
              displayName={displayName}
              username={username}
              channelSlug={channelSlug}
              avatarUrl={avatarUrl}
              bio={bio}
              layout={layout}
              visual={visual}
              previewStyle={previewStyle}
              previewVideoUrl={previewVideoUrl}
              showHeaderVideo={showHeaderVideo}
              headerBackdropIsImage={headerBackdropIsImage}
              previewPreset={previewPreset}
              scheme={scheme}
              galleryMode={galleryMode}
              galleryImageList={galleryImageList}
              slideshowPreset={slideshowPreset}
              slideshowInterval={slideshowInterval}
              slideshowTransition={slideshowTransition}
              slideshowAutoplay={slideshowAutoplay}
              mountVisualizer={hasLivePreview && visualizerEnabled}
              highlightSection={highlightSection}
              onEditBackdrop={() => {
                selectLookElement('backdrop');
                focusPreviewSection(
                  'header',
                  'channel-designer-section-header',
                );
              }}
              onEditPlayer={() => {
                selectLookElement('player');
                focusPreviewSection(
                  'visualizer',
                  'channel-designer-section-player',
                );
              }}
            />

            {!dockControlsInRail ? (
              <section
                aria-label="Channel appearance controls"
                className="min-w-0 lg:sticky lg:top-4"
              >
                {controls}
              </section>
            ) : null}
          </div>

          <OverlayConfigDialog
            isOpen={overlayConfigOpen}
            overlaySettings={overlaySettings}
            onClose={() => setOverlayConfigOpen(false)}
            onSettingChange={setOverlaySetting}
          />

          <VisualizerPickerDialog
            isOpen={visualizerPickerOpen}
            onClose={() => setVisualizerPickerOpen(false)}
            availableVisualizers={availableVisualizers}
            selectedPreset={visualizerPickerPreset}
            onSelectPreset={setVisualizerPickerPreset}
            onConfirm={() => {
              applyLocal({ visualPreset: visualizerPickerPreset });
              setVisualizerPickerOpen(false);
            }}
            livePreview={livePreview}
            scheme={scheme}
            visualSettingsJson={visualSettingsJson}
            avatarUrl={avatarUrl}
            previewGradient={previewStyle.gradient}
          />
        </div>

        <SavePresetDialog
          isOpen={savePresetOpen}
          presetBusy={presetBusy}
          presetNameInput={presetNameInput}
          onNameChange={setPresetNameInput}
          onClose={() => setSavePresetOpen(false)}
          onConfirm={() => void confirmSavePreset()}
        />

        <DeletePresetDialog
          target={deletePresetTarget}
          presetBusy={presetBusy}
          onClose={() => setDeletePresetTarget(null)}
          onConfirm={() => void confirmDeletePreset()}
        />

        <ResetConfirmDialog
          isOpen={resetConfirmOpen}
          onClose={() => setResetConfirmOpen(false)}
          onConfirm={() => void confirmReset()}
        />
      </>
    );
  },
);
