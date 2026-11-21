import type { ParseKeys, TFunction } from '@tahti-player/i18n';
import type { VisualizerMode } from '@tahti-player/visualizer';

const VISUALIZER_MODE_LABEL_KEYS = {
  oscilloscope: 'visualizerModeLabelBatch36.oscilloscope',
  spectrum: 'visualizerModeLabelBatch36.spectrum',
  radial: 'visualizerModeLabelBatch36.radial',
  quantum: 'visualizerModeLabelBatch36.quantum',
  orb: 'visualizerModeLabelBatch36.orb',
  cymatics: 'visualizerModeLabelBatch36.cymatics',
  'landscape-chrome': 'visualizerModeLabelBatch36.landscapeChrome',
  'landscape-ferrofluid': 'visualizerModeLabelBatch36.landscapeFerrofluid',
} as const satisfies Record<VisualizerMode, ParseKeys<'web'>>;

/** `VISUALIZER_MODE_LABELS` in the app language; the visualizer package
 * itself stays English-only. */
export function visualizerModeLabel(
  t: TFunction<'web'>,
  mode: VisualizerMode,
): string {
  return t(VISUALIZER_MODE_LABEL_KEYS[mode]);
}
