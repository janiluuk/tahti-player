import { describe, expect, it } from 'vitest';

import {
  ADVANCED_MODES,
  ALL_VISUALIZER_MODES,
  CYMATICS_MODES,
  isAdvancedMode,
  isCymaticsMode,
  VISUALIZER_MODE_LABELS,
} from './modes';

describe('visualizer modes', () => {
  it('registers advanced and cymatics modes without overlap', () => {
    expect(ALL_VISUALIZER_MODES).toHaveLength(
      ADVANCED_MODES.length + CYMATICS_MODES.length,
    );
    for (const mode of ADVANCED_MODES) {
      expect(isAdvancedMode(mode)).toBe(true);
      expect(isCymaticsMode(mode)).toBe(false);
      expect(VISUALIZER_MODE_LABELS[mode]).toBeTruthy();
    }
    for (const mode of CYMATICS_MODES) {
      expect(isCymaticsMode(mode)).toBe(true);
      expect(isAdvancedMode(mode)).toBe(false);
      expect(VISUALIZER_MODE_LABELS[mode]).toBeTruthy();
    }
  });
});
