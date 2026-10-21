import { describe, expect, it } from 'vitest';

import { getDesignPreset } from './design-presets';
import { advanceTrail, createCanvasState, renderTrail } from './engine';
import { getPaletteColors } from './palette';

describe('createCanvasState', () => {
  it('starts empty', () => {
    const state = createCanvasState();
    expect(state.trail).toEqual([]);
    expect(state.frameCount).toBe(0);
  });
});

describe('advanceTrail', () => {
  it('appends a frame and tracks the cursor', () => {
    const state = createCanvasState();
    const preset = getDesignPreset('weave-silk');
    const config = {
      preset,
      colors: getPaletteColors('aurora'),
      bgColor: '#000000',
      brushSize: 3,
      glowIntensity: 4,
    };

    advanceTrail(state, config, 100, 50);

    expect(state.trail).toHaveLength(1);
    expect(state.frameCount).toBe(1);
    expect(state.trail[0]!.pathA.length).toBeGreaterThan(0);
    expect(state.trail[0]!.pathB.length).toBeGreaterThan(0);
  });

  it('caps trail history at 360 frames', () => {
    const state = createCanvasState();
    const preset = getDesignPreset('weave-silk');
    const config = {
      preset,
      colors: getPaletteColors('aurora'),
      bgColor: '#000000',
      brushSize: 3,
      glowIntensity: 4,
    };

    for (let i = 0; i < 400; i++) {
      advanceTrail(state, config, 100, 50);
    }

    expect(state.trail.length).toBe(360);
    expect(state.frameCount).toBe(400);
  });
});

describe('renderTrail', () => {
  it('draws without throwing on an empty canvas context stub', () => {
    const state = createCanvasState();
    const preset = getDesignPreset('weave-silk');
    const config = {
      preset,
      colors: getPaletteColors('aurora'),
      bgColor: '#000000',
      brushSize: 3,
      glowIntensity: 4,
    };
    advanceTrail(state, config, 100, 50);

    const calls: string[] = [];
    const ctx = {
      canvas: { width: 200, height: 200 },
      set globalCompositeOperation(_v: string) {
        calls.push('globalCompositeOperation');
      },
      set fillStyle(_v: string) {
        calls.push('fillStyle');
      },
      set globalAlpha(_v: number) {
        calls.push('globalAlpha');
      },
      set shadowBlur(_v: number) {
        calls.push('shadowBlur');
      },
      set strokeStyle(_v: string) {
        calls.push('strokeStyle');
      },
      set lineWidth(_v: number) {
        calls.push('lineWidth');
      },
      fillRect: () => calls.push('fillRect'),
      beginPath: () => calls.push('beginPath'),
      moveTo: () => calls.push('moveTo'),
      lineTo: () => calls.push('lineTo'),
      stroke: () => calls.push('stroke'),
    } as unknown as CanvasRenderingContext2D;

    expect(() => renderTrail(ctx, state, config)).not.toThrow();
    expect(calls).toContain('stroke');
  });
});
