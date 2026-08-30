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

export const HEADER_STYLES = ['GRADIENT', 'SOLID', 'VIDEO_LOOP'] as const;
export type HeaderStyle = (typeof HEADER_STYLES)[number];

/** Direct video files and YouTube watch links supported by the VIDEO_LOOP
 * header. YouTube links are rendered as muted looped iframe embeds. */
const HEADER_VIDEO_URL_PATTERN = /^https:\/\/\S+\.(mp4|webm)(\?\S*)?$/i;

export function youtubeEmbedUrl(url: string | null | undefined): string | null {
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
      ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&rel=0`
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

export const MAX_HEADER_VIDEO_BYTES = 10 * 1024 * 1024;

export async function uploadChannelHeaderVideo(
  file: File,
): Promise<
  { ok: true; videoBackgroundUrl: string } | { ok: false; error: string }
> {
  if (file.size > MAX_HEADER_VIDEO_BYTES) {
    return { ok: false, error: 'Video must be 10 MB or smaller.' };
  }
  if (!['video/mp4', 'video/webm'].includes(file.type)) {
    return { ok: false, error: 'Use an MP4 or WebM video.' };
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

export const DEFAULT_COLOR_SCHEME: Required<ColorScheme> = {
  accent: '#22D3EE',
  highlight: '#A78BFA',
  bg: '#0B1220',
  text: '#F8FAFC',
  muted: '#64748B',
};

/** Fills every key with a default so the object always satisfies the
 * backend's all-required ColorSchemeSchema before it's sent in a PATCH. */
export function fillColorScheme(scheme: ColorScheme): Required<ColorScheme> {
  return { ...DEFAULT_COLOR_SCHEME, ...scheme };
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
};

/** Per-preset speed/intensity, both clamped 0.25–2 (matches the backend's
 * VisualPresetSettingsSchema in packages/shared). */
export type VisualPresetSettings = { speed: number; intensity: number };
export type VisualSettingsMap = Record<string, Partial<VisualPresetSettings>>;

export const DEFAULT_VISUAL_PRESET_SETTINGS: VisualPresetSettings = {
  speed: 1,
  intensity: 1,
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
};

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
      },
      meta: apiErrorMeta(err),
    };
  }
}

export async function patchChannelVisual(patch: {
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
}): Promise<{ ok: true; data: ChannelVisual } | { ok: false; error: string }> {
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
        body: JSON.stringify(patch),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
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
