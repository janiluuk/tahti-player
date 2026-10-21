import { type HeaderStyle } from './header';
import {
  type TextOverlayAlign,
  type TextOverlayMode,
  type VisualPreset,
} from './presets';

export type ChannelVisual = {
  visualPreset: VisualPreset | string;
  colorSchemeJson: string | null;
  visualSettingsJson?: string | null;
  headerStyle: HeaderStyle | string;
  /** Reused from the backend's Channel.videoBackgroundUrl column — plays as
   * the VIDEO_LOOP header style. Supports direct .mp4/.webm and YouTube links. */
  videoBackgroundUrl?: string | null;
  brandAccentPreset: string | null;
  /** Short line shown in a strip across the top of the channel hero. */
  topBarText?: string | null;
  slideshowPreset?: string | null;
  slideshowIntervalSeconds?: number;
  slideshowTransitionMs?: number;
  slideshowAutoplay?: boolean;
  /** Layout preset for the now-playing title/artist overlay — see
   * content/nowPlayingOverlayPresets.ts. Persisted via PATCH
   * `/api/me/channel/visual` when the sibling look-extras columns are live. */
  nowPlayingOverlayStyle?: string | null;
  nowPlayingOverlaySettingsJson?: string | null;
  /** Off by default — the player stage reuses the header's color scheme
   * above. When on, `playerColorSchemeJson` colors the player/visualizer
   * independently. */
  usePlayerGradient?: boolean;
  playerColorSchemeJson?: string | null;
  /** Channel background designer — a third surface alongside the header and
   * player, restricted to the audio-reactive "channel background" visualizer
   * widgets (see plugins/visualizers/presets/{interactivePoints,fatLines,
   * videoKinect,backdropArea}.ts). Shares the header's video/image backdrop
   * the same way Player design's Video/image tab does — only the gradient
   * and visualizer pick are independent. */
  backgroundVisualPreset?: string | null;
  useBackgroundGradient?: boolean;
  backgroundColorSchemeJson?: string | null;
  /** Outbound social/link buttons shown in the channel page's Links block.
   * Live API stores JSON in `channelLinksJson`; normalizeChannelVisual maps it. */
  channelLinks?: ChannelLink[] | null;
  /** Stylized headline shown in the channel page's Text overlay block.
   * Live API uses `textLayer*`; designer patch still goes to
   * `/api/me/channel/text-layer`. */
  textOverlayMode?: TextOverlayMode | string | null;
  textOverlayText?: string | null;
  textOverlayAlign?: TextOverlayAlign | string | null;
  /** Same headline treatment, but for the standalone overlay shown inside
   * the player stage itself (Player design → Overlay tab) rather than the
   * channel page's separate Text overlay block. */
  playerOverlayMode?: TextOverlayMode | string | null;
  playerOverlayText?: string | null;
  playerOverlayAlign?: TextOverlayAlign | string | null;
};

export type ChannelLink = {
  label: string;
  url: string;
  /** Editor-only hide; omitted from the public Links block when true. */
  hidden?: boolean;
};

/** Live GET may return `channelLinksJson` (string) instead of `channelLinks`. */
export function parseChannelLinksJson(
  raw: string | null | undefined,
): ChannelLink[] | null {
  if (raw == null || raw === '') {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed
      .filter(
        (entry): entry is { label: string; url: string; hidden?: unknown } =>
          Boolean(
            entry &&
            typeof entry === 'object' &&
            typeof (entry as ChannelLink).label === 'string' &&
            typeof (entry as ChannelLink).url === 'string',
          ),
      )
      .map((entry) => ({
        label: entry.label,
        url: entry.url,
        ...(entry.hidden === true ? { hidden: true } : {}),
      }));
  } catch {
    return null;
  }
}

export function normalizeChannelVisual(
  raw: ChannelVisual & {
    channelLinksJson?: string | null;
    textLayerMode?: string | null;
    textLayerText?: string | null;
    textLayerAlign?: string | null;
  },
): ChannelVisual {
  const fromJson = parseChannelLinksJson(raw.channelLinksJson);
  return {
    ...raw,
    channelLinks: raw.channelLinks ?? fromJson ?? [],
    textOverlayMode: raw.textOverlayMode ?? raw.textLayerMode ?? 'NONE',
    textOverlayText: raw.textOverlayText ?? raw.textLayerText ?? '',
    textOverlayAlign: raw.textOverlayAlign ?? raw.textLayerAlign ?? 'CENTER',
  };
}
