import {
  ALL_VISUALIZER_MODES,
  type VisualizerMode,
} from '@tahti-player/visualizer';

const PREFIX = 'tahti.viz.channel.';

/** Full-screen backgrounds made from the cover art instead of a visualizer:
 * `ambient-glow` is the visualizer switched off, `ambient-water` the
 * landscape-over-water scene. */
export const AMBIENT_SCENES = ['ambient-glow', 'ambient-water'] as const;
export type AmbientScene = (typeof AMBIENT_SCENES)[number];
export type PlayerScene = VisualizerMode | AmbientScene;

export function isAmbientScene(value: string): value is AmbientScene {
  return (AMBIENT_SCENES as readonly string[]).includes(value);
}

function isVisualizerMode(value: string): value is VisualizerMode {
  return (ALL_VISUALIZER_MODES as readonly string[]).includes(value);
}

export function channelVizStorageKey(channelKey: string): string {
  return `${PREFIX}${channelKey}`;
}

export function loadChannelVizMode(
  channelKey: string | null | undefined,
  fallback: PlayerScene = 'spectrum',
): PlayerScene {
  if (!channelKey || typeof localStorage === 'undefined') {
    return fallback;
  }
  try {
    const raw = localStorage.getItem(channelVizStorageKey(channelKey));
    if (raw && (isVisualizerMode(raw) || isAmbientScene(raw))) {
      return raw;
    }
  } catch {
    /* private mode / blocked storage */
  }
  return fallback;
}

export function saveChannelVizMode(
  channelKey: string | null | undefined,
  mode: PlayerScene,
): void {
  if (!channelKey || typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(channelVizStorageKey(channelKey), mode);
  } catch {
    /* ignore quota / private mode */
  }
}
