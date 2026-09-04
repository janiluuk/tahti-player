import type { FetchMeta } from './client';
import { allowMockFallback, apiErrorMeta, failMeta, isForceMock } from './mode';

const forceMock = isForceMock;

const apiBase = () => {
  if (import.meta.env.VITE_TAHTI_API_URL?.startsWith('http')) {
    return import.meta.env.VITE_TAHTI_API_URL.replace(/\/$/, '');
  }
  return '/tahti-api';
};

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; status: number }> {
  const { headers: initHeaders, ...rest } = init ?? {};
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...initHeaders,
    },
  });
  if (!res.ok) {
    let detail = `${path} → ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      if (body.error || body.message) {
        detail = body.error ?? body.message ?? detail;
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  if (res.status === 204) {
    return { data: undefined as T, status: res.status };
  }
  return { data: (await res.json()) as T, status: res.status };
}

export const VISUAL_PRESETS = [
  'MINIMAL',
  'WATER_RIPPLE',
  'WAVEFORM_BARS',
  'PARTICLE_FIELD',
  'AURORA',
  'REACTIVE_GRID',
  'CLOUDSCAPE',
  'LINE_TANGLE',
  'BACKDROP_BOX',
  'LENS_FLARES',
  'IES_SPOTLIGHT',
  'INTERACTIVE_POINTS',
  'FAT_LINES',
  'VIDEO_KINECT',
  'BACKDROP_AREA',
  'COLOR_INSTANCES',
] as const;

export type VisualPreset = (typeof VISUAL_PRESETS)[number];

export const isVisualPreset = (value: string): value is VisualPreset =>
  (VISUAL_PRESETS as readonly string[]).includes(value);

export const PUBLIC_FALLBACK_VISUAL_PRESET: VisualPreset = 'AURORA';

export function resolvePublicVisualizerPreset(
  preset: string | null | undefined,
): string {
  return !preset || preset === 'MINIMAL'
    ? PUBLIC_FALLBACK_VISUAL_PRESET
    : preset;
}

/** Channel-background visualizer widgets (Backdrop tab) — distinct from the
 * full header/player preset list. */
export const BACKGROUND_VISUAL_PRESETS = [
  'INTERACTIVE_POINTS',
  'FAT_LINES',
  'VIDEO_KINECT',
  'BACKDROP_AREA',
] as const;

export type BackgroundVisualPreset = (typeof BACKGROUND_VISUAL_PRESETS)[number];

export const isBackgroundVisualPreset = (
  value: string,
): value is BackgroundVisualPreset =>
  (BACKGROUND_VISUAL_PRESETS as readonly string[]).includes(value);

export const HEADER_STYLES = ['GRADIENT', 'SOLID', 'VIDEO_LOOP'] as const;
export type HeaderStyle = (typeof HEADER_STYLES)[number];

/** Direct video files and YouTube watch links supported by the VIDEO_LOOP
 * header. YouTube links are rendered as muted looped iframe embeds. */
const HEADER_VIDEO_URL_PATTERN = /^https:\/\/\S+\.(mp4|webm)(\?\S*)?$/i;

/** VIDEO_LOOP's `videoBackgroundUrl` column is deliberately generic (see the
 * backend schema comment: "YouTube/Vimeo or image URL for channel backdrop")
 * — a static image is a valid backdrop through the same field, not a
 * separate header style. */
const HEADER_IMAGE_URL_PATTERN =
  /^https:\/\/\S+\.(jpe?g|png|webp|gif)(\?\S*)?$/i;

export function isHeaderImageUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }
  return HEADER_IMAGE_URL_PATTERN.test(url.trim());
}

export function youtubeEmbedUrl(
  url: string | null | undefined,
  muted = true,
): string | null {
  if (!url) {
    return null;
  }
  try {
    const parsed = new URL(url.trim());
    let videoId = '';
    if (parsed.hostname === 'youtu.be') {
      videoId = parsed.pathname.slice(1);
    } else if (
      parsed.hostname === 'youtube.com' ||
      parsed.hostname === 'www.youtube.com' ||
      parsed.hostname === 'm.youtube.com'
    ) {
      videoId = parsed.searchParams.get('v') ?? '';
      if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/')[2] ?? videoId;
      }
    }
    return /^[\w-]{11}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${videoId}&controls=0&rel=0`
      : null;
  } catch {
    return null;
  }
}

export function isValidHeaderVideoUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }
  return (
    HEADER_VIDEO_URL_PATTERN.test(url.trim()) || youtubeEmbedUrl(url) !== null
  );
}

/** Whether the VIDEO_LOOP header has *some* valid backdrop — a video source
 * or a static image, both stored in the same `videoBackgroundUrl` field. */
export function isValidHeaderBackdropUrl(
  url: string | null | undefined,
): boolean {
  return isValidHeaderVideoUrl(url) || isHeaderImageUrl(url);
}

export const MAX_HEADER_VIDEO_BYTES = 10 * 1024 * 1024;

const HEADER_BACKDROP_UPLOAD_TYPES = [
  'video/mp4',
  'video/webm',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export async function uploadChannelHeaderVideo(
  file: File,
): Promise<
  { ok: true; videoBackgroundUrl: string } | { ok: false; error: string }
> {
  if (file.size > MAX_HEADER_VIDEO_BYTES) {
    return { ok: false, error: 'File must be 10 MB or smaller.' };
  }
  if (!HEADER_BACKDROP_UPLOAD_TYPES.includes(file.type)) {
    return {
      ok: false,
      error: 'Use an MP4/WebM video or a JPEG/PNG/WebP/GIF image.',
    };
  }
  if (forceMock()) {
    return { ok: true, videoBackgroundUrl: URL.createObjectURL(file) };
  }
  try {
    const { data: prepared } = await requestJson<{
      uploadKey: string;
      uploadUrl: string;
    }>('/api/me/channel/video-background/prepare', {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        fileSizeBytes: file.size,
      }),
    });
    const upload = await fetch(prepared.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
    if (!upload.ok) {
      throw new Error(`Video upload failed (${upload.status})`);
    }
    const { data } = await requestJson<{ videoBackgroundUrl: string }>(
      '/api/me/channel/video-background/complete',
      {
        method: 'POST',
        body: JSON.stringify({ uploadKey: prepared.uploadKey }),
      },
    );
    return { ok: true, videoBackgroundUrl: data.videoBackgroundUrl };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Video upload failed',
    };
  }
}

export const BRAND_ACCENTS = [
  {
    id: 'aurora',
    label: 'Aurora',
    accent: '#22D3EE',
    highlight: '#A78BFA',
    gradient: 'linear-gradient(135deg,#A78BFA,#22D3EE,#3FE07A)',
  },
  {
    id: 'ember',
    label: 'Ember',
    accent: '#F97316',
    highlight: '#FBBF24',
    gradient: 'linear-gradient(135deg,#F97316,#FBBF24,#EF4444)',
  },
  {
    id: 'noir',
    label: 'Noir',
    accent: '#94A3B8',
    highlight: '#E2E8F0',
    gradient: 'linear-gradient(135deg,#0F172A,#334155,#94A3B8)',
  },
  {
    id: 'violet',
    label: 'Violet',
    accent: '#A855F7',
    highlight: '#EC4899',
    gradient: 'linear-gradient(135deg,#7C3AED,#A855F7,#EC4899)',
  },
  {
    id: 'tahti',
    label: 'Tahti',
    accent: '#FFB020',
    highlight: '#35D6C4',
    gradient: 'linear-gradient(135deg,#0A0E1A,#FFB020,#35D6C4)',
  },
  {
    id: 'rose-night',
    label: 'Rose night',
    accent: '#FB7185',
    highlight: '#F0ABFC',
    gradient: 'linear-gradient(135deg,#4C1D4F,#FB7185,#F0ABFC)',
  },
] as const;

/** Keys must match the backend's ColorSchemeSchema exactly (bg/accent/text/
 * muted/highlight, all 6-digit hex) -- when a colorScheme is included in a
 * PATCH at all, every key is required, so callers must fill defaults for
 * anything the user hasn't touched before sending (see save() below). */
export type ColorScheme = {
  accent?: string;
  highlight?: string;
  bg?: string;
  text?: string;
  muted?: string;
};

/** Accepts legacy `background`/`foreground` from older presets/mocks. */
export type LooseColorSchemeInput = ColorScheme & {
  background?: string;
  foreground?: string;
};

export const DEFAULT_COLOR_SCHEME: Required<ColorScheme> = {
  accent: '#22D3EE',
  highlight: '#A78BFA',
  bg: '#0B1220',
  text: '#F8FAFC',
  muted: '#64748B',
};

/** Fills every key with a default so the object always satisfies the
 * backend's all-required ColorSchemeSchema before it's sent in a PATCH.
 * Accepts legacy `background`/`foreground` aliases from older presets. */
export function fillColorScheme(
  scheme: LooseColorSchemeInput,
): Required<ColorScheme> {
  return {
    accent: scheme.accent ?? DEFAULT_COLOR_SCHEME.accent,
    highlight: scheme.highlight ?? DEFAULT_COLOR_SCHEME.highlight,
    bg: scheme.bg ?? scheme.background ?? DEFAULT_COLOR_SCHEME.bg,
    text: scheme.text ?? scheme.foreground ?? DEFAULT_COLOR_SCHEME.text,
    muted: scheme.muted ?? DEFAULT_COLOR_SCHEME.muted,
  };
}

export type ChannelVisual = {
  visualPreset: VisualPreset | string;
  colorSchemeJson: string | null;
  visualSettingsJson?: string | null;
  headerStyle: HeaderStyle | string;
  /** Reused from the backend's Channel.videoBackgroundUrl column — plays as
   * the VIDEO_LOOP header style. Supports direct .mp4/.webm and YouTube links. */
  videoBackgroundUrl?: string | null;
  brandAccentPreset: string | null;
  slideshowPreset?: string | null;
  slideshowIntervalSeconds?: number;
  slideshowTransitionMs?: number;
  slideshowAutoplay?: boolean;
  /** Layout preset for the now-playing title/artist overlay — see
   * content/nowPlayingOverlayPresets.ts. Client-only for now: there's no
   * matching Channel column on the real API yet (PATCH silently strips
   * unknown keys, so this round-trips fully under VITE_FORCE_MOCK but does
   * not yet persist against the live backend). */
  nowPlayingOverlayStyle?: string | null;
  nowPlayingOverlaySettingsJson?: string | null;
  /** Off by default — the player stage reuses the header's color scheme
   * above. When on, `playerColorSchemeJson` colors the player/visualizer
   * independently. Client-only for now, same caveat as the now-playing
   * overlay fields above: it round-trips under VITE_FORCE_MOCK but has no
   * matching column on the real API yet. */
  usePlayerGradient?: boolean;
  playerColorSchemeJson?: string | null;
  /** Channel background designer — a third surface alongside the header and
   * player, restricted to the audio-reactive "channel background" visualizer
   * widgets (see plugins/visualizers/presets/{interactivePoints,fatLines,
   * videoKinect,backdropArea}.ts). Shares the header's video/image backdrop
   * the same way Player design's Video/image tab does — only the gradient
   * and visualizer pick are independent. Client-only for now, same caveat
   * as the player-gradient fields above. */
  backgroundVisualPreset?: string | null;
  useBackgroundGradient?: boolean;
  backgroundColorSchemeJson?: string | null;
  /** Outbound social/link buttons shown in the channel page's Links block.
   * Client-only for now, same caveat as the other fields above: it
   * round-trips under VITE_FORCE_MOCK but has no matching column on the
   * real API yet. */
  channelLinks?: ChannelLink[] | null;
  /** Stylized headline shown in the channel page's Text overlay block.
   * Client-only for now, same caveat as above. */
  textOverlayMode?: TextOverlayMode | string | null;
  textOverlayText?: string | null;
  textOverlayAlign?: TextOverlayAlign | string | null;
  /** Same headline treatment, but for the standalone overlay shown inside
   * the player stage itself (Player design → Overlay tab) rather than the
   * channel page's separate Text overlay block. Client-only for now, same
   * caveat as above. */
  playerOverlayMode?: TextOverlayMode | string | null;
  playerOverlayText?: string | null;
  playerOverlayAlign?: TextOverlayAlign | string | null;
};

export type ChannelLink = { label: string; url: string };

export const TEXT_OVERLAY_MODES = [
  'NONE',
  'GRADIENT_SHIMMER',
  'COSMIC_NEON',
  'SHIMMER_LINES',
  'GHOST_ECHO',
] as const;
export type TextOverlayMode = (typeof TEXT_OVERLAY_MODES)[number];

export const TEXT_OVERLAY_MODE_LABELS: Record<TextOverlayMode, string> = {
  NONE: 'None',
  GRADIENT_SHIMMER: 'Gradient shimmer',
  COSMIC_NEON: 'Cosmic neon',
  SHIMMER_LINES: 'Shimmer lines',
  GHOST_ECHO: 'Ghost echo',
};

export const TEXT_OVERLAY_ALIGNMENTS = ['LEFT', 'CENTER', 'RIGHT'] as const;
export type TextOverlayAlign = (typeof TEXT_OVERLAY_ALIGNMENTS)[number];

export const TEXT_OVERLAY_ALIGN_LABELS: Record<TextOverlayAlign, string> = {
  LEFT: 'Left',
  CENTER: 'Center',
  RIGHT: 'Right',
};

export function isActiveTextOverlay(overlay: {
  mode?: string | null;
  text?: string | null;
}): boolean {
  return Boolean(
    overlay.mode && overlay.mode !== 'NONE' && overlay.text?.trim(),
  );
}

/** Per-preset speed/intensity/scale (clamped 0.25–2, scale 0.5–2) plus an
 * audio-reactivity toggle — matches the backend's VisualPresetSettingsSchema
 * in packages/shared. */
export type VisualPresetSettings = {
  speed: number;
  intensity: number;
  scale: number;
  audioReactive: boolean;
};
export type VisualSettingsMap = Record<string, Partial<VisualPresetSettings>>;

export const DEFAULT_VISUAL_PRESET_SETTINGS: VisualPresetSettings = {
  speed: 1,
  intensity: 1,
  scale: 1,
  audioReactive: true,
};

export function parseVisualSettingsMap(
  json: string | null | undefined,
): VisualSettingsMap {
  if (!json) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(json);
    return parsed && typeof parsed === 'object'
      ? (parsed as VisualSettingsMap)
      : {};
  } catch {
    return {};
  }
}

export function resolveVisualPresetSettings(
  map: VisualSettingsMap,
  preset: string,
): VisualPresetSettings {
  const entry = map[preset];
  return {
    speed: entry?.speed ?? DEFAULT_VISUAL_PRESET_SETTINGS.speed,
    intensity: entry?.intensity ?? DEFAULT_VISUAL_PRESET_SETTINGS.intensity,
    scale: entry?.scale ?? DEFAULT_VISUAL_PRESET_SETTINGS.scale,
    audioReactive:
      entry?.audioReactive ?? DEFAULT_VISUAL_PRESET_SETTINGS.audioReactive,
  };
}

/** Governs whether the speed/intensity tuning sliders should sit under
 * the live visualizer in the same preset card: only while the Visualizer
 * tab is showing, the visualizer is on, and the current preset is a real
 * (non-MINIMAL) preset with tunable settings. Shared by ChannelDesigner's
 * preview card and its lookOnly inline fallback so both agree. */
export function shouldDockVisualizerTuning(params: {
  preset: string;
  visualizerEnabled: boolean;
  activeTab: string;
}): boolean {
  return (
    params.visualizerEnabled &&
    params.activeTab === 'visualizer' &&
    isVisualPreset(params.preset) &&
    params.preset !== 'MINIMAL'
  );
}

let mockVisual: ChannelVisual = {
  visualPreset: 'AURORA',
  colorSchemeJson: JSON.stringify({
    accent: '#22D3EE',
    highlight: '#A78BFA',
    bg: '#0B1220',
    text: '#F8FAFC',
    muted: '#64748B',
  }),
  headerStyle: 'GRADIENT',
  videoBackgroundUrl: null,
  brandAccentPreset: 'aurora',
  slideshowPreset: 'FADE',
  slideshowIntervalSeconds: 8,
  slideshowTransitionMs: 600,
  slideshowAutoplay: true,
  nowPlayingOverlayStyle: 'classic',
  nowPlayingOverlaySettingsJson: null,
  usePlayerGradient: false,
  playerColorSchemeJson: null,
  backgroundVisualPreset: 'INTERACTIVE_POINTS',
  useBackgroundGradient: false,
  backgroundColorSchemeJson: null,
  channelLinks: [],
  textOverlayMode: 'NONE',
  textOverlayText: '',
  textOverlayAlign: 'CENTER',
  playerOverlayMode: 'NONE',
  playerOverlayText: '',
  playerOverlayAlign: 'CENTER',
};

/** Read-only peek at the mock design state — used by mockChannel() (in
 * api/mock.ts) so a channel's PUBLIC page reflects the owner's saved
 * now-playing overlay choice under VITE_FORCE_MOCK, the same way it would
 * once a real Channel.nowPlayingOverlayStyle column exists. */
export function getMockNowPlayingOverlayStyle(): string | null | undefined {
  return mockVisual.nowPlayingOverlayStyle;
}

export function getMockNowPlayingOverlaySettingsJson():
  | string
  | null
  | undefined {
  return mockVisual.nowPlayingOverlaySettingsJson;
}

/** Same "wired to the artist's saved Channel Designer pick under
 * VITE_FORCE_MOCK" pattern as the now-playing getters above. */
export function getMockUsePlayerGradient(): boolean | undefined {
  return mockVisual.usePlayerGradient;
}

export function getMockPlayerColorSchemeJson(): string | null | undefined {
  return mockVisual.playerColorSchemeJson;
}

export function getMockBackgroundVisualPreset(): string | null | undefined {
  return mockVisual.backgroundVisualPreset;
}

export function getMockUseBackgroundGradient(): boolean | undefined {
  return mockVisual.useBackgroundGradient;
}

export function getMockBackgroundColorSchemeJson(): string | null | undefined {
  return mockVisual.backgroundColorSchemeJson;
}

export function getMockVisualPreset(): string {
  return mockVisual.visualPreset;
}

export function getMockHeaderStyle(): string {
  return mockVisual.headerStyle;
}

export function getMockVideoBackgroundUrl(): string | null {
  return mockVisual.videoBackgroundUrl ?? null;
}

export function getMockChannelColorScheme(): Required<ColorScheme> {
  return fillColorScheme(parseColorScheme(mockVisual.colorSchemeJson));
}

export function getMockBrandAccentPreset(): string | null {
  return mockVisual.brandAccentPreset ?? null;
}

export function getMockVisualSettingsJson(): string | null {
  return mockVisual.visualSettingsJson ?? null;
}

export function getMockChannelLinks(): ChannelLink[] {
  return mockVisual.channelLinks ?? [];
}

export function getMockTextOverlay(): {
  mode: string | null | undefined;
  text: string | null | undefined;
  align: string | null | undefined;
} {
  return {
    mode: mockVisual.textOverlayMode,
    text: mockVisual.textOverlayText,
    align: mockVisual.textOverlayAlign,
  };
}

export function getMockPlayerOverlay(): {
  mode: string | null | undefined;
  text: string | null | undefined;
  align: string | null | undefined;
} {
  return {
    mode: mockVisual.playerOverlayMode,
    text: mockVisual.playerOverlayText,
    align: mockVisual.playerOverlayAlign,
  };
}

export function parseColorScheme(json: string | null | undefined): ColorScheme {
  if (!json) {
    return { ...DEFAULT_COLOR_SCHEME };
  }
  try {
    return JSON.parse(json) as ColorScheme;
  } catch {
    return { ...DEFAULT_COLOR_SCHEME };
  }
}

export async function fetchChannelVisual(): Promise<{
  data: ChannelVisual;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: { ...mockVisual },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ChannelVisual>('/api/me/channel/visual');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: { ...mockVisual }, meta: failMeta(err) };
    }
    return {
      data: {
        visualPreset: 'MINIMAL',
        colorSchemeJson: JSON.stringify(DEFAULT_COLOR_SCHEME),
        headerStyle: 'GRADIENT',
        videoBackgroundUrl: null,
        brandAccentPreset: null,
        slideshowPreset: 'FADE',
        slideshowIntervalSeconds: 8,
        slideshowTransitionMs: 600,
        slideshowAutoplay: true,
        nowPlayingOverlayStyle: 'classic',
        nowPlayingOverlaySettingsJson: null,
        usePlayerGradient: false,
        playerColorSchemeJson: null,
        backgroundVisualPreset: 'INTERACTIVE_POINTS',
        useBackgroundGradient: false,
        backgroundColorSchemeJson: null,
        channelLinks: [],
        textOverlayMode: 'NONE',
        textOverlayText: '',
        textOverlayAlign: 'CENTER',
        playerOverlayMode: 'NONE',
        playerOverlayText: '',
        playerOverlayAlign: 'CENTER',
      },
      meta: apiErrorMeta(err),
    };
  }
}

/** Everything the Channel Designer's "Look" writes in one PATCH — also the
 * shape a saved `ChannelVisualPreset.settings` snapshot replays wholesale. */
export type ChannelVisualPatch = {
  visualPreset?: string;
  colorScheme?: ColorScheme | null;
  visualSettings?: VisualSettingsMap | null;
  headerStyle?: string;
  videoBackgroundUrl?: string | null;
  brandAccentPreset?: string | null;
  slideshowPreset?: string;
  slideshowIntervalSeconds?: number;
  slideshowTransitionMs?: number;
  slideshowAutoplay?: boolean;
  topBarText?: string | null;
  nowPlayingOverlayStyle?: string;
  nowPlayingOverlaySettingsJson?: string | null;
  usePlayerGradient?: boolean;
  playerColorSchemeJson?: string | null;
  backgroundVisualPreset?: string | null;
  useBackgroundGradient?: boolean;
  backgroundColorSchemeJson?: string | null;
  channelLinks?: ChannelLink[] | null;
  textOverlayMode?: string;
  textOverlayText?: string;
  textOverlayAlign?: string;
  playerOverlayMode?: string;
  playerOverlayText?: string;
  playerOverlayAlign?: string;
};

export const CHANNEL_VISUAL_API_PATCH_KEYS = [
  'visualPreset',
  'colorScheme',
  'visualSettings',
  'headerStyle',
  'videoBackgroundUrl',
  'brandAccentPreset',
  'slideshowPreset',
  'slideshowIntervalSeconds',
  'slideshowTransitionMs',
  'slideshowAutoplay',
  'topBarText',
] as const;

export type ChannelVisualApiPatch = Pick<
  ChannelVisualPatch,
  (typeof CHANNEL_VISUAL_API_PATCH_KEYS)[number]
>;

export function toChannelVisualApiPatch(
  patch: ChannelVisualPatch,
): ChannelVisualApiPatch {
  const next: ChannelVisualApiPatch = {};
  for (const key of CHANNEL_VISUAL_API_PATCH_KEYS) {
    const value = patch[key];
    if (value !== undefined) {
      (next as Record<string, unknown>)[key] = value;
    }
  }
  return next;
}

type ChannelLookExtras = Pick<
  ChannelVisualPatch,
  | 'nowPlayingOverlayStyle'
  | 'nowPlayingOverlaySettingsJson'
  | 'usePlayerGradient'
  | 'playerColorSchemeJson'
  | 'backgroundVisualPreset'
  | 'useBackgroundGradient'
  | 'backgroundColorSchemeJson'
  | 'channelLinks'
  | 'textOverlayMode'
  | 'textOverlayText'
  | 'textOverlayAlign'
  | 'playerOverlayMode'
  | 'playerOverlayText'
  | 'playerOverlayAlign'
>;

function lookExtrasStorageKey(slug: string) {
  return `tahti.channelLookExtras.${slug}`;
}

export function loadChannelLookExtras(slug: string): ChannelLookExtras {
  if (!slug) {
    return {};
  }
  try {
    const raw = localStorage.getItem(lookExtrasStorageKey(slug));
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as ChannelLookExtras;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveChannelLookExtras(
  slug: string,
  extras: ChannelLookExtras,
): void {
  if (!slug) {
    return;
  }
  const current = loadChannelLookExtras(slug);
  localStorage.setItem(
    lookExtrasStorageKey(slug),
    JSON.stringify({ ...current, ...extras }),
  );
}

export function channelLookExtrasFromPatch(
  patch: ChannelVisualPatch,
): ChannelLookExtras {
  return {
    ...(patch.nowPlayingOverlayStyle !== undefined
      ? { nowPlayingOverlayStyle: patch.nowPlayingOverlayStyle }
      : {}),
    ...(patch.nowPlayingOverlaySettingsJson !== undefined
      ? { nowPlayingOverlaySettingsJson: patch.nowPlayingOverlaySettingsJson }
      : {}),
    ...(patch.usePlayerGradient !== undefined
      ? { usePlayerGradient: patch.usePlayerGradient }
      : {}),
    ...(patch.playerColorSchemeJson !== undefined
      ? { playerColorSchemeJson: patch.playerColorSchemeJson }
      : {}),
    ...(patch.backgroundVisualPreset !== undefined
      ? { backgroundVisualPreset: patch.backgroundVisualPreset }
      : {}),
    ...(patch.useBackgroundGradient !== undefined
      ? { useBackgroundGradient: patch.useBackgroundGradient }
      : {}),
    ...(patch.backgroundColorSchemeJson !== undefined
      ? { backgroundColorSchemeJson: patch.backgroundColorSchemeJson }
      : {}),
    ...(patch.channelLinks !== undefined
      ? { channelLinks: patch.channelLinks }
      : {}),
    ...(patch.textOverlayMode !== undefined
      ? { textOverlayMode: patch.textOverlayMode }
      : {}),
    ...(patch.textOverlayText !== undefined
      ? { textOverlayText: patch.textOverlayText }
      : {}),
    ...(patch.textOverlayAlign !== undefined
      ? { textOverlayAlign: patch.textOverlayAlign }
      : {}),
    ...(patch.playerOverlayMode !== undefined
      ? { playerOverlayMode: patch.playerOverlayMode }
      : {}),
    ...(patch.playerOverlayText !== undefined
      ? { playerOverlayText: patch.playerOverlayText }
      : {}),
    ...(patch.playerOverlayAlign !== undefined
      ? { playerOverlayAlign: patch.playerOverlayAlign }
      : {}),
  };
}

export async function patchChannelVisual(
  patch: ChannelVisualPatch,
): Promise<{ ok: true; data: ChannelVisual } | { ok: false; error: string }> {
  if (forceMock()) {
    mockVisual = {
      ...mockVisual,
      ...(patch.visualPreset !== undefined
        ? { visualPreset: patch.visualPreset }
        : {}),
      ...(patch.headerStyle !== undefined
        ? { headerStyle: patch.headerStyle }
        : {}),
      ...(patch.videoBackgroundUrl !== undefined
        ? { videoBackgroundUrl: patch.videoBackgroundUrl }
        : {}),
      ...(patch.brandAccentPreset !== undefined
        ? { brandAccentPreset: patch.brandAccentPreset }
        : {}),
      ...(patch.slideshowPreset !== undefined
        ? { slideshowPreset: patch.slideshowPreset }
        : {}),
      ...(patch.slideshowIntervalSeconds !== undefined
        ? { slideshowIntervalSeconds: patch.slideshowIntervalSeconds }
        : {}),
      ...(patch.slideshowTransitionMs !== undefined
        ? { slideshowTransitionMs: patch.slideshowTransitionMs }
        : {}),
      ...(patch.slideshowAutoplay !== undefined
        ? { slideshowAutoplay: patch.slideshowAutoplay }
        : {}),
      ...(patch.nowPlayingOverlayStyle !== undefined
        ? { nowPlayingOverlayStyle: patch.nowPlayingOverlayStyle }
        : {}),
      ...(patch.nowPlayingOverlaySettingsJson !== undefined
        ? { nowPlayingOverlaySettingsJson: patch.nowPlayingOverlaySettingsJson }
        : {}),
      ...(patch.usePlayerGradient !== undefined
        ? { usePlayerGradient: patch.usePlayerGradient }
        : {}),
      ...(patch.playerColorSchemeJson !== undefined
        ? { playerColorSchemeJson: patch.playerColorSchemeJson }
        : {}),
      ...(patch.backgroundVisualPreset !== undefined
        ? { backgroundVisualPreset: patch.backgroundVisualPreset }
        : {}),
      ...(patch.useBackgroundGradient !== undefined
        ? { useBackgroundGradient: patch.useBackgroundGradient }
        : {}),
      ...(patch.backgroundColorSchemeJson !== undefined
        ? { backgroundColorSchemeJson: patch.backgroundColorSchemeJson }
        : {}),
      ...(patch.channelLinks !== undefined
        ? { channelLinks: patch.channelLinks }
        : {}),
      ...(patch.textOverlayMode !== undefined
        ? { textOverlayMode: patch.textOverlayMode }
        : {}),
      ...(patch.textOverlayText !== undefined
        ? { textOverlayText: patch.textOverlayText }
        : {}),
      ...(patch.textOverlayAlign !== undefined
        ? { textOverlayAlign: patch.textOverlayAlign }
        : {}),
      ...(patch.playerOverlayMode !== undefined
        ? { playerOverlayMode: patch.playerOverlayMode }
        : {}),
      ...(patch.playerOverlayText !== undefined
        ? { playerOverlayText: patch.playerOverlayText }
        : {}),
      ...(patch.playerOverlayAlign !== undefined
        ? { playerOverlayAlign: patch.playerOverlayAlign }
        : {}),
      ...(patch.colorScheme !== undefined
        ? {
            colorSchemeJson: patch.colorScheme
              ? JSON.stringify(patch.colorScheme)
              : null,
          }
        : {}),
      ...(patch.visualSettings !== undefined
        ? {
            visualSettingsJson:
              patch.visualSettings &&
              Object.keys(patch.visualSettings).length > 0
                ? JSON.stringify(patch.visualSettings)
                : null,
          }
        : {}),
    };
    return { ok: true, data: { ...mockVisual } };
  }
  try {
    const { data } = await requestJson<ChannelVisual>(
      '/api/me/channel/visual',
      {
        method: 'PATCH',
        body: JSON.stringify(toChannelVisualApiPatch(patch)),
      },
    );
    const textLayerTouched =
      patch.textOverlayMode !== undefined ||
      patch.textOverlayText !== undefined ||
      patch.textOverlayAlign !== undefined;
    if (textLayerTouched) {
      try {
        await requestJson('/api/me/channel/text-layer', {
          method: 'PATCH',
          body: JSON.stringify({
            ...(patch.textOverlayMode !== undefined
              ? { textLayerMode: patch.textOverlayMode }
              : {}),
            ...(patch.textOverlayText !== undefined
              ? { textLayerText: patch.textOverlayText }
              : {}),
            ...(patch.textOverlayAlign !== undefined
              ? { textLayerAlign: patch.textOverlayAlign }
              : {}),
          }),
        });
      } catch {
        // Visual save already succeeded; text layer is best-effort until
        // designer stores exclusively against the text-layer route.
      }
    }
    return {
      ok: true,
      data: {
        ...data,
        ...(patch.textOverlayMode !== undefined
          ? { textOverlayMode: patch.textOverlayMode }
          : {}),
        ...(patch.textOverlayText !== undefined
          ? { textOverlayText: patch.textOverlayText }
          : {}),
        ...(patch.textOverlayAlign !== undefined
          ? { textOverlayAlign: patch.textOverlayAlign }
          : {}),
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

/** A named, owner-saved snapshot of the whole Look — see the backend's
 * ChannelVisualPreset model. `settings` is the same object shape the
 * designer builds for `patchChannelVisual`, stored/replayed wholesale. */
export type ChannelVisualPreset = {
  id: string;
  name: string;
  settings: ChannelVisualPatch;
  createdAt: string;
  updatedAt: string;
};

let mockVisualPresets: ChannelVisualPreset[] = [];

export async function fetchChannelVisualPresets(): Promise<{
  data: ChannelVisualPreset[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return { data: [...mockVisualPresets], meta: { source: 'mock' } };
  }
  try {
    const { data } = await requestJson<ChannelVisualPreset[]>(
      '/api/me/channel/visual-presets',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: [...mockVisualPresets], meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

/** Saves under `name`, overwriting any existing preset with the same name. */
export async function saveChannelVisualPreset(
  name: string,
  settings: ChannelVisualPatch,
): Promise<
  { ok: true; data: ChannelVisualPreset } | { ok: false; error: string }
> {
  if (forceMock()) {
    const now = new Date().toISOString();
    const existing = mockVisualPresets.find((p) => p.name === name);
    const preset: ChannelVisualPreset = existing
      ? { ...existing, settings, updatedAt: now }
      : {
          id: `mock-preset-${Date.now()}`,
          name,
          settings,
          createdAt: now,
          updatedAt: now,
        };
    mockVisualPresets = existing
      ? mockVisualPresets.map((p) => (p.id === preset.id ? preset : p))
      : [preset, ...mockVisualPresets];
    return { ok: true, data: preset };
  }
  try {
    const { data } = await requestJson<ChannelVisualPreset>(
      '/api/me/channel/visual-presets',
      { method: 'POST', body: JSON.stringify({ name, settings }) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

export async function deleteChannelVisualPreset(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    mockVisualPresets = mockVisualPresets.filter((p) => p.id !== id);
    return { ok: true };
  }
  try {
    await requestJson<{ ok: true }>(`/api/me/channel/visual-presets/${id}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Delete failed',
    };
  }
}

export async function checkSlugAvailable(
  slug: string,
): Promise<{ available: boolean; reason?: string; meta: FetchMeta }> {
  if (forceMock()) {
    return {
      available: slug.length >= 3 && slug !== 'taken',
      reason: slug === 'taken' ? 'taken' : undefined,
      meta: { source: 'mock' },
    };
  }
  try {
    const { data } = await requestJson<{ available: boolean; reason?: string }>(
      `/api/me/channel/slug-available?slug=${encodeURIComponent(slug)}`,
    );
    return { ...data, meta: { source: 'api' } };
  } catch (err) {
    return { available: false, reason: 'error', meta: failMeta(err) };
  }
}

export async function updateChannelSlug(
  slug: string,
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  if (forceMock()) {
    if (slug.length < 3) {
      return { ok: false, error: 'Slug too short' };
    }
    return { ok: true, slug };
  }
  try {
    const { data } = await requestJson<{ slug?: string; username?: string }>(
      '/api/me/channel/slug',
      { method: 'PATCH', body: JSON.stringify({ slug }) },
    );
    return { ok: true, slug: data.slug ?? slug };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Rename failed',
    };
  }
}

export async function setCustomDomain(
  domain: string,
): Promise<
  | { ok: true; domain: string; txtHost: string; txtRecord: string }
  | { ok: false; error: string }
> {
  if (forceMock()) {
    return {
      ok: true,
      domain,
      txtHost: `_tahti.${domain}`,
      txtRecord: 'tahti-verify=mock-token',
    };
  }
  try {
    const { data } = await requestJson<{
      domain: string;
      txtHost: string;
      txtRecord: string;
    }>('/api/me/channel/custom-domain', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
    return { ok: true, ...data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Set domain failed',
    };
  }
}

export async function verifyCustomDomain(): Promise<
  { ok: true; verified: boolean } | { ok: false; error: string }
> {
  if (forceMock()) {
    return { ok: true, verified: true };
  }
  try {
    const { data } = await requestJson<{ verified?: boolean; ok?: boolean }>(
      '/api/me/channel/custom-domain/verify',
      { method: 'POST' },
    );
    return { ok: true, verified: Boolean(data.verified ?? data.ok) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Verify failed',
    };
  }
}
