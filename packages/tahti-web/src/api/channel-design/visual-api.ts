import type { FetchMeta } from '.././client';
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
} from '.././mode';
import { requestJson } from '.././request-json';
import { DEFAULT_COLOR_SCHEME, type ColorScheme } from './colors';
import { mockVisual } from './mock';
import { type VisualSettingsMap } from './presets';
import {
  normalizeChannelVisual,
  type ChannelLink,
  type ChannelVisual,
} from './visual';

export async function fetchChannelVisual(): Promise<{
  data: ChannelVisual;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: { ...mockVisual },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<
      ChannelVisual & { channelLinksJson?: string | null }
    >('/api/me/channel/visual');
    return { data: normalizeChannelVisual(data), meta: { source: 'api' } };
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
  'usePlayerGradient',
  'playerColorSchemeJson',
  'useBackgroundGradient',
  'backgroundColorSchemeJson',
  'backgroundVisualPreset',
  'nowPlayingOverlayStyle',
  'nowPlayingOverlaySettingsJson',
  'playerOverlayMode',
  'playerOverlayText',
  'playerOverlayAlign',
  'channelLinks',
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
