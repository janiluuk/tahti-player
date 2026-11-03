import { VISUAL_PRESETS, type VisualPreset } from '../api/channel-design';

export type ReleaseVisualizerMode = 'specific' | 'random' | 'off';

export type ReleaseVisualizerPreference = {
  mode: ReleaseVisualizerMode;
  preset: Exclude<VisualPreset, 'MINIMAL'>;
};

const RELEASE_VISUALIZER_STORAGE_KEY = 'tahti-release-visualizer-default';

const DEFAULT_PREFERENCE: ReleaseVisualizerPreference = {
  mode: 'specific',
  preset: 'PARTICLE_FIELD',
};

const selectablePresets = VISUAL_PRESETS.filter(
  (preset): preset is Exclude<VisualPreset, 'MINIMAL'> => preset !== 'MINIMAL',
);

export function releaseVisualizerPresets() {
  return selectablePresets;
}

export function readReleaseVisualizerPreference(): ReleaseVisualizerPreference {
  if (typeof localStorage === 'undefined') {
    return DEFAULT_PREFERENCE;
  }
  try {
    const value = JSON.parse(
      localStorage.getItem(RELEASE_VISUALIZER_STORAGE_KEY) ?? '',
    ) as Partial<ReleaseVisualizerPreference>;
    const mode =
      value.mode === 'random' ||
      value.mode === 'off' ||
      value.mode === 'specific'
        ? value.mode
        : DEFAULT_PREFERENCE.mode;
    const preset = selectablePresets.includes(value.preset as never)
      ? (value.preset as Exclude<VisualPreset, 'MINIMAL'>)
      : DEFAULT_PREFERENCE.preset;
    return { mode, preset };
  } catch {
    return DEFAULT_PREFERENCE;
  }
}

export function saveReleaseVisualizerPreference(
  preference: ReleaseVisualizerPreference,
) {
  localStorage.setItem(
    RELEASE_VISUALIZER_STORAGE_KEY,
    JSON.stringify(preference),
  );
}

export function resolveNewReleaseVisualizer(): VisualPreset {
  const preference = readReleaseVisualizerPreference();
  if (preference.mode === 'off') {
    return 'MINIMAL';
  }
  if (preference.mode === 'specific') {
    return preference.preset;
  }
  const index = Math.floor(Math.random() * selectablePresets.length);
  return selectablePresets[index] ?? DEFAULT_PREFERENCE.preset;
}
