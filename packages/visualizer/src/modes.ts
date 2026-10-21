export type AdvancedMode = 'oscilloscope' | 'spectrum' | 'radial' | 'quantum';
export type CymaticsMode =
  'orb' | 'cymatics' | 'landscape-chrome' | 'landscape-ferrofluid';

export type VisualizerMode = AdvancedMode | CymaticsMode;

export const ADVANCED_MODES: readonly AdvancedMode[] = [
  'oscilloscope',
  'spectrum',
  'radial',
  'quantum',
] as const;

export const CYMATICS_MODES: readonly CymaticsMode[] = [
  'orb',
  'cymatics',
  'landscape-chrome',
  'landscape-ferrofluid',
] as const;

export const ALL_VISUALIZER_MODES: readonly VisualizerMode[] = [
  ...ADVANCED_MODES,
  ...CYMATICS_MODES,
] as const;

export const VISUALIZER_MODE_LABELS: Record<VisualizerMode, string> = {
  oscilloscope: 'Oscilloscope',
  spectrum: 'Spectrum',
  radial: 'Radial',
  quantum: 'Quantum Lattice',
  orb: 'Orb',
  cymatics: 'Cymatics',
  'landscape-chrome': 'Landscape Chrome',
  'landscape-ferrofluid': 'Landscape Ferrofluid',
};

export function isCymaticsMode(mode: VisualizerMode): mode is CymaticsMode {
  return (CYMATICS_MODES as readonly string[]).includes(mode);
}

export function isAdvancedMode(mode: VisualizerMode): mode is AdvancedMode {
  return (ADVANCED_MODES as readonly string[]).includes(mode);
}
