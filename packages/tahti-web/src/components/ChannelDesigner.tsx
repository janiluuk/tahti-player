import { Link } from '@tanstack/react-router';
import {
  BookmarkPlusIcon,
  CheckIcon,
  ImageIcon,
  LinkIcon,
  RotateCcwIcon,
  SettingsIcon,
  Trash2Icon,
} from 'lucide-react';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  Dialog,
  DropdownButton,
  FilePicker,
  Input,
  SaveButton,
  Select,
  Slider,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import {
  channelLookExtrasFromPatch,
  channelLookExtrasFromVisual,
  deleteChannelVisualPreset,
  fetchChannelVisual,
  fetchChannelVisualPresets,
  fillColorScheme,
  isHeaderImageUrl,
  isValidHeaderBackdropUrl,
  isVisualPreset,
  loadChannelLookExtras,
  MAX_HEADER_VIDEO_BYTES,
  mergeLookExtrasPreferApi,
  parseColorScheme,
  parseVisualSettingsMap,
  patchChannelVisual,
  resolveVisualPresetSettings,
  saveChannelLookExtras,
  saveChannelVisualPreset,
  shouldDockVisualizerTuning,
  uploadChannelHeaderVideo,
  VISUAL_PRESETS,
  youtubeEmbedUrl,
  type ChannelVisual,
  type ChannelVisualPatch,
  type ChannelVisualPreset,
  type ColorScheme,
  type VisualPreset,
  type VisualSettingsMap,
} from '../api/channel-design';
import {
  fetchChannelGallery,
  patchChannelGallery,
  type ChannelGalleryMode,
} from '../api/channel-gallery';
import { uploadUserMediaFile } from '../api/user-media';
import {
  DEFAULT_NOW_PLAYING_OVERLAY_SETTINGS,
  NOW_PLAYING_OVERLAY_PRESETS,
  parseNowPlayingOverlaySettings,
  resolveNowPlayingOverlayPreset,
  type NowPlayingOverlaySettings,
} from '../content/nowPlayingOverlayPresets';
import {
  CHANNEL_LOOK_ELEMENTS,
  isArtistLookBlockId,
  isChannelLookElementId,
  loadArtistLookVisibility,
  saveArtistLookVisibility,
  type ArtistLookBlockId,
  type ChannelLookElementId,
} from '../lib/channelLookElements';
import {
  loadChannelPageLayout,
  saveChannelPageLayout,
  setItemVisible,
  type ChannelPageItem,
  type ChannelPageItemType,
} from '../lib/channelPageLayout';
import {
  visualizerMetadata,
  visualizerSupportsAudioReactive,
} from '../plugins/visualizers';
import {
  BackdropPanel,
  LAYOUT_ONLY_LOOK_IDS,
  LayoutOnlyLookHint,
  PlayerPanel,
  PlayerVisualizerControls,
  resolveHeaderDesignMode,
  type HeaderDesignMode,
  type PlayerDesignTab,
} from './channel-designer';
import { ChannelBackdropCard } from './ChannelBackdropCard';
import { ChannelElementEditor } from './ChannelElementEditor';
import { ChannelTextOverlayEditor } from './ChannelTextOverlayEditor';
import { ChannelTextOverlayView } from './ChannelTextOverlayView';
import { ChannelVisualizer } from './ChannelVisualizer';
import { NowPlayingOverlay } from './NowPlayingOverlay';
import { PageLoading } from './PageStates';
import { Eyebrow } from './tahti/Eyebrow';

type TabId = 'visualizer' | 'color-scheme' | 'header';
type LookSection =
  | ChannelLookElementId
  | 'player-design'
  | 'visual-style'
  | 'links'
  | 'text-overlay';

const HEADER_MEDIA_TYPES = [
  'video/mp4',
  'video/webm',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const GALLERY_MODES: Array<{ id: ChannelGalleryMode; label: string }> = [
  { id: 'NONE', label: 'None' },
  { id: 'STATIC_SLIDESHOW', label: 'Static slideshow' },
  { id: 'TWISTED_WAVE_GLSL', label: 'Twisted wave (WebGL)' },
  { id: 'ZOOM_BLUR_GLSL', label: 'Cinematic zoom blur (WebGL)' },
  { id: 'RGB_SHIFT_GLSL', label: 'RGB shift strip (WebGL)' },
  { id: 'POSTER_WALL_GLSL', label: 'Poster scroll wall (WebGL)' },
  { id: 'SHATTER_CAROUSEL_GLSL', label: 'Shatter carousel (WebGL)' },
];

const SLIDESHOW_PRESETS = [
  ['FADE', 'Fade'],
  ['ZOOM', 'Zoom'],
  ['PAN', 'Pan'],
  ['BLUR_CROSS', 'Blur crossfade'],
  ['PARTICLE_DISSOLVE', 'Particle dissolve'],
  ['GLITCH_WIPE', 'Glitch wipe'],
  ['CUBE_FLIP', 'Cube flip'],
  ['LIQUID_DISTORTION', 'Liquid distortion'],
] as const;

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
  lookOpenSection?: LookSection | null;
  onDirtyChange?: (dirty: boolean) => void;
  onLookVisibilityChange?: (
    visibility: Record<ArtistLookBlockId, boolean>,
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
      lookOpenSection,
      onDirtyChange,
      onLookVisibilityChange,
    }: Props,
    ref,
  ) {
    const [visual, setVisual] = useState<ChannelVisual | null>(null);
    const [scheme, setScheme] = useState<ColorScheme>({});
    const [playerScheme, setPlayerScheme] = useState<ColorScheme>({});
    const [backgroundScheme, setBackgroundScheme] = useState<ColorScheme>({});
    const [visualSettings, setVisualSettings] = useState<VisualSettingsMap>({});
    const [galleryMode, setGalleryMode] = useState<ChannelGalleryMode>('NONE');
    const [galleryImages, setGalleryImages] = useState('');
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [draggedGalleryIndex, setDraggedGalleryIndex] = useState<
      number | null
    >(null);
    const [galleryPreviewIndex, setGalleryPreviewIndex] = useState(0);
    const [videoBackgroundUrl, setVideoBackgroundUrl] = useState('');
    const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);
    const [pendingVideoPreviewUrl, setPendingVideoPreviewUrl] = useState<
      string | null
    >(null);
    const [videoUrlOpen, setVideoUrlOpen] = useState(false);
    const [slideshowPreset, setSlideshowPreset] = useState('FADE');
    const [slideshowInterval, setSlideshowInterval] = useState(8);
    const [slideshowTransition, setSlideshowTransition] = useState(600);
    const [slideshowAutoplay, setSlideshowAutoplay] = useState(true);
    const [busy, setBusy] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [previewPreset, setPreviewPreset] = useState<VisualPreset>('AURORA');
    const [showVisualizerSettings, setShowVisualizerSettings] = useState(false);
    const [overlaySettings, setOverlaySettings] =
      useState<NowPlayingOverlaySettings>(DEFAULT_NOW_PLAYING_OVERLAY_SETTINGS);
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
    const [, setPageLayout] = useState<ChannelPageItem[]>([]);
    const [lookVisibility, setLookVisibility] = useState<
      Record<ArtistLookBlockId, boolean>
    >(loadArtistLookVisibility(channelSlug ?? username));

    const [presets, setPresets] = useState<ChannelVisualPreset[]>([]);
    const [savePresetOpen, setSavePresetOpen] = useState(false);
    const [presetNameInput, setPresetNameInput] = useState('');
    const [presetBusy, setPresetBusy] = useState(false);
    const [deletePresetTarget, setDeletePresetTarget] =
      useState<ChannelVisualPreset | null>(null);
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
    const [appliedPresetName, setAppliedPresetName] = useState<string | null>(
      null,
    );

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

    const layoutSlug = channelSlug ?? username;

    useEffect(() => {
      setPageLayout(loadChannelPageLayout(layoutSlug));
      const visibility = loadArtistLookVisibility(layoutSlug);
      setLookVisibility(visibility);
      onLookVisibilityChange?.(visibility);
    }, [layoutSlug, reloadToken, onLookVisibilityChange]);

    const toggleLayoutType = (type: ChannelPageItemType) => {
      setPageLayout((current) => {
        const row = current.find((item) => item.type === type);
        if (!row) {
          return current;
        }
        const next = setItemVisible(current, row.id, !row.visible);
        saveChannelPageLayout(layoutSlug, next);
        return next;
      });
    };

    const focusPreviewSection = (
      tab: 'header' | 'visualizer',
      elementId: string,
    ) => {
      setActiveTab(tab);
      setHighlightSection(tab);
      document
        .getElementById(elementId)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => {
        setHighlightSection((current) => (current === tab ? null : current));
      }, 1600);
    };

    /** (Re)loads the live saved look from the server, discarding any local
     * draft — the mount/reload path, and also what "Revert" replays after a
     * preset was applied but not saved (see `applyPreset` / the keep-or-revert
     * banner below). */
    const loadFromServer = () => {
      void Promise.all([fetchChannelVisual(), fetchChannelGallery()]).then(
        ([visualResult, galleryResult]) => {
          const fromApi = channelLookExtrasFromVisual(visualResult.data);
          const extras = mergeLookExtrasPreferApi(
            fromApi,
            loadChannelLookExtras(layoutSlug),
          );
          const mergedVisual = { ...visualResult.data, ...extras };
          setVisual(mergedVisual);
          setOverlaySettings(
            parseNowPlayingOverlaySettings(
              mergedVisual.nowPlayingOverlaySettingsJson,
            ),
          );
          setScheme(parseColorScheme(mergedVisual.colorSchemeJson));
          setPlayerScheme(parseColorScheme(mergedVisual.playerColorSchemeJson));
          setBackgroundScheme(
            parseColorScheme(mergedVisual.backgroundColorSchemeJson),
          );
          setVisualSettings(
            parseVisualSettingsMap(visualResult.data.visualSettingsJson),
          );
          if (
            isVisualPreset(mergedVisual.visualPreset) &&
            mergedVisual.visualPreset !== 'MINIMAL'
          ) {
            setPreviewPreset(mergedVisual.visualPreset);
          } else {
            setPreviewPreset('AURORA');
            setVisual({ ...mergedVisual, visualPreset: 'AURORA' });
            setDirty(true);
          }
          setGalleryMode(galleryResult.data.galleryMode);
          setGalleryImages(galleryResult.data.slideshowImages.join('\n'));
          setVideoBackgroundUrl(galleryResult.data.videoBackgroundUrl ?? '');
          setSlideshowPreset(visualResult.data.slideshowPreset ?? 'FADE');
          setSlideshowInterval(visualResult.data.slideshowIntervalSeconds ?? 8);
          setSlideshowTransition(
            visualResult.data.slideshowTransitionMs ?? 600,
          );
          setSlideshowAutoplay(visualResult.data.slideshowAutoplay ?? true);
          setDirty(false);
        },
      );
    };

    useEffect(loadFromServer, [reloadToken]);

    useEffect(() => {
      void fetchChannelVisualPresets().then(({ data }) => setPresets(data));
    }, [reloadToken]);

    const galleryImageList = useMemo(
      () =>
        galleryImages
          .split(/\r?\n/)
          .map((image) => image.trim())
          .filter(Boolean),
      [galleryImages],
    );

    useEffect(() => {
      setGalleryPreviewIndex(0);
    }, [galleryImages]);

    useEffect(() => {
      if (galleryImageList.length < 2 || !slideshowAutoplay) {
        return;
      }
      const timer = window.setInterval(() => {
        setGalleryPreviewIndex(
          (index) => (index + 1) % galleryImageList.length,
        );
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
      setDirty(true);
    };

    const selectVideoFile = (files: readonly File[]) => {
      const file = files[0];
      if (!file) {
        return;
      }
      if (file.size > MAX_HEADER_VIDEO_BYTES) {
        toast.error('File must be 10 MB or smaller.');
        return;
      }
      if (!HEADER_MEDIA_TYPES.includes(file.type)) {
        toast.error('Use an MP4/WebM video or a JPEG/PNG/WebP/GIF image.');
        return;
      }
      if (pendingVideoPreviewUrl) {
        URL.revokeObjectURL(pendingVideoPreviewUrl);
      }
      setPendingVideoFile(file);
      setPendingVideoPreviewUrl(URL.createObjectURL(file));
      setDirty(true);
    };

    const clearVideo = () => {
      if (pendingVideoPreviewUrl) {
        URL.revokeObjectURL(pendingVideoPreviewUrl);
      }
      setPendingVideoFile(null);
      setPendingVideoPreviewUrl(null);
      setVideoBackgroundUrl('');
      setDirty(true);
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
      const uploads = await Promise.all(
        imageFiles.map((file) => uploadUserMediaFile(file)),
      );
      setBusy(false);
      setGalleryFiles([]);
      const uploadedUrls = uploads.flatMap((result) =>
        result.ok ? [result.data.url] : [],
      );
      if (uploadedUrls.length > 0) {
        const nextImages = [...galleryImageList, ...uploadedUrls];
        setGalleryImages(nextImages.join('\n'));
        setGalleryMode('STATIC_SLIDESHOW');
        setDirty(true);
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
      setDirty(true);
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
      setDirty(true);
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
      setDirty(true);
    };

    const setOverlaySetting = <
      SettingKey extends keyof NowPlayingOverlaySettings,
    >(
      key: SettingKey,
      value: NowPlayingOverlaySettings[SettingKey],
    ) => {
      setOverlaySettings((current) => ({ ...current, [key]: value }));
      setDirty(true);
    };

    /** Everything the "Look" currently holds, as one patch — sent to save,
     * and (with the current, not-yet-uploaded backdrop URL) snapshotted
     * as-is when saving a named preset. */
    const buildVisualPatch = (
      videoUrl: string | null,
    ): ChannelVisualPatch | null => {
      if (!visual) {
        return null;
      }
      return {
        visualPreset: visual.visualPreset,
        headerStyle: visual.headerStyle,
        videoBackgroundUrl: videoUrl,
        brandAccentPreset: visual.brandAccentPreset,
        colorScheme: fillColorScheme(scheme),
        visualSettings,
        slideshowPreset,
        slideshowIntervalSeconds: slideshowInterval,
        slideshowTransitionMs: slideshowTransition,
        slideshowAutoplay,
        nowPlayingOverlayStyle: visual.nowPlayingOverlayStyle ?? undefined,
        nowPlayingOverlaySettingsJson: JSON.stringify(overlaySettings),
        usePlayerGradient: visual.usePlayerGradient ?? false,
        playerColorSchemeJson: visual.usePlayerGradient
          ? JSON.stringify(fillColorScheme(playerScheme))
          : null,
        backgroundVisualPreset: visual.backgroundVisualPreset ?? undefined,
        useBackgroundGradient: visual.useBackgroundGradient ?? false,
        backgroundColorSchemeJson: visual.useBackgroundGradient
          ? JSON.stringify(fillColorScheme(backgroundScheme))
          : null,
        channelLinks: visual.channelLinks ?? [],
        textOverlayMode: visual.textOverlayMode ?? 'NONE',
        textOverlayText: visual.textOverlayText ?? '',
        textOverlayAlign: visual.textOverlayAlign ?? 'CENTER',
        playerOverlayMode: visual.playerOverlayMode ?? 'NONE',
        playerOverlayText: visual.playerOverlayText ?? '',
        playerOverlayAlign: visual.playerOverlayAlign ?? 'CENTER',
      };
    };

    const save = async () => {
      if (!visual) {
        return;
      }
      const images = galleryImages
        .split(/\r?\n/)
        .map((image) => image.trim())
        .filter(Boolean);
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
        if (pendingVideoPreviewUrl) {
          URL.revokeObjectURL(pendingVideoPreviewUrl);
        }
        setPendingVideoFile(null);
        setPendingVideoPreviewUrl(null);
      }
      const patch = buildVisualPatch(savedVideoUrl);
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
      setVisual(result.data);
      setScheme(parseColorScheme(result.data.colorSchemeJson));
      setPlayerScheme(parseColorScheme(result.data.playerColorSchemeJson));
      setBackgroundScheme(
        parseColorScheme(result.data.backgroundColorSchemeJson),
      );
      setVisualSettings(parseVisualSettingsMap(result.data.visualSettingsJson));
      setSlideshowPreset(result.data.slideshowPreset ?? slideshowPreset);
      setSlideshowInterval(
        result.data.slideshowIntervalSeconds ?? slideshowInterval,
      );
      setSlideshowTransition(
        result.data.slideshowTransitionMs ?? slideshowTransition,
      );
      setSlideshowAutoplay(result.data.slideshowAutoplay ?? slideshowAutoplay);
      setDirty(false);
      setAppliedPresetName(null);
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
    };

    useImperativeHandle(ref, () => ({ save }), [save]);

    useEffect(() => {
      onDirtyChange?.(dirty);
    }, [dirty, onDirtyChange]);

    const openSavePresetModal = () => {
      if (pendingVideoFile) {
        toast.error(
          'Upload or clear the pending backdrop file before saving a preset.',
        );
        return;
      }
      setPresetNameInput('');
      setSavePresetOpen(true);
    };

    const confirmSavePreset = async () => {
      const name = presetNameInput.trim();
      if (!name) {
        toast.error('Give the preset a name.');
        return;
      }
      const patch = buildVisualPatch(videoBackgroundUrl.trim() || null);
      if (!patch) {
        return;
      }
      setPresetBusy(true);
      const result = await saveChannelVisualPreset(name, patch);
      setPresetBusy(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPresets((prev) => [
        result.data,
        ...prev.filter((p) => p.id !== result.data.id),
      ]);
      toast.success(`Saved "${name}"`);
      setSavePresetOpen(false);
    };

    /** Applies a saved preset's settings straight into the local draft — the
     * same "dirty until Saved" flow as any other designer change — then
     * surfaces the keep-or-revert banner so a preset switch never silently
     * discards whatever the owner had before, and never silently commits it
     * either. */
    const applyPreset = (preset: ChannelVisualPreset) => {
      const s = preset.settings;
      setVisual((v) =>
        v
          ? {
              ...v,
              ...(s.visualPreset !== undefined
                ? { visualPreset: s.visualPreset }
                : {}),
              ...(s.headerStyle !== undefined
                ? { headerStyle: s.headerStyle }
                : {}),
              videoBackgroundUrl: s.videoBackgroundUrl ?? null,
              brandAccentPreset: s.brandAccentPreset ?? null,
              nowPlayingOverlayStyle:
                s.nowPlayingOverlayStyle ?? v.nowPlayingOverlayStyle,
              usePlayerGradient: s.usePlayerGradient ?? false,
              backgroundVisualPreset:
                s.backgroundVisualPreset ?? v.backgroundVisualPreset,
              useBackgroundGradient: s.useBackgroundGradient ?? false,
              channelLinks: s.channelLinks ?? [],
              textOverlayMode: s.textOverlayMode ?? 'NONE',
              textOverlayText: s.textOverlayText ?? '',
              textOverlayAlign: s.textOverlayAlign ?? 'CENTER',
              playerOverlayMode: s.playerOverlayMode ?? 'NONE',
              playerOverlayText: s.playerOverlayText ?? '',
              playerOverlayAlign: s.playerOverlayAlign ?? 'CENTER',
            }
          : v,
      );
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
      setDirty(true);
      setAppliedPresetName(preset.name);
    };

    const keepAppliedPreset = () => {
      setAppliedPresetName(null);
    };

    const revertAppliedPreset = () => {
      loadFromServer();
      setAppliedPresetName(null);
    };

    /** Discards unsaved edits, restoring the live saved look — same replay
     * as `revertAppliedPreset` above, gated by an explicit confirm since
     * this can throw away more than a single unsaved preset apply. */
    const confirmReset = () => {
      loadFromServer();
      setAppliedPresetName(null);
      setResetConfirmOpen(false);
      toast.success('Reset to your last saved version.');
    };

    const confirmDeletePreset = async () => {
      if (!deletePresetTarget) {
        return;
      }
      const target = deletePresetTarget;
      setPresetBusy(true);
      const result = await deleteChannelVisualPreset(target.id);
      setPresetBusy(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPresets((prev) => prev.filter((p) => p.id !== target.id));
      if (appliedPresetName === target.name) {
        setAppliedPresetName(null);
      }
      toast.success(`Deleted "${target.name}"`);
      setDeletePresetTarget(null);
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
      setPreviewPreset(nextPreset);
      applyLocal({ visualPreset: nextPreset });
    };

    const tuningSliders = (preset: string) => (
      <>
        {(['speed', 'intensity'] as const).map((key) => {
          const current = resolveVisualPresetSettings(visualSettings, preset);
          return (
            <Slider
              key={key}
              label={key === 'speed' ? 'Speed' : 'Intensity'}
              min={0.25}
              max={2}
              step={0.05}
              unit="×"
              value={current[key]}
              onValueChange={(value) => setPresetSetting(preset, key, value)}
            />
          );
        })}
        {visualizerSupportsAudioReactive(preset) ? (
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>Audio reactive</span>
            <Toggle
              label="Audio reactive"
              checked={
                resolveVisualPresetSettings(visualSettings, preset)
                  .audioReactive
              }
              onChange={(checked) =>
                setPresetSetting(preset, 'audioReactive', checked)
              }
            />
          </div>
        ) : null}
      </>
    );

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
        setGalleryMode((modeValue) =>
          modeValue === 'NONE' ? 'STATIC_SLIDESHOW' : modeValue,
        );
        applyLocal({ headerStyle: 'GRADIENT' });
        return;
      }
      setGalleryMode('NONE');
      applyLocal({ headerStyle: mode });
    };

    const slideshowControls = (
      <section className="flex flex-col gap-4">
        <FilePicker
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={busy}
          selectedFiles={galleryFiles}
          icon={<ImageIcon size={20} aria-hidden />}
          labels={{
            title: 'Drop slideshow images here',
            description: 'JPEG, PNG, or WebP · up to 10 images',
            browse: 'Browse images',
          }}
          onFiles={selectGalleryFiles}
        />
        {galleryImageList.length > 0 ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Eyebrow>
                {galleryImageList.length === 1
                  ? 'Single image preview'
                  : `Slideshow · ${galleryImageList.length} images`}
              </Eyebrow>
              <span className="text-foreground-secondary text-xs">
                {galleryPreviewIndex + 1} / {galleryImageList.length}
              </span>
            </div>
            <div className="border-border bg-background relative h-36 overflow-hidden rounded-lg border">
              <img
                src={galleryImageList[galleryPreviewIndex]}
                alt=""
                className="size-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {galleryImageList.map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className="group relative"
                  draggable
                  onDragStart={() => setDraggedGalleryIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggedGalleryIndex !== null) {
                      reorderGalleryImage(draggedGalleryIndex, index);
                    }
                    setDraggedGalleryIndex(null);
                  }}
                  onDragEnd={() => setDraggedGalleryIndex(null)}
                >
                  <button
                    type="button"
                    className={`border-border h-16 w-full overflow-hidden rounded-md border ${index === galleryPreviewIndex ? 'border-primary ring-primary ring-2' : ''}`}
                    aria-label={`Preview slideshow image ${index + 1}`}
                    aria-pressed={index === galleryPreviewIndex}
                    onClick={() => setGalleryPreviewIndex(index)}
                  >
                    <img
                      src={image}
                      alt=""
                      className="size-full object-cover"
                    />
                  </button>
                  <Tooltip
                    content={`Remove slideshow image ${index + 1}`}
                    side="top"
                  >
                    <Button
                      size="icon-sm"
                      variant="secondary"
                      className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                      aria-label={`Remove slideshow image ${index + 1}`}
                      onClick={() => removeGalleryImage(index)}
                    >
                      <Trash2Icon size={14} aria-hidden />
                    </Button>
                  </Tooltip>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-foreground-secondary text-xs">
            Upload images to build the slideshow behind your channel.
          </p>
        )}
        <Select
          label="Gallery style"
          value={galleryMode}
          onValueChange={(value) => {
            setGalleryMode(value as ChannelGalleryMode);
            setDirty(true);
          }}
          options={GALLERY_MODES.map((mode) => ({
            id: mode.id,
            label: mode.label,
          }))}
        />
        {galleryImageList.length > 1 ? (
          <>
            <Select
              label="Transition"
              value={slideshowPreset}
              onValueChange={(value) => {
                setSlideshowPreset(value);
                setDirty(true);
              }}
              options={SLIDESHOW_PRESETS.map(([id, label]) => ({ id, label }))}
            />
            <Slider
              label={`Interval: ${slideshowInterval}s`}
              min={5}
              max={30}
              step={1}
              value={slideshowInterval}
              onValueChange={(value) => {
                setSlideshowInterval(value);
                setDirty(true);
              }}
            />
            <Slider
              label={`Transition speed: ${slideshowTransition}ms`}
              min={300}
              max={1500}
              step={100}
              value={slideshowTransition}
              onValueChange={(value) => {
                setSlideshowTransition(value);
                setDirty(true);
              }}
            />
            <div className="flex items-center justify-between gap-3 text-sm">
              <span>Automatically advance slides</span>
              <Toggle
                label="Automatically advance slides"
                checked={slideshowAutoplay}
                onChange={(checked) => {
                  setSlideshowAutoplay(checked);
                  setDirty(true);
                }}
              />
            </div>
          </>
        ) : null}
      </section>
    );

    const videoUrlInput = videoUrlOpen ? (
      <Input
        label="YouTube, video, or image URL"
        value={videoBackgroundUrl}
        placeholder="https://youtube.com/watch?v=… or https://…/backdrop.jpg"
        onChange={(event) => {
          setVideoBackgroundUrl(event.target.value);
          setPendingVideoFile(null);
          setPendingVideoPreviewUrl(null);
          setDirty(true);
        }}
      />
    ) : null;

    const videoUrlToggle = (
      <Tooltip content="Show URL field" side="top">
        <Button
          size="icon-sm"
          variant="text"
          aria-label="Show URL field"
          aria-pressed={videoUrlOpen}
          onClick={() => setVideoUrlOpen((open) => !open)}
        >
          <LinkIcon size={15} aria-hidden />
        </Button>
      </Tooltip>
    );

    const videoBackdropSlot = (
      <div className="flex flex-col gap-3">
        <div>
          <Eyebrow>Video or image backdrop</Eyebrow>
          <p className="text-foreground-secondary mt-1 text-xs">
            Upload an MP4/WebM video or image, up to 10 MB.
          </p>
        </div>
        <div className="relative">
          <FilePicker
            accept="video/mp4,video/webm,image/jpeg,image/png,image/webp,image/gif"
            disabled={busy}
            selectedFiles={pendingVideoFile ? [pendingVideoFile] : []}
            labels={{
              title: 'Choose a video or image',
              description: 'MP4, WebM, JPEG, PNG, WebP, or GIF · maximum 10 MB',
              browse: 'Browse files',
            }}
            onFiles={selectVideoFile}
          />
          <div className="absolute top-2 right-2">{videoUrlToggle}</div>
        </div>
        {videoUrlInput}
        {(pendingVideoPreviewUrl || videoBackgroundUrl) && (
          <div className="border-border bg-background relative overflow-hidden rounded-lg border">
            {youtubeEmbedUrl(videoBackgroundUrl) && !pendingVideoPreviewUrl ? (
              <iframe
                title="YouTube backdrop preview"
                src={youtubeEmbedUrl(videoBackgroundUrl) ?? undefined}
                className="pointer-events-none aspect-video w-full"
                allow="autoplay; encrypted-media"
              />
            ) : headerBackdropIsImage ? (
              <img
                src={pendingVideoPreviewUrl ?? videoBackgroundUrl}
                alt=""
                className="aspect-video w-full object-cover"
              />
            ) : (
              <video
                src={pendingVideoPreviewUrl ?? videoBackgroundUrl}
                muted
                loop
                autoPlay
                playsInline
                controls
                className="aspect-video w-full object-cover"
              />
            )}
          </div>
        )}
        {(pendingVideoFile || videoBackgroundUrl) && (
          <Button
            size="sm"
            variant="secondary"
            className="self-start"
            onClick={clearVideo}
          >
            Remove backdrop
          </Button>
        )}
      </div>
    );

    const backdropPanel = (
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
            setBackgroundScheme({ ...backgroundScheme, bg });
            setDirty(true);
            return;
          }
          applyLocal({ brandAccentPreset: null }, { ...scheme, bg });
        }}
        onHeaderModeChange={setHeaderDesignMode}
        onRemoveBackdrop={removeBackdrop}
        onSchemeChange={(next) => applyLocal({ brandAccentPreset: null }, next)}
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
          if (useBackgroundGradient && !visual.backgroundColorSchemeJson) {
            setBackgroundScheme(scheme);
          }
          applyLocal({ useBackgroundGradient });
        }}
        onBackgroundSchemeChange={(next) => {
          setBackgroundScheme(next);
          setDirty(true);
        }}
        onBackgroundVisualPreset={(preset) =>
          applyLocal({ backgroundVisualPreset: preset })
        }
        videoSlot={videoBackdropSlot}
        slideshowSlot={slideshowControls}
      />
    );

    const visualizerSlot = (
      <PlayerVisualizerControls
        activeVisualizer={activeVisualizer}
        visualizerEnabled={visualizerEnabled}
        showSettings={showVisualizerSettings}
        tuningSlot={dockTuning ? tuningSliders(visual.visualPreset) : undefined}
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
            setPreviewPreset('MINIMAL');
            applyLocal({ visualPreset: 'MINIMAL' });
          } else {
            setPreviewPreset(activeVisualizer);
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
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <Eyebrow>Stage overlay</Eyebrow>
          <ChannelTextOverlayEditor
            value={{
              mode: visual.playerOverlayMode ?? 'NONE',
              text: visual.playerOverlayText ?? '',
              align: visual.playerOverlayAlign ?? 'CENTER',
            }}
            onChange={(next) =>
              applyLocal({
                playerOverlayMode: next.mode,
                playerOverlayText: next.text,
                playerOverlayAlign: next.align,
              })
            }
          />
          <div
            className="relative flex min-h-24 items-center overflow-hidden rounded-lg border border-white/10 p-4"
            style={{ background: previewStyle.bg }}
          >
            <ChannelTextOverlayView
              mode={visual.playerOverlayMode}
              text={visual.playerOverlayText}
              align={visual.playerOverlayAlign}
              accent={previewStyle.accent}
              highlight={previewStyle.highlight}
              size="sm"
              className="w-full"
            />
            {!visual.playerOverlayText?.trim() && (
              <p className="text-foreground-secondary text-xs">
                Preview — enter text above to see it on the player stage.
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <Eyebrow>Now playing</Eyebrow>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setOverlayConfigOpen(true)}
            >
              <SettingsIcon size={14} aria-hidden />
              Configure text
            </Button>
          </div>
          <p className="text-foreground-secondary text-xs">
            How the title and artist sit over live audio or an archive track.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {NOW_PLAYING_OVERLAY_PRESETS.map((preset) => {
              const active =
                resolveNowPlayingOverlayPreset(
                  visual.nowPlayingOverlayStyle,
                ) === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    applyLocal({ nowPlayingOverlayStyle: preset.id })
                  }
                  className={`flex flex-col gap-2 rounded-lg border p-2 text-left transition-colors ${
                    active
                      ? 'border-primary bg-primary/10 ring-primary ring-1'
                      : 'border-border bg-background hover:bg-background-secondary'
                  }`}
                >
                  <div
                    className="relative flex aspect-video items-end overflow-hidden rounded-md bg-cover bg-center p-2"
                    style={{
                      backgroundColor: '#0B1220',
                      backgroundImage: avatarUrl
                        ? `url(${avatarUrl})`
                        : undefined,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                    <div className="relative w-full">
                      <NowPlayingOverlay
                        presetId={preset.id}
                        title="Sample Track"
                        artist={displayName}
                        artworkUrl={avatarUrl}
                        compact
                        settings={overlaySettings}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      {preset.name}
                      {active && (
                        <CheckIcon
                          size={14}
                          className="text-primary"
                          aria-hidden
                        />
                      )}
                    </div>
                    <p className="text-foreground-secondary text-xs">
                      {preset.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );

    const playerVideoSlot = (
      <div className="relative">
        <FilePicker
          accept="video/mp4,video/webm,image/jpeg,image/png,image/webp,image/gif"
          disabled={busy}
          selectedFiles={pendingVideoFile ? [pendingVideoFile] : []}
          labels={{
            title: 'Choose a video or image',
            description: 'MP4, WebM, JPEG, PNG, WebP, or GIF · maximum 10 MB',
            browse: 'Browse files',
          }}
          onFiles={selectVideoFile}
        />
        <div className="absolute top-2 right-2">{videoUrlToggle}</div>
        {videoUrlInput}
      </div>
    );

    const playerPanel = (
      <PlayerPanel
        tab={playerDesignTab}
        onTabChange={setPlayerDesignTab}
        usePlayerGradient={visual.usePlayerGradient ?? false}
        playerScheme={playerScheme}
        onUsePlayerGradient={(usePlayerGradient) => {
          if (usePlayerGradient && !visual.playerColorSchemeJson) {
            setPlayerScheme(scheme);
          }
          applyLocal({ usePlayerGradient });
        }}
        onPlayerSchemeChange={(next) => {
          setPlayerScheme(next);
          setDirty(true);
        }}
        onPlayerBrandAccent={(brand) => {
          setPlayerScheme({
            ...playerScheme,
            accent: brand.accent,
            highlight: brand.highlight,
          });
          setDirty(true);
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
      if (id === 'backdrop') {
        setHighlightSection('header');
      } else if (id === 'player') {
        setHighlightSection('visualizer');
      } else {
        setHighlightSection(null);
      }
      window.setTimeout(() => {
        setHighlightSection(null);
      }, 1600);
    };

    const lookBlockVisible = (id: ChannelLookElementId) => {
      if (!isArtistLookBlockId(id)) {
        return true;
      }
      return lookVisibility[id] !== false;
    };

    const toggleSelectedLook = (id: ChannelLookElementId) => {
      const meta = CHANNEL_LOOK_ELEMENTS.find((element) => element.id === id);
      if (meta?.layoutType) {
        toggleLayoutType(meta.layoutType);
      }
      if (!isArtistLookBlockId(id)) {
        return;
      }
      const next = {
        ...lookVisibility,
        [id]: !lookBlockVisible(id),
      };
      setLookVisibility(next);
      saveArtistLookVisibility(layoutSlug, next);
      onLookVisibilityChange?.(next);
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
        className={`h-full ${highlightSection ? 'ring-primary ring-2' : ''}`}
      />
    );
    if (lookOnly) {
      return <div className="flex h-full min-h-0 flex-col">{controls}</div>;
    }

    return (
      <>
        <div className={`flex flex-col gap-4 ${compact ? '' : 'w-full'}`}>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <DropdownButton
              label="More"
              items={[
                {
                  id: 'save-preset',
                  label: 'Save preset',
                  icon: <BookmarkPlusIcon size={16} />,
                  onClick: openSavePresetModal,
                },
                {
                  id: 'reset',
                  label: 'Reset',
                  icon: <RotateCcwIcon size={16} />,
                  disabled: !dirty,
                  onClick: () => setResetConfirmOpen(true),
                },
              ]}
            />
            {saveButton}
            {openChannelLink}
          </div>

          {presets.length > 0 && (
            <div className="border-border bg-background-secondary/30 flex flex-wrap items-center gap-2 rounded-lg border p-3">
              <span className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
                Saved looks
              </span>
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="border-border bg-background flex items-center gap-1 rounded-full border py-1 pr-1 pl-3 text-sm"
                >
                  <button
                    type="button"
                    className="hover:text-primary font-semibold"
                    disabled={presetBusy}
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.name}
                  </button>
                  <Tooltip content="Delete preset">
                    <button
                      type="button"
                      aria-label={`Delete "${preset.name}"`}
                      className="text-foreground-secondary hover:text-accent-red rounded-full p-1.5"
                      disabled={presetBusy}
                      onClick={() => setDeletePresetTarget(preset)}
                    >
                      <Trash2Icon size={14} />
                    </button>
                  </Tooltip>
                </div>
              ))}
            </div>
          )}

          {appliedPresetName && (
            <div className="border-primary/40 bg-primary/10 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm">
              <span>
                Applied <strong>&ldquo;{appliedPresetName}&rdquo;</strong>. Keep
                this look, or revert to what was last saved?
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={revertAppliedPreset}
                >
                  Revert
                </Button>
                <Button size="sm" onClick={keepAppliedPreset}>
                  Keep
                </Button>
              </div>
            </div>
          )}

          <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
            <main
              aria-label="Channel page preview"
              className="border-border bg-background min-w-0 overflow-x-hidden overflow-y-auto rounded-xl border shadow-lg lg:max-h-[calc(100vh-7rem)]"
            >
              <div className="border-border bg-background-secondary/40 flex items-center justify-between gap-1.5 border-b px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
                    Live page preview
                  </span>
                  <Tooltip
                    side="bottom"
                    content={
                      <p className="max-w-64 text-xs leading-relaxed">
                        This mirrors the public channel structure. Visitors see
                        your profile header, channel navigation, live stage,
                        tracks, and artist information in this order. Layout
                        blocks are edited from the channel page editor.
                      </p>
                    }
                  >
                    <span
                      tabIndex={0}
                      aria-label="About this preview"
                      className="text-foreground-secondary hover:text-foreground inline-flex size-4 cursor-help items-center justify-center rounded-full border border-current"
                    >
                      <span className="text-[10px] leading-none font-bold">
                        ?
                      </span>
                    </span>
                  </Tooltip>
                </div>
                {openChannelLink}
              </div>
              <ChannelBackdropCard
                minHeightClassName="min-h-[24rem]"
                displayName={displayName}
                username={username}
                channelSlug={channelSlug}
                avatarUrl={avatarUrl}
                bio={bio}
                headerStyle={visual.headerStyle}
                videoBackgroundUrl={previewVideoUrl}
                showVideoOverride={showHeaderVideo}
                isImageOverride={headerBackdropIsImage}
                accent={previewStyle.accent}
                highlight={previewStyle.highlight}
                bg={previewStyle.bg}
                fg={previewStyle.fg}
                gradientOverride={previewStyle.gradient}
                visualPreset={previewPreset}
                colorScheme={scheme}
                artworkUrl={avatarUrl}
                galleryMode={galleryMode}
                slideshowImages={galleryImageList}
                mountVisualizer={hasLivePreview && visualizerEnabled}
                editable
                identitySelected={highlightSection === 'header'}
                backgroundSelected={highlightSection === 'visualizer'}
                onEditIdentity={() => {
                  selectLookElement('backdrop');
                  focusPreviewSection(
                    'header',
                    'channel-designer-section-header',
                  );
                }}
                onEditBackground={() => {
                  selectLookElement('player');
                  focusPreviewSection(
                    'visualizer',
                    'channel-designer-section-player',
                  );
                }}
                badge={
                  <span
                    className="rounded px-2 py-1 text-[10px] font-bold tracking-wide uppercase"
                    style={{
                      background: previewStyle.accent,
                      color: '#0B1220',
                    }}
                  >
                    Artist channel
                  </span>
                }
                bottomSlot={
                  <div className="bg-gradient-to-t from-black/85 via-black/45 to-transparent p-4 pt-16">
                    <div className="text-[10px] font-semibold tracking-wide text-white/70 uppercase">
                      Now playing
                    </div>
                    <div className="mt-1 text-2xl font-extrabold text-white">
                      Your live channel
                    </div>
                    <div className="text-sm text-white/80">
                      A live preview of the artist stage
                    </div>
                  </div>
                }
              />

              <div className="flex flex-col gap-5 p-4 sm:p-6">
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-bold">Tracks</h3>
                    <span className="text-foreground-secondary text-xs">
                      Published on your channel
                    </span>
                  </div>
                  <div className="border-border divide-border divide-y overflow-hidden rounded-lg border">
                    {['Latest release', 'Live session', 'Featured track'].map(
                      (title, index) => (
                        <div
                          key={title}
                          className="flex items-center gap-3 px-3 py-3"
                        >
                          <span className="bg-primary/15 text-primary flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-bold">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold">
                              {title}
                            </div>
                            <div className="text-foreground-secondary text-xs">
                              {displayName}
                            </div>
                          </div>
                          <span className="text-foreground-secondary text-xs">
                            Preview
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </section>
                <section className="border-border rounded-lg border p-4">
                  <h3 className="text-sm font-bold">About {displayName}</h3>
                  <p className="text-foreground-secondary mt-1 line-clamp-2 text-sm">
                    {bio || 'Your artist bio will appear here for visitors.'}
                  </p>
                </section>
              </div>
            </main>

            <section
              aria-label="Channel appearance controls"
              className="min-w-0 lg:sticky lg:top-4"
            >
              {controls}
            </section>
          </div>

          {overlayConfigOpen ? (
            <Dialog.Root
              isOpen
              onClose={() => setOverlayConfigOpen(false)}
              className="max-w-lg"
            >
              <Dialog.Title>Configure text overlay</Dialog.Title>
              <Dialog.Description>
                Fine-tune the now-playing title and artist overlay used on your
                channel.
              </Dialog.Description>
              <div className="flex flex-col gap-4">
                <Slider
                  label={`Text size: ${Math.round(overlaySettings.textScale * 100)}%`}
                  min={0.6}
                  max={1.6}
                  step={0.05}
                  value={overlaySettings.textScale}
                  onValueChange={(value) =>
                    setOverlaySetting('textScale', value)
                  }
                />
                <Slider
                  label={`Horizontal position: ${overlaySettings.offsetX}px`}
                  min={-120}
                  max={120}
                  step={4}
                  value={overlaySettings.offsetX}
                  onValueChange={(value) => setOverlaySetting('offsetX', value)}
                />
                <Slider
                  label={`Vertical position: ${overlaySettings.offsetY}px`}
                  min={-120}
                  max={120}
                  step={4}
                  value={overlaySettings.offsetY}
                  onValueChange={(value) => setOverlaySetting('offsetY', value)}
                />
                <Slider
                  label={`Opacity: ${Math.round(overlaySettings.opacity * 100)}%`}
                  min={0.2}
                  max={1}
                  step={0.05}
                  value={overlaySettings.opacity}
                  onValueChange={(value) => setOverlaySetting('opacity', value)}
                />
              </div>
            </Dialog.Root>
          ) : null}

          {visualizerPickerOpen ? (
            <Dialog.Root
              isOpen
              onClose={() => setVisualizerPickerOpen(false)}
              className="max-w-3xl"
            >
              <Dialog.Title>Choose visualizer</Dialog.Title>
              <Dialog.Description>
                Preview each animated stage and choose the one that fits your
                channel.
              </Dialog.Description>
              <div className="mt-2 grid gap-4 lg:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)]">
                <div className="grid content-start gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  {availableVisualizers.map((preset) => {
                    const meta = visualizerMetadata(preset);
                    const selected = visualizerPickerPreset === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setVisualizerPickerPreset(preset)}
                        className={`border-border flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                          selected
                            ? 'border-primary bg-primary/10'
                            : 'hover:border-primary/50'
                        }`}
                      >
                        <span className="bg-background-secondary relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md">
                          {livePreview ? (
                            <span className="absolute inset-0" aria-hidden>
                              <ChannelVisualizer
                                preset={preset}
                                colorScheme={scheme}
                                visualSettingsJson={JSON.stringify(
                                  visualSettings,
                                )}
                                className="size-full"
                                audioReactive={false}
                              />
                            </span>
                          ) : (
                            <span
                              className="absolute inset-0 animate-pulse"
                              style={{
                                background: `linear-gradient(135deg, ${scheme.highlight ?? '#A78BFA'}, ${scheme.accent ?? '#22D3EE'}, ${scheme.bg ?? '#0B1220'})`,
                              }}
                            />
                          )}
                          <meta.Icon
                            size={16}
                            className="relative z-[1] text-white drop-shadow"
                            aria-hidden
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate text-sm font-semibold">
                              {preset.replace(/_/g, ' ')}
                            </span>
                            {meta.audioReactive ? (
                              <Badge variant="pill" color="blue">
                                Audio reactive
                              </Badge>
                            ) : null}
                          </span>
                          <span className="text-foreground-secondary block truncate text-xs">
                            {meta.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div
                  className="border-border bg-background relative min-h-56 overflow-hidden rounded-xl border"
                  aria-label={`${visualizerPickerPreset.replace(/_/g, ' ')} preview`}
                >
                  {livePreview ? (
                    <ChannelVisualizer
                      className="absolute inset-0 size-full"
                      preset={visualizerPickerPreset}
                      colorScheme={scheme}
                      visualSettingsJson={JSON.stringify(visualSettings)}
                      artworkUrl={avatarUrl}
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{ background: previewStyle.gradient }}
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 pt-16 text-white">
                    <div className="text-xs font-semibold tracking-wide uppercase">
                      Live preview
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-lg font-bold">
                      {visualizerPickerPreset.replace(/_/g, ' ')}
                      {visualizerMetadata(visualizerPickerPreset)
                        .audioReactive ? (
                        <Badge variant="pill" color="blue">
                          Audio reactive
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
              <Dialog.Actions>
                <Dialog.Close>Cancel</Dialog.Close>
                <Button
                  onClick={() => {
                    setPreviewPreset(visualizerPickerPreset);
                    applyLocal({ visualPreset: visualizerPickerPreset });
                    setVisualizerPickerOpen(false);
                  }}
                >
                  Use visualizer
                </Button>
              </Dialog.Actions>
            </Dialog.Root>
          ) : null}
        </div>

        <Dialog.Root
          isOpen={savePresetOpen}
          onClose={() => {
            if (!presetBusy) {
              setSavePresetOpen(false);
            }
          }}
        >
          <Dialog.Title>Save preset</Dialog.Title>
          <Dialog.Description>
            Save the current look under a name so you can switch back to it
            later.
          </Dialog.Description>
          <Input
            label="Preset name"
            value={presetNameInput}
            onChange={(event) => setPresetNameInput(event.target.value)}
            placeholder="e.g. Neon night"
            autoFocus
          />
          <Dialog.Actions>
            <Dialog.Close>Cancel</Dialog.Close>
            <Button
              disabled={presetBusy}
              onClick={() => void confirmSavePreset()}
            >
              Save preset
            </Button>
          </Dialog.Actions>
        </Dialog.Root>

        <Dialog.Root
          isOpen={deletePresetTarget !== null}
          onClose={() => {
            if (!presetBusy) {
              setDeletePresetTarget(null);
            }
          }}
        >
          <Dialog.Title>
            Delete &ldquo;{deletePresetTarget?.name}&rdquo;?
          </Dialog.Title>
          <Dialog.Description>
            This preset will be gone for good. Your current, live look is not
            affected.
          </Dialog.Description>
          <Dialog.Actions>
            <Dialog.Close>Cancel</Dialog.Close>
            <Button
              disabled={presetBusy}
              onClick={() => void confirmDeletePreset()}
            >
              Delete preset
            </Button>
          </Dialog.Actions>
        </Dialog.Root>

        <Dialog.Root
          isOpen={resetConfirmOpen}
          onClose={() => setResetConfirmOpen(false)}
        >
          <Dialog.Title>Reset unsaved changes?</Dialog.Title>
          <Dialog.Description>
            This discards everything you&apos;ve changed since the last save and
            restores your live look. This can&apos;t be undone.
          </Dialog.Description>
          <Dialog.Actions>
            <Dialog.Close>Cancel</Dialog.Close>
            <Button onClick={confirmReset}>Reset</Button>
          </Dialog.Actions>
        </Dialog.Root>
      </>
    );
  },
);
