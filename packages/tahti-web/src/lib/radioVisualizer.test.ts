import { describe, expect, it } from 'vitest';

import { radioVisualizerPreset } from './radioVisualizer';

describe('radio visualizer defaults', () => {
  it('keeps a saved advanced mode', () => {
    expect(radioVisualizerPreset('station', 'QUANTUM')).toBe('quantum');
  });
  it('chooses a stable mix of advanced modes across channels', () => {
    const keys = [
      'tahti-radio',
      'dj-moonlight',
      'northern-lights',
      'midnight-cartography',
    ];
    const modes = keys.map((key) => radioVisualizerPreset(key, 'AURORA'));
    expect(new Set(modes).size).toBeGreaterThan(1);
    expect(keys.map((key) => radioVisualizerPreset(key))).toEqual(modes);
  });
});
