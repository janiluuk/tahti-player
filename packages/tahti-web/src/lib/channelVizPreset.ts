import {
  ALL_VISUALIZER_MODES,
  type VisualizerMode,
} from '@tahti-player/visualizer';

const PREFIX = 'tahti.viz.channel.';

function isVisualizerMode(value: string): value is VisualizerMode {
  return (ALL_VISUALIZER_MODES as readonly string[]).includes(value);
}

export function channelVizStorageKey(channelKey: string): string {
  return `${PREFIX}${channelKey}`;
}

export function loadChannelVizMode(
  channelKey: string | null | undefined,
  fallback: VisualizerMode = 'spectrum',
): VisualizerMode {
  if (!channelKey || typeof localStorage === 'undefined') {
    return fallback;
  }
  try {
    const raw = localStorage.getItem(channelVizStorageKey(channelKey));
    if (raw && isVisualizerMode(raw)) {
      return raw;
    }
  } catch {
    /* private mode / blocked storage */
  }
  return fallback;
}

export function saveChannelVizMode(
  channelKey: string | null | undefined,
  mode: VisualizerMode,
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
