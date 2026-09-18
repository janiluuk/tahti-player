export {
  DESIGN_PRESETS,
  getDesignPreset,
  type CanvasDesignPreset,
} from './design-presets';
export {
  COLOR_PALETTES,
  getPaletteColors,
  DEFAULT_PRESET_ID,
  BACKGROUND_COLORS,
  DEFAULT_BG,
} from './palette';
export type { Palette } from './palette';
export {
  type TrailConfig,
  createCanvasState,
  advanceTrail,
  renderTrail,
} from './engine';
export {
  DesignCanvas as DesignCanvasImpl,
  type DesignCanvasHandle,
} from './design-canvas';
