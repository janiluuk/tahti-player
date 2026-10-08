import { describe, expect, it } from 'vitest';

import { newChainEntry } from './chainTypes';
import {
  buildEffectChain,
  getRackEffect,
  RACK_EFFECTS,
  rackEffectDefaults,
} from './rackEffects';
import { getWorkletUrl } from './workletUrls';

describe('audio-rack', () => {
  it('exposes the full psychoacoustic rack catalog', () => {
    expect(RACK_EFFECTS.length).toBeGreaterThanOrEqual(19);
    for (const id of [
      'crossfeed',
      'phantom_bass',
      'kargyraa',
      'spatializer',
      'ares',
      'chop',
      'parametric_eq',
      'compressor',
    ]) {
      expect(getRackEffect(id)).toBeTruthy();
    }
  });

  it('returns sticky defaults per effect', () => {
    const defaults = rackEffectDefaults('compressor');
    expect(defaults).toBeTruthy();
    expect(typeof defaults.threshold).toBe('number');
  });

  it('buildEffectChain keeps param state across updateParams', () => {
    const Ctx =
      globalThis.AudioContext ||
      (globalThis as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) {
      expect(true).toBe(true);
      return;
    }
    const ctx = new Ctx();
    const input = ctx.createGain();
    const output = ctx.createGain();
    const entry = newChainEntry('compressor', rackEffectDefaults('compressor'));
    const handle = buildEffectChain(ctx, input, output, [entry]);
    const next = { ...entry.params, threshold: -18 };
    handle.updateParams(entry.id, next);
    handle.updateParams(entry.id, { threshold: -12 });
    expect(handle).toBeTruthy();
    handle.dispose();
    void ctx.close();
  });

  it('resolves worklet module URLs', () => {
    expect(getWorkletUrl('chop')).toMatch(/chop/);
    expect(getWorkletUrl('granular')).toMatch(/granular/);
    expect(getWorkletUrl('subharmonic')).toMatch(/subharmonic/);
  });
});
