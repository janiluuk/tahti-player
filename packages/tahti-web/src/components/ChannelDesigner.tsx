import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ImageIcon,
  ImagesIcon,
  LinkIcon,
  Loader2Icon,
  PaletteIcon,
  PlaySquareIcon,
  SaveIcon,
  SettingsIcon,
  Trash2Icon,
  TypeIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  FilePicker,
  Input,
  PluginItem,
  Slider,
  Tabs,
} from '@nuclearplayer/ui';

import {
  BRAND_ACCENTS,
  DEFAULT_COLOR_SCHEME,
  fetchChannelVisual,
  fillColorScheme,
  HEADER_STYLES,
  isValidHeaderVideoUrl,
  isVisualPreset,
  MAX_HEADER_VIDEO_BYTES,
  parseColorScheme,
  parseVisualSettingsMap,
  patchChannelVisual,
  resolveVisualPresetSettings,
  shouldDockVisualizerTuning,
  VISUAL_PRESETS,
  youtubeEmbedUrl,
  type ChannelVisual,
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
import { visualizerMetadata } from '../plugins/visualizers';
import { ChannelControlsWidget } from './ChannelControlsWidget';
import { ChannelVisualizer } from './ChannelVisualizer';
import { PageLoading } from './PageStates';
import { Eyebrow } from './tahti/Eyebrow';

const TAB_IDS = ['visualizer', 'color-scheme', 'header', 'slideshow'] as const;
type TabId = (typeof TAB_IDS)[number];

const PREVIEW_VISUALIZER_HEIGHT_CLASS = 'h-44 sm:h-64';

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
};

export function ChannelDesigner({
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
}: Props) {
  const [visual, setVisual] = useState<ChannelVisual | null>(null);
  const [scheme, setScheme] = useState<ColorScheme>({});
  const [visualSettings, setVisualSettings] = useState<VisualSettingsMap>({});
  const [galleryMode, setGalleryMode] = useState<ChannelGalleryMode>('NONE');
  const [galleryImages, setGalleryImages] = useState('');
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
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
  const [configurationPreset, setConfigurationPreset] =
    useState<VisualPreset | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('visualizer');

  useEffect(() => {
    void Promise.all([fetchChannelVisual(), fetchChannelGallery()]).then(
      ([visualResult, galleryResult]) => {
        setVisual(visualResult.data);
        setScheme(parseColorScheme(visualResult.data.colorSchemeJson));
        setVisualSettings(
          parseVisualSettingsMap(visualResult.data.visualSettingsJson),
        );
        if (
          isVisualPreset(visualResult.data.visualPreset) &&
          visualResult.data.visualPreset !== 'MINIMAL'
        ) {
          setPreviewPreset(visualResult.data.visualPreset);
        } else {
          setPreviewPreset('AURORA');
          setVisual({ ...visualResult.data, visualPreset: 'AURORA' });
          setDirty(true);
        }
        setGalleryMode(galleryResult.data.galleryMode);
        setGalleryImages(galleryResult.data.slideshowImages.join('\n'));
        setVideoBackgroundUrl(galleryResult.data.videoBackgroundUrl ?? '');
        setSlideshowPreset(visualResult.data.slideshowPreset ?? 'FADE');
        setSlideshowInterval(visualResult.data.slideshowIntervalSeconds ?? 8);
        setSlideshowTransition(visualResult.data.slideshowTransitionMs ?? 600);
        setSlideshowAutoplay(visualResult.data.slideshowAutoplay ?? true);
        setDirty(false);
      },
    );
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
      setGalleryPreviewIndex((index) => (index + 1) % galleryImageList.length);
    }, slideshowInterval * 1000);
    return () => window.clearInterval(timer);
  }, [galleryImageList.length, slideshowAutoplay, slideshowInterval]);

  const previewStyle = useMemo(() => {
    const accent = scheme.accent ?? '#22D3EE';
    const highlight = scheme.highlight ?? '#A78BFA';
    const bg = scheme.bg ?? '#0B1220';
    const fg = scheme.text ?? '#F8FAFC';
    const brand = BRAND_ACCENTS.find((b) => b.id === visual?.brandAccentPreset);
    const gradient =
      visual?.headerStyle === 'SOLID'
        ? bg
        : (brand?.gradient ??
          `linear-gradient(135deg, ${highlight}, ${accent}, ${bg})`);
    return { accent, highlight, bg, fg, gradient };
  }, [scheme, visual?.brandAccentPreset, visual?.headerStyle]);

  const applyLocal = (
    next: Partial<ChannelVisual>,
    nextScheme?: ColorScheme,
  ) => {
    setVisual((v) => (v ? { ...v, ...next } : v));
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
      toast.error('Video must be 10 MB or smaller.');
      return;
    }
    if (!['video/mp4', 'video/webm'].includes(file.type)) {
      toast.error('Use an MP4 or WebM video.');
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

  const setPresetSetting = (
    preset: string,
    key: 'speed' | 'intensity',
    value: number,
  ) => {
    // Round away the 0.05-step float drift (e.g. 1 + 0.05*4 -> 1.2000000000000002)
    // before it lands in state and gets displayed/persisted.
    const rounded = Math.round(value * 100) / 100;
    setVisualSettings((current) => ({
      ...current,
      [preset]: {
        ...resolveVisualPresetSettings(current, preset),
        [key]: rounded,
      },
    }));
    setDirty(true);
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
      const upload = await uploadUserMediaFile(pendingVideoFile);
      if (!upload.ok) {
        setBusy(false);
        toast.error(upload.error);
        return;
      }
      savedVideoUrl = upload.data.url;
      setVideoBackgroundUrl(upload.data.url);
      if (pendingVideoPreviewUrl) {
        URL.revokeObjectURL(pendingVideoPreviewUrl);
      }
      setPendingVideoFile(null);
      setPendingVideoPreviewUrl(null);
    }
    const result = await patchChannelVisual({
      visualPreset: visual.visualPreset,
      headerStyle: visual.headerStyle,
      videoBackgroundUrl: savedVideoUrl,
      brandAccentPreset: visual.brandAccentPreset,
      colorScheme: fillColorScheme(scheme),
      visualSettings,
      slideshowPreset,
      slideshowIntervalSeconds: slideshowInterval,
      slideshowTransitionMs: slideshowTransition,
      slideshowAutoplay,
    });
    if (!result.ok) {
      setBusy(false);
      toast.error(result.error);
      return;
    }
    const galleryResult = await patchChannelGallery({
      galleryMode,
      slideshowImages: images,
      videoBackgroundUrl: savedVideoUrl,
    });
    setBusy(false);
    if (!galleryResult.ok) {
      toast.error(galleryResult.error);
      return;
    }
    setVisual(result.data);
    setScheme(parseColorScheme(result.data.colorSchemeJson));
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
    toast.success('Look saved — public channel will pick this up.');
    onSaved?.();
  };

  if (!visual) {
    return <PageLoading label="Loading designer…" />;
  }

  // VIDEO_LOOP without a playable clip isn't a state worth saving — the
  // header would just render empty on the real channel page.
  const videoLoopNeedsUrl =
    visual.headerStyle === 'VIDEO_LOOP' &&
    !pendingVideoFile &&
    !isValidHeaderVideoUrl(videoBackgroundUrl);
  const showHeaderVideo =
    visual.headerStyle === 'VIDEO_LOOP' &&
    isValidHeaderVideoUrl(visual.videoBackgroundUrl);
  const showGalleryBackdrop =
    galleryImageList.length > 0 && galleryMode !== 'NONE' && !showHeaderVideo;

  const availableVisualizers = VISUAL_PRESETS.filter(
    (preset) => preset !== 'MINIMAL',
  );
  const activeVisualizer: Exclude<VisualPreset, 'MINIMAL'> =
    isVisualPreset(previewPreset) && previewPreset !== 'MINIMAL'
      ? previewPreset
      : 'AURORA';

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

  // Shared by the preset-picker card (always) and the per-preset
  // "Configure" dialog opened from the picker's gear icon.
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
    </>
  );

  // Only the full (non-lookOnly) chrome, with a live preview allowed, ever
  // gets a real preview to dock tuning into.
  const hasLivePreview = !lookOnly && livePreview;

  const dockTuning = shouldDockVisualizerTuning({
    preset: previewPreset,
    visualizerEnabled: previewPreset !== 'MINIMAL',
    activeTab,
  });

  const controls = (
    <>
      <ChannelControlsWidget
        sections={[
          {
            id: 'visual-style',
            title: 'Artist backdrop banner',
            description:
              'Choose an animated backdrop, tune it, and preview how your artist channel will look.',
            children: (
              <Tabs
                listClassName="flex-wrap border-border border-b pb-3"
                panelClassName="pt-2"
                selectedIndex={TAB_IDS.indexOf(activeTab)}
                onChange={(index) =>
                  setActiveTab(TAB_IDS[index] ?? 'visualizer')
                }
                items={[
                  {
                    id: 'visualizer',
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <PlaySquareIcon size={14} aria-hidden /> Visualizer
                      </span>
                    ),
                    content: (
                      <section className="flex flex-col gap-4">
                        {(() => {
                          const meta = visualizerMetadata(activeVisualizer);
                          return (
                            <PluginItem
                              icon={<meta.Icon size={22} aria-hidden />}
                              name={activeVisualizer.replace(/_/g, ' ')}
                              author="Visualizer"
                              description={meta.description}
                              labels={{ by: '' }}
                              className="ring-primary bg-primary/10 ring-2 ring-inset"
                              rightAccessory={
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="icon-sm"
                                    variant="text"
                                    onClick={() => changeVisualizer(-1)}
                                    aria-label="Previous visualizer"
                                    title="Previous visualizer"
                                  >
                                    <ChevronLeftIcon size={16} aria-hidden />
                                  </Button>
                                  <Button
                                    size="icon-sm"
                                    variant="text"
                                    onClick={() => changeVisualizer(1)}
                                    aria-label="Next visualizer"
                                    title="Next visualizer"
                                  >
                                    <ChevronRightIcon size={16} aria-hidden />
                                  </Button>
                                  <Button
                                    size="icon-sm"
                                    variant="text"
                                    aria-label={`Configure ${activeVisualizer.replace(/_/g, ' ')}`}
                                    title={`Configure ${activeVisualizer.replace(/_/g, ' ')}`}
                                    onClick={() =>
                                      setConfigurationPreset(activeVisualizer)
                                    }
                                  >
                                    <SettingsIcon size={15} aria-hidden />
                                  </Button>
                                  <Button
                                    size="icon-sm"
                                    disabled
                                    aria-label="Visualizer active"
                                    title="Visualizer active"
                                  >
                                    <CheckIcon size={15} aria-hidden />
                                  </Button>
                                </div>
                              }
                            />
                          );
                        })()}
                        {/* Tuning always sits directly under the preset
                    picker, in this same card — never in the separate
                    preview card above, so switching/tuning a preset and
                    confirming it via Save all happen in one place. */}
                        {dockTuning && (
                          <div className="border-border flex flex-col gap-4 rounded-lg border p-3">
                            <Eyebrow>
                              Tune {visual.visualPreset.replace(/_/g, ' ')}
                            </Eyebrow>
                            {tuningSliders(visual.visualPreset)}
                          </div>
                        )}
                      </section>
                    ),
                  },
                  {
                    id: 'color-scheme',
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <PaletteIcon size={14} aria-hidden /> Color scheme
                      </span>
                    ),
                    content: (
                      <section className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                          <Eyebrow>Brand accent</Eyebrow>
                          <div className="flex flex-wrap gap-2">
                            {BRAND_ACCENTS.map((brand) => (
                              <button
                                key={brand.id}
                                type="button"
                                title={brand.label}
                                aria-label={brand.label}
                                aria-pressed={
                                  visual.brandAccentPreset === brand.id
                                }
                                onClick={() =>
                                  applyLocal(
                                    { brandAccentPreset: brand.id },
                                    {
                                      ...scheme,
                                      accent: brand.accent,
                                      highlight: brand.highlight,
                                    },
                                  )
                                }
                                className={`h-10 w-16 rounded-md border-2 transition-transform hover:scale-105 ${
                                  visual.brandAccentPreset === brand.id
                                    ? 'border-primary shadow-md'
                                    : 'border-transparent'
                                }`}
                                style={{ background: brand.gradient }}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {(
                            [
                              ['accent', 'Accent / waveform played'] as const,
                              ['highlight', 'Highlight'] as const,
                              ['bg', 'Background'] as const,
                              ['text', 'Foreground'] as const,
                              ['muted', 'Muted / waveform unplayed'] as const,
                            ] as const
                          ).map(([key, label]) => (
                            <label
                              key={key}
                              className="border-border bg-background-secondary/40 flex items-center gap-3 rounded-lg border p-3 text-sm"
                            >
                              <input
                                type="color"
                                value={scheme[key] ?? DEFAULT_COLOR_SCHEME[key]}
                                onChange={(event) => {
                                  const next = {
                                    ...scheme,
                                    [key]: event.target.value,
                                  };
                                  applyLocal({}, next);
                                }}
                                className="h-9 w-11 cursor-pointer rounded border-0 bg-transparent"
                              />
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold">
                                  {label}
                                </span>
                                <code className="text-foreground-secondary text-xs">
                                  {scheme[key]}
                                </code>
                              </span>
                            </label>
                          ))}
                        </div>
                      </section>
                    ),
                  },
                  {
                    id: 'header',
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <TypeIcon size={14} aria-hidden /> Header
                      </span>
                    ),
                    content: (
                      <section className="flex flex-col gap-3">
                        <Eyebrow>Header style</Eyebrow>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {HEADER_STYLES.map((headerStyle) => {
                            const active = visual.headerStyle === headerStyle;
                            return (
                              <button
                                key={headerStyle}
                                type="button"
                                aria-pressed={active}
                                onClick={() => applyLocal({ headerStyle })}
                                className={`rounded-lg border p-4 text-left text-sm font-semibold tracking-wide uppercase transition-colors ${
                                  active
                                    ? 'border-primary bg-primary/10 ring-primary ring-1'
                                    : 'border-border bg-background hover:bg-background-secondary text-foreground-secondary hover:text-foreground'
                                }`}
                              >
                                {headerStyle.replace(/_/g, ' ')}
                              </button>
                            );
                          })}
                        </div>
                        {visual.headerStyle === 'SOLID' && (
                          <label className="border-border bg-background-secondary/40 flex items-center gap-3 rounded-lg border p-3 text-sm">
                            <input
                              type="color"
                              value={scheme.bg ?? DEFAULT_COLOR_SCHEME.bg}
                              onChange={(event) =>
                                applyLocal(
                                  {},
                                  {
                                    ...scheme,
                                    bg: event.target.value,
                                  },
                                )
                              }
                              className="h-9 w-11 cursor-pointer rounded border-0 bg-transparent"
                              aria-label="Solid header color"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold">
                                Solid header color
                              </span>
                              <code className="text-foreground-secondary text-xs">
                                {scheme.bg ?? DEFAULT_COLOR_SCHEME.bg}
                              </code>
                            </span>
                          </label>
                        )}
                        {visual.headerStyle === 'VIDEO_LOOP' && (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <Eyebrow>Short video backdrop</Eyebrow>
                                <p className="text-foreground-secondary mt-1 text-xs">
                                  Upload an MP4 or WebM up to 10 MB. It will
                                  loop muted behind your channel header and is
                                  stored in your private R2 storage.
                                </p>
                              </div>
                              <Button
                                size="icon-sm"
                                variant="text"
                                aria-label="Show video URL field"
                                title="Use a video URL"
                                aria-pressed={videoUrlOpen}
                                onClick={() => setVideoUrlOpen((open) => !open)}
                              >
                                <LinkIcon size={15} aria-hidden />
                              </Button>
                            </div>
                            {videoUrlOpen ? (
                              <Input
                                label="YouTube or video URL"
                                value={videoBackgroundUrl}
                                placeholder="https://youtube.com/watch?v=…"
                                onChange={(event) => {
                                  setVideoBackgroundUrl(event.target.value);
                                  setPendingVideoFile(null);
                                  setDirty(true);
                                }}
                              />
                            ) : null}
                            <FilePicker
                              accept="video/mp4,video/webm"
                              disabled={busy}
                              selectedFiles={
                                pendingVideoFile ? [pendingVideoFile] : []
                              }
                              labels={{
                                title: 'Choose a short video',
                                description: 'MP4 or WebM · maximum 10 MB',
                                browse: 'Browse videos',
                              }}
                              onFiles={selectVideoFile}
                            />
                            {(pendingVideoPreviewUrl || videoBackgroundUrl) && (
                              <div className="border-border bg-background relative overflow-hidden rounded-lg border">
                                {youtubeEmbedUrl(videoBackgroundUrl) &&
                                !pendingVideoPreviewUrl ? (
                                  <iframe
                                    title="YouTube backdrop preview"
                                    src={
                                      youtubeEmbedUrl(videoBackgroundUrl) ??
                                      undefined
                                    }
                                    className="pointer-events-none aspect-video max-h-64 w-full"
                                    allow="autoplay; encrypted-media"
                                  />
                                ) : (
                                  <video
                                    key={
                                      pendingVideoPreviewUrl ??
                                      videoBackgroundUrl
                                    }
                                    src={
                                      pendingVideoPreviewUrl ??
                                      videoBackgroundUrl
                                    }
                                    muted
                                    loop
                                    autoPlay
                                    playsInline
                                    controls
                                    className="aspect-video max-h-64 w-full object-cover"
                                  />
                                )}
                                <div className="bg-background/85 text-foreground-secondary absolute inset-x-0 bottom-0 px-3 py-2 text-xs backdrop-blur-sm">
                                  {pendingVideoFile
                                    ? 'Preview — save your channel design to approve and upload it.'
                                    : 'Current uploaded backdrop'}
                                </div>
                              </div>
                            )}
                            {(pendingVideoFile || videoBackgroundUrl) && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="self-start"
                                onClick={clearVideo}
                              >
                                Remove video backdrop
                              </Button>
                            )}
                          </div>
                        )}
                      </section>
                    ),
                  },
                  {
                    id: 'slideshow',
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <ImagesIcon size={14} aria-hidden /> Slideshow
                      </span>
                    ),
                    content: (
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
                                {galleryPreviewIndex + 1} /{' '}
                                {galleryImageList.length}
                              </span>
                            </div>
                            <div className="border-border bg-background relative h-36 overflow-hidden rounded-lg border">
                              <img
                                key={galleryImageList[galleryPreviewIndex]}
                                src={galleryImageList[galleryPreviewIndex]}
                                alt=""
                                className="h-full w-full object-cover transition-all duration-700"
                              />
                              <div className="bg-background/80 text-foreground-secondary absolute inset-x-0 bottom-0 px-3 py-2 text-xs backdrop-blur-sm">
                                {galleryImageList.length === 1
                                  ? 'Preview of the image used behind the artist channel.'
                                  : `Automatic ${slideshowPreset.toLowerCase()} slideshow preview.`}
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                              {galleryImageList.map((image, index) => (
                                <div
                                  key={`${image}-${index}`}
                                  className="relative"
                                >
                                  <button
                                    type="button"
                                    className={`border-border h-16 w-full overflow-hidden rounded-md border ${index === galleryPreviewIndex ? 'border-primary ring-primary ring-2' : ''}`}
                                    aria-label={`Preview slideshow image ${index + 1}`}
                                    aria-pressed={index === galleryPreviewIndex}
                                    onClick={() =>
                                      setGalleryPreviewIndex(index)
                                    }
                                  >
                                    <img
                                      src={image}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  </button>
                                  <Button
                                    size="icon-sm"
                                    variant="secondary"
                                    className="absolute top-1 right-1"
                                    aria-label={`Remove slideshow image ${index + 1}`}
                                    title="Remove image"
                                    onClick={() => removeGalleryImage(index)}
                                  >
                                    <Trash2Icon size={14} aria-hidden />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-foreground-secondary text-xs">
                            Upload images to build the slideshow behind your
                            channel.
                          </p>
                        )}
                        <label className="flex flex-col gap-1 text-sm">
                          <span className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
                            Gallery style
                          </span>
                          <select
                            value={galleryMode}
                            onChange={(event) => {
                              setGalleryMode(
                                event.target.value as ChannelGalleryMode,
                              );
                              setDirty(true);
                            }}
                            className="border-border bg-background text-foreground rounded-md border px-3 py-2"
                          >
                            {GALLERY_MODES.map((mode) => (
                              <option key={mode.id} value={mode.id}>
                                {mode.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <p className="text-foreground-secondary text-xs">
                          Video backdrops are managed in Header → Video loop.
                          Uploaded images use your artist media storage and can
                          also be reused in your public gallery.
                        </p>
                        {galleryImageList.length === 1 ? (
                          <div className="border-border flex flex-col gap-2 rounded-lg border p-3">
                            <Eyebrow>Single image effect</Eyebrow>
                            <p className="text-foreground-secondary text-xs">
                              Try an effect designed for one persistent artist
                              backdrop.
                            </p>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {GALLERY_MODES.filter(
                                (mode) => mode.id !== 'STATIC_SLIDESHOW',
                              ).map((mode) => {
                                const active = galleryMode === mode.id;
                                return (
                                  <button
                                    key={mode.id}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => {
                                      setGalleryMode(mode.id);
                                      setDirty(true);
                                    }}
                                    className={`border-border rounded-md border px-3 py-2 text-left text-xs font-semibold ${active ? 'border-primary bg-primary/10' : 'hover:border-primary/50'}`}
                                  >
                                    {mode.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                        {galleryImageList.length > 1 ? (
                          <div className="flex flex-col gap-4">
                            <label className="flex flex-col gap-1 text-sm">
                              <span className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
                                Transition
                              </span>
                              <select
                                value={slideshowPreset}
                                onChange={(event) => {
                                  setSlideshowPreset(event.target.value);
                                  setDirty(true);
                                }}
                                className="border-border bg-background text-foreground rounded-md border px-3 py-2"
                              >
                                {SLIDESHOW_PRESETS.map(([id, label]) => (
                                  <option key={id} value={id}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </label>
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
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={slideshowAutoplay}
                                onChange={(event) => {
                                  setSlideshowAutoplay(event.target.checked);
                                  setDirty(true);
                                }}
                              />
                              Automatically advance slides
                            </label>
                          </div>
                        ) : null}
                      </section>
                    ),
                  },
                ]}
              />
            ),
          },
        ]}
      />

      <div className="border-border flex flex-wrap items-center gap-3 border-t pt-4">
        <Button
          size="icon"
          variant="secondary"
          disabled={busy || !dirty || videoLoopNeedsUrl}
          aria-label={
            busy ? 'Saving look…' : dirty ? 'Save look' : 'Look saved'
          }
          title={
            videoLoopNeedsUrl
              ? 'Add a valid video URL to save'
              : busy
                ? 'Saving…'
                : dirty
                  ? 'Save look'
                  : 'Saved'
          }
          onClick={() => void save()}
        >
          {busy ? (
            <Loader2Icon size={16} className="animate-spin" aria-hidden />
          ) : dirty ? (
            <SaveIcon size={16} aria-hidden />
          ) : (
            <CheckIcon size={16} aria-hidden />
          )}
        </Button>
      </div>
    </>
  );

  if (lookOnly) {
    return <div className="flex flex-col gap-3">{controls}</div>;
  }

  return (
    <div className={`flex flex-col gap-4 ${compact ? '' : 'max-w-3xl'}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight">
            Artist channel preview
          </h2>
          <p className="text-foreground-secondary text-xs">
            Prefer editing on the live channel page — open your channel and hit
            Edit design.
          </p>
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-xl border border-white/10 p-5 shadow-lg"
        style={{
          background: showHeaderVideo ? previewStyle.bg : previewStyle.gradient,
          color: previewStyle.fg,
        }}
      >
        {showHeaderVideo && (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={visual.videoBackgroundUrl ?? undefined}
            autoPlay
            loop
            muted
            playsInline
            aria-hidden="true"
          />
        )}
        {showGalleryBackdrop && (
          <img
            src={galleryImageList[galleryPreviewIndex]}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-45 transition-opacity duration-700"
          />
        )}
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: previewStyle.bg }}
        />
        <div className="relative flex flex-wrap items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 text-lg font-bold"
            style={{
              borderColor: previewStyle.accent,
              background: previewStyle.bg,
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              displayName.slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-2xl font-extrabold tracking-tight">
              {displayName}
            </div>
            <div className="text-sm opacity-80">
              @{username}
              {channelSlug ? ` · /${channelSlug}` : ''}
            </div>
            {bio && (
              <p className="mt-1 line-clamp-2 text-sm opacity-90">{bio}</p>
            )}
          </div>
          <span
            className="rounded px-2 py-1 text-[10px] font-bold tracking-wide uppercase"
            style={{ background: previewStyle.accent, color: '#0B1220' }}
          >
            {visual.visualPreset.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="relative mt-4 flex flex-col overflow-hidden rounded-lg">
          <div
            className={`relative overflow-hidden ${PREVIEW_VISUALIZER_HEIGHT_CLASS}`}
          >
            {hasLivePreview && previewPreset !== 'MINIMAL' ? (
              <ChannelVisualizer
                className="absolute inset-0 h-full w-full"
                preset={previewPreset}
                colorScheme={scheme}
                visualSettingsJson={JSON.stringify(visualSettings)}
                artworkUrl={avatarUrl}
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{ background: previewStyle.bg }}
              />
            )}
          </div>
          <div className="bg-background relative border-t border-white/10 p-3">
            {controls}
          </div>
        </div>
      </div>

      {configurationPreset ? (
        <Dialog.Root
          isOpen
          onClose={() => setConfigurationPreset(null)}
          className="max-w-lg"
        >
          <Dialog.Title>
            Configure {configurationPreset.replace(/_/g, ' ')} backdrop
          </Dialog.Title>
          <Dialog.Description>
            Adjust the artist channel backdrop while the selected animated
            preview remains visible behind this dialog.
          </Dialog.Description>
          <div className="flex flex-col gap-4">
            {tuningSliders(configurationPreset)}
          </div>
        </Dialog.Root>
      ) : null}
    </div>
  );
}
