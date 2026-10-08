import { afterEach, describe, expect, it } from 'vitest';

import {
  getEngineCtx,
  getMasterGain,
  preferInternalEngine,
  setExternalAnalyser,
} from './index';

function AudioContextCtor(): typeof AudioContext | null {
  const Ctx =
    globalThis.AudioContext ||
    (globalThis as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  return typeof Ctx === 'function' ? Ctx : null;
}

describe('audio-core', () => {
  afterEach(() => {
    preferInternalEngine();
  });

  it('exposes engine bridge helpers', () => {
    expect(typeof getEngineCtx).toBe('function');
    expect(typeof getMasterGain).toBe('function');
    expect(typeof preferInternalEngine).toBe('function');
    preferInternalEngine();
  });

  it('keeps getMasterGain on the same context as getEngineCtx', () => {
    const Ctx = AudioContextCtor();
    if (!Ctx) {
      return;
    }
    const ctx = getEngineCtx();
    const gain = getMasterGain();
    expect(gain.context).toBe(ctx);
  });

  it('preferInternalEngine clears an external analyser bridge', () => {
    const Ctx = AudioContextCtor();
    if (!Ctx) {
      return;
    }
    const external = new Ctx();
    const analyser = external.createAnalyser();
    setExternalAnalyser(analyser, external);
    expect(getEngineCtx()).toBe(external);
    expect(getMasterGain().context).toBe(external);
    preferInternalEngine();
    const internal = getEngineCtx();
    expect(internal).not.toBe(external);
    expect(getMasterGain().context).toBe(internal);
    void external.close();
  });
});
