import {
  ALL_VISUALIZER_MODES,
  type VisualizerMode,
} from '@tahti-player/visualizer';

export function radioVisualizerPreset(
  key: string,
  preset?: string | null,
): VisualizerMode {
  const saved = preset?.toLowerCase() as VisualizerMode;
  if (ALL_VISUALIZER_MODES.includes(saved)) {
    return saved;
  }
  let hash = 0;
  for (const char of key) {
    hash = (Math.imul(hash, 31) + char.charCodeAt(0)) | 0;
  }
  return ALL_VISUALIZER_MODES[(hash >>> 0) % ALL_VISUALIZER_MODES.length]!;
}
