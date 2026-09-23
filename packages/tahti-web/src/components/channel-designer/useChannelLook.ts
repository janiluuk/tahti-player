import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  channelLookExtrasFromPatch,
  fetchChannelVisual,
  isVisualPreset,
  loadChannelLookExtras,
  parseColorScheme,
  parseVisualSettingsMap,
  patchChannelVisual,
  resolveVisualPresetSettings,
  saveChannelLookExtras,
  uploadChannelHeaderVideo,
  type ChannelVisual,
  type ChannelVisualPreset,
  type ColorScheme,
  type VisualPreset,
  type VisualSettingsMap,
} from '../../api/channel-design';
import {
  fetchChannelGallery,
  patchChannelGallery,
  type ChannelGalleryMode,
} from '../../api/channel-gallery';
import { uploadUserMediaFile } from '../../api/user-media';
import {
  DEFAULT_NOW_PLAYING_OVERLAY_SETTINGS,
  parseNowPlayingOverlaySettings,
  type NowPlayingOverlaySettings,
} from '../../content/nowPlayingOverlayPresets';
import { buildVisualPatch } from './buildVisualPatch';
import { buildLoadedLook } from './lookLoad';
import type { LookSnapshot } from './lookSnapshot';
import { applyPresetToVisual } from './presetApply';
import { splitGalleryImages } from './slideshowOptions';
import { usePendingBackdropFile } from './usePendingBackdropFile';
import { useSavedPresets } from './useSavedPresets';

type Options = {
  layoutSlug: string;
  reloadToken: number;
  onSaved?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
};

/** Draft state and actions of the channel designer: server load, edits,
 * save, presets, gallery and backdrop-file handling. The component keeps
 * only view state (tabs, dialogs, rail docking). */
export function useChannelLook({
  layoutSlug,
  reloadToken,
  onSaved,
  onDirtyChange,
}: Options) {
  const [visual, setVisual] = useState<ChannelVisual | null>(null);
  const [scheme, setScheme] = useState<ColorScheme>({});
  const [playerScheme, setPlayerScheme] = useState<ColorScheme>({});
  const [backgroundScheme, setBackgroundScheme] = useState<ColorScheme>({});
  const [visualSettings, setVisualSettings] = useState<VisualSettingsMap>({});

  const visualSettingsJson = useMemo(
    () => JSON.stringify(visualSettings),
    [visualSettings],
  );
  const [galleryMode, setGalleryMode] = useState<ChannelGalleryMode>('NONE');
  const [galleryImages, setGalleryImages] = useState('');
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviewIndex, setGalleryPreviewIndex] = useState(0);
  const [videoBackgroundUrl, setVideoBackgroundUrl] = useState('');
  const [slideshowPreset, setSlideshowPreset] = useState('FADE');
  const [slideshowInterval, setSlideshowInterval] = useState(8);
  const [slideshowTransition, setSlideshowTransition] = useState(600);
  const [slideshowAutoplay, setSlideshowAutoplay] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  // Bumped on every edit so a save only clears `dirty` if nothing changed
  // while it was in flight.
  const editRevisionRef = useRef(0);
  const markDirty = () => {
    editRevisionRef.current += 1;
    setDirty(true);
  };
  const [previewPreset, setPreviewPreset] = useState<VisualPreset>('AURORA');
  const [overlaySettings, setOverlaySettings] =
    useState<NowPlayingOverlaySettings>(DEFAULT_NOW_PLAYING_OVERLAY_SETTINGS);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [appliedPresetName, setAppliedPresetName] = useState<string | null>(
    null,
  );
  // What's currently live/saved — refreshed on load and after each
  // successful save. `previousSave` is a one-level-back copy of this,
  // captured right before it gets overwritten, so "Restore" can undo the
  // most recent save.
  const [baselineSnapshot, setBaselineSnapshot] = useState<LookSnapshot | null>(
    null,
  );
  const [previousSave, setPreviousSave] = useState<LookSnapshot | null>(null);
  const {
    pendingVideoFile,
    pendingVideoPreviewUrl,
    selectVideoFile,
    discardPendingVideo,
  } = usePendingBackdropFile(markDirty);

  /** Replaces the whole draft with a snapshot. Also drops a picked-but-not-
   * yet-uploaded backdrop file, which would otherwise silently override it. */
  const applySnapshot = (snap: LookSnapshot, shownVisual = snap.visual) => {
    discardPendingVideo();
    setVisual(shownVisual);
    setScheme(snap.scheme);
    setPlayerScheme(snap.playerScheme);
    setBackgroundScheme(snap.backgroundScheme);
    setVisualSettings(snap.visualSettings);
    setGalleryMode(snap.galleryMode);
    setGalleryImages(snap.galleryImages);
    setVideoBackgroundUrl(snap.videoBackgroundUrl);
    setSlideshowPreset(snap.slideshowPreset);
    setSlideshowInterval(snap.slideshowInterval);
    setSlideshowTransition(snap.slideshowTransition);
    setSlideshowAutoplay(snap.slideshowAutoplay);
    setOverlaySettings(snap.overlaySettings);
    setPreviewPreset(snap.previewPreset);
  };

  /** (Re)loads the live saved look from the server, discarding any local
   * draft — the mount/reload path, and also what "Revert" replays after a
   * preset was applied but not saved (see `applyPreset` / the keep-or-revert
   * banner below). */
  const loadRequestRef = useRef(0);
  const loadFromServer = (): Promise<boolean> => {
    const request = ++loadRequestRef.current;
    return Promise.all([fetchChannelVisual(), fetchChannelGallery()])
      .then(([visualResult, galleryResult]) => {
        // A newer load (or unmount) superseded this one: drop the response
        // instead of overwriting fresher state.
        if (request !== loadRequestRef.current) {
          return false;
        }
        const loaded = buildLoadedLook(
          visualResult.data,
          galleryResult.data,
          loadChannelLookExtras(layoutSlug),
        );
        applySnapshot(loaded.snapshot, loaded.shownVisual);
        setDirty(loaded.presetNeedsCorrection);
        setPreviousSave(null);
        setBaselineSnapshot(loaded.snapshot);
        return true;
      })
      .catch(() => {
        if (request === loadRequestRef.current) {
          toast.error('Could not load the channel designer. Try again.');
        }
        return false;
      });
  };

  useEffect(() => {
    void loadFromServer();
    return () => {
      loadRequestRef.current += 1;
    };
  }, [reloadToken]);

  const galleryImageList = useMemo(
    () => splitGalleryImages(galleryImages),
    [galleryImages],
  );

  // Keep the preview on a real image after add/remove; reordering sets its
  // own index, which a blanket reset to 0 here used to clobber.
  useEffect(() => {
    setGalleryPreviewIndex((index) =>
      index >= galleryImageList.length ? 0 : index,
    );
  }, [galleryImageList.length]);

  useEffect(() => {
    if (galleryImageList.length < 2 || !slideshowAutoplay) {
      return;
    }
    const timer = window.setInterval(() => {
      setGalleryPreviewIndex((index) => (index + 1) % galleryImageList.length);
    }, slideshowInterval * 1000);
    return () => window.clearInterval(timer);
  }, [galleryImageList.length, slideshowAutoplay, slideshowInterval]);

  const previewStyle = useMemo(() => {
    const accent = scheme.accent ?? '#22D3EE';
    const highlight = scheme.highlight ?? '#A78BFA';
    const bg = scheme.bg ?? '#0B1220';
    const fg = scheme.text ?? '#F8FAFC';
    // Always derive the preview from the live scheme pickers. Brand swatches
    // only *seed* accent/highlight; they must not keep overriding custom
    // colors after the user edits a picker (that looked "stuck on purple").
    const gradient =
      visual?.headerStyle === 'SOLID'
        ? bg
        : `linear-gradient(135deg, ${highlight}, ${accent}, ${bg})`;
    return { accent, highlight, bg, fg, gradient };
  }, [scheme, visual?.headerStyle]);

  const applyLocal = (
    next: Partial<ChannelVisual>,
    nextScheme?: ColorScheme,
  ) => {
    setVisual((v) => (v ? { ...v, ...next } : v));
    if (next.visualPreset && isVisualPreset(next.visualPreset)) {
      setPreviewPreset(next.visualPreset);
    }
    if (nextScheme) {
      setScheme(nextScheme);
    }
    markDirty();
  };

  // Edit helpers: every user edit goes through one of these (or applyLocal),
  // so the dirty flag and edit revision cannot be forgotten.
  const editGalleryMode = (
    mode:
      | ChannelGalleryMode
      | ((current: ChannelGalleryMode) => ChannelGalleryMode),
  ) => {
    setGalleryMode(mode);
    markDirty();
  };
  const editSlideshow = (
    patch: Partial<{
      preset: string;
      interval: number;
      transition: number;
      autoplay: boolean;
    }>,
  ) => {
    if (patch.preset !== undefined) {
      setSlideshowPreset(patch.preset);
    }
    if (patch.interval !== undefined) {
      setSlideshowInterval(patch.interval);
    }
    if (patch.transition !== undefined) {
      setSlideshowTransition(patch.transition);
    }
    if (patch.autoplay !== undefined) {
      setSlideshowAutoplay(patch.autoplay);
    }
    markDirty();
  };
  const editBackgroundScheme = (next: ColorScheme) => {
    setBackgroundScheme(next);
    markDirty();
  };
  const editPlayerScheme = (next: ColorScheme) => {
    setPlayerScheme(next);
    markDirty();
  };
  /** A typed backdrop URL replaces any file picked for upload. */
  const editVideoUrl = (url: string) => {
    setVideoBackgroundUrl(url);
    discardPendingVideo();
    markDirty();
  };

  const clearVideo = () => {
    discardPendingVideo();
    setVideoBackgroundUrl('');
    markDirty();
  };

  const removeBackdrop = () => {
    clearVideo();
    setGalleryImages('');
    setGalleryMode('NONE');
  };

  const selectGalleryFiles = async (files: readonly File[]) => {
    const imageFiles = files.filter((file) =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
    );
    if (imageFiles.length === 0) {
      toast.error('Choose JPEG, PNG, or WebP images.');
      return;
    }
    if (galleryImageList.length + imageFiles.length > 10) {
      toast.error('Use up to 10 background images.');
      return;
    }
    setGalleryFiles(imageFiles);
    setBusy(true);
    let uploads: Awaited<ReturnType<typeof uploadUserMediaFile>>[];
    try {
      uploads = await Promise.all(
        imageFiles.map((file) => uploadUserMediaFile(file)),
      );
    } catch {
      toast.error('Image upload failed. Try again.');
      return;
    } finally {
      setBusy(false);
      setGalleryFiles([]);
    }
    const uploadedUrls = uploads.flatMap((result) =>
      result.ok ? [result.data.url] : [],
    );
    if (uploadedUrls.length > 0) {
      // Append to the *current* list — the user may have reordered or
      // removed images while the upload ran.
      setGalleryImages((current) =>
        [...splitGalleryImages(current), ...uploadedUrls].join('\n'),
      );
      setGalleryMode('STATIC_SLIDESHOW');
      markDirty();
      toast.success(
        `${uploadedUrls.length} image${uploadedUrls.length === 1 ? '' : 's'} added to the slideshow.`,
      );
    }
    const errors = uploads.flatMap((result) =>
      result.ok ? [] : [result.error],
    );
    if (errors.length > 0) {
      toast.error(errors.join('; '));
    }
  };

  const removeGalleryImage = (index: number) => {
    const nextImages = galleryImageList.filter(
      (_, imageIndex) => imageIndex !== index,
    );
    setGalleryImages(nextImages.join('\n'));
    if (nextImages.length === 0) {
      setGalleryMode('NONE');
    }
    markDirty();
  };

  const reorderGalleryImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) {
      return;
    }
    const nextImages = [...galleryImageList];
    const [movedImage] = nextImages.splice(fromIndex, 1);
    nextImages.splice(toIndex, 0, movedImage);
    setGalleryImages(nextImages.join('\n'));
    setGalleryPreviewIndex(toIndex);
    markDirty();
  };

  const setPresetSetting = (
    preset: string,
    key: 'speed' | 'intensity' | 'audioReactive',
    value: number | boolean,
  ) => {
    const nextValue =
      typeof value === 'number' ? Math.round(value * 100) / 100 : value;
    setVisualSettings((current) => ({
      ...current,
      [preset]: {
        ...resolveVisualPresetSettings(current, preset),
        [key]: nextValue,
      },
    }));
    markDirty();
  };

  const setOverlaySetting = <
    SettingKey extends keyof NowPlayingOverlaySettings,
  >(
    key: SettingKey,
    value: NowPlayingOverlaySettings[SettingKey],
  ) => {
    setOverlaySettings((current) => ({ ...current, [key]: value }));
    markDirty();
  };

  const buildPatch = (videoUrl: string | null) =>
    buildVisualPatch(
      {
        visual,
        scheme,
        playerScheme,
        backgroundScheme,
        visualSettings,
        slideshowPreset,
        slideshowInterval,
        slideshowTransition,
        slideshowAutoplay,
        overlaySettings,
      },
      videoUrl,
    );

  const saveLook = async () => {
    if (!visual) {
      return;
    }
    const previousBaseline = baselineSnapshot;
    const images = splitGalleryImages(galleryImages);
    if (images.length > 10) {
      toast.error('Use up to 10 gallery images.');
      return;
    }
    if (galleryMode !== 'NONE' && images.length === 0) {
      toast.error('Add at least one image for the selected gallery.');
      return;
    }
    if (images.some((image) => !/^https:\/\/\S+$/i.test(image))) {
      toast.error('Gallery images must use public HTTPS URLs.');
      return;
    }
    setBusy(true);
    const revisionAtSave = editRevisionRef.current;
    // What this save persists; later edits must not leak into the baseline.
    const savedOverlaySettings = overlaySettings;
    const savedPreviewPreset = previewPreset;
    let savedVideoUrl = videoBackgroundUrl.trim() || null;
    if (pendingVideoFile) {
      const upload = await uploadChannelHeaderVideo(pendingVideoFile);
      if (!upload.ok) {
        setBusy(false);
        toast.error(upload.error);
        return;
      }
      savedVideoUrl = upload.videoBackgroundUrl;
      setVideoBackgroundUrl(upload.videoBackgroundUrl);
      discardPendingVideo();
    }
    const patch = buildPatch(savedVideoUrl);
    if (!patch) {
      setBusy(false);
      return;
    }
    const result = await patchChannelVisual(patch);
    if (!result.ok) {
      setBusy(false);
      toast.error(result.error);
      return;
    }
    saveChannelLookExtras(layoutSlug, channelLookExtrasFromPatch(patch));

    // The visual endpoint is the source of truth for the header and player
    // design. Apply it immediately so a gallery endpoint failure cannot make
    // an otherwise successful backdrop save look like it failed.
    const newScheme = parseColorScheme(result.data.colorSchemeJson);
    const newPlayerScheme = parseColorScheme(result.data.playerColorSchemeJson);
    const newBackgroundScheme = parseColorScheme(
      result.data.backgroundColorSchemeJson,
    );
    const newVisualSettings = parseVisualSettingsMap(
      result.data.visualSettingsJson,
    );
    const newSlideshowPreset = result.data.slideshowPreset ?? slideshowPreset;
    const newSlideshowInterval =
      result.data.slideshowIntervalSeconds ?? slideshowInterval;
    const newSlideshowTransition =
      result.data.slideshowTransitionMs ?? slideshowTransition;
    const newSlideshowAutoplay =
      result.data.slideshowAutoplay ?? slideshowAutoplay;
    // The user may have kept editing while the request ran. Then the draft
    // stays as it is (and dirty), instead of being overwritten by the server
    // copy of an older state.
    if (editRevisionRef.current === revisionAtSave) {
      setVisual(result.data);
      setScheme(newScheme);
      setPlayerScheme(newPlayerScheme);
      setBackgroundScheme(newBackgroundScheme);
      setVisualSettings(newVisualSettings);
      setSlideshowPreset(newSlideshowPreset);
      setSlideshowInterval(newSlideshowInterval);
      setSlideshowTransition(newSlideshowTransition);
      setSlideshowAutoplay(newSlideshowAutoplay);
      setDirty(false);
      setAppliedPresetName(null);
    }
    onSaved?.();

    const galleryResult = await patchChannelGallery({
      galleryMode,
      slideshowImages: images,
      videoBackgroundUrl: savedVideoUrl,
    });
    setBusy(false);
    if (!galleryResult.ok) {
      toast.warning(
        'Backdrop saved, but slideshow settings could not be updated.',
      );
    } else {
      toast.success('Look saved — public channel will pick this up.');
    }
    if (previousBaseline) {
      setPreviousSave(previousBaseline);
    }
    setBaselineSnapshot({
      visual: result.data,
      scheme: newScheme,
      playerScheme: newPlayerScheme,
      backgroundScheme: newBackgroundScheme,
      visualSettings: newVisualSettings,
      // If the gallery endpoint failed, the server still holds the old one.
      galleryMode: galleryResult.ok
        ? galleryMode
        : (previousBaseline?.galleryMode ?? galleryMode),
      galleryImages: galleryResult.ok
        ? images.join('\n')
        : (previousBaseline?.galleryImages ?? images.join('\n')),
      videoBackgroundUrl: savedVideoUrl ?? '',
      slideshowPreset: newSlideshowPreset,
      slideshowInterval: newSlideshowInterval,
      slideshowTransition: newSlideshowTransition,
      slideshowAutoplay: newSlideshowAutoplay,
      overlaySettings: savedOverlaySettings,
      previewPreset: savedPreviewPreset,
    });
  };

  // A thrown network error used to leave the designer stuck on `busy`.
  const save = async () => {
    try {
      await saveLook();
    } catch {
      toast.error('Could not save your look. Try again.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const {
    presets,
    savePresetOpen,
    setSavePresetOpen,
    presetNameInput,
    setPresetNameInput,
    presetBusy,
    deletePresetTarget,
    setDeletePresetTarget,
    openSavePresetModal,
    confirmSavePreset,
    confirmDeletePreset,
  } = useSavedPresets({
    reloadToken,
    buildDraftPatch: () => buildPatch(videoBackgroundUrl.trim() || null),
    hasPendingBackdropFile: pendingVideoFile !== null,
    appliedPresetName,
    clearAppliedPresetName: () => setAppliedPresetName(null),
  });

  /** Applies a saved preset's settings straight into the local draft — the
   * same "dirty until Saved" flow as any other designer change — then
   * surfaces the keep-or-revert banner so a preset switch never silently
   * discards whatever the owner had before, and never silently commits it
   * either. */
  const applyPreset = (preset: ChannelVisualPreset) => {
    const s = preset.settings;
    setVisual((v) => (v ? applyPresetToVisual(v, s) : v));
    setScheme(s.colorScheme ?? {});
    setPlayerScheme(
      s.playerColorSchemeJson
        ? (parseColorScheme(s.playerColorSchemeJson) ?? {})
        : {},
    );
    setBackgroundScheme(
      s.backgroundColorSchemeJson
        ? (parseColorScheme(s.backgroundColorSchemeJson) ?? {})
        : {},
    );
    setVisualSettings(s.visualSettings ?? {});
    setSlideshowPreset(s.slideshowPreset ?? 'FADE');
    setSlideshowInterval(s.slideshowIntervalSeconds ?? 8);
    setSlideshowTransition(s.slideshowTransitionMs ?? 600);
    setSlideshowAutoplay(s.slideshowAutoplay ?? true);
    setOverlaySettings(
      parseNowPlayingOverlaySettings(s.nowPlayingOverlaySettingsJson),
    );
    // The preset's backdrop replaces any file picked for upload.
    discardPendingVideo();
    setVideoBackgroundUrl(
      typeof s.videoBackgroundUrl === 'string' ? s.videoBackgroundUrl : '',
    );
    if (
      s.visualPreset &&
      isVisualPreset(s.visualPreset) &&
      s.visualPreset !== 'MINIMAL'
    ) {
      setPreviewPreset(s.visualPreset);
    }
    markDirty();
    setAppliedPresetName(preset.name);
  };

  const keepAppliedPreset = () => {
    setAppliedPresetName(null);
  };

  // The banner stays up if the reload fails, since the preset is still applied.
  const revertAppliedPreset = async () => {
    if (await loadFromServer()) {
      setAppliedPresetName(null);
    }
  };

  /** Undoes the most recent "Save layout" — reapplies the snapshot taken
   * right before that save as a new local draft (same "dirty until Saved"
   * flow as everything else here), so pressing Save again actually
   * persists the revert. In-memory only; gone on reload. */
  const restorePreviousSave = () => {
    if (!previousSave) {
      return;
    }
    applySnapshot(previousSave);
    setAppliedPresetName(null);
    markDirty();
    toast.success('Previous save restored — press Save to keep it.');
  };

  /** Discards unsaved edits, restoring the live saved look — same replay
   * as `revertAppliedPreset` above, gated by an explicit confirm since
   * this can throw away more than a single unsaved preset apply. */
  const confirmReset = async () => {
    setResetConfirmOpen(false);
    if (await loadFromServer()) {
      setAppliedPresetName(null);
      toast.success('Reset to your last saved version.');
    }
  };

  return {
    editBackgroundScheme,
    editGalleryMode,
    editPlayerScheme,
    editSlideshow,
    editVideoUrl,
    appliedPresetName,
    applyLocal,
    applyPreset,
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
    markDirty,
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
    setBackgroundScheme,
    setDeletePresetTarget,
    setGalleryMode,
    setGalleryPreviewIndex,
    setOverlaySetting,
    setPlayerScheme,
    setPresetNameInput,
    setPresetSetting,
    setPreviewPreset,
    setResetConfirmOpen,
    setSavePresetOpen,
    setSlideshowAutoplay,
    setSlideshowInterval,
    setSlideshowPreset,
    setSlideshowTransition,
    setVideoBackgroundUrl,
    slideshowAutoplay,
    slideshowInterval,
    slideshowPreset,
    slideshowTransition,
    videoBackgroundUrl,
    visual,
    visualSettings,
    visualSettingsJson,
  };
}
