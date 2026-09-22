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
