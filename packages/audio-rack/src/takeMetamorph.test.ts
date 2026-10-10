import { describe, expect, it } from 'vitest';

import { morphGains, morphTakeChannels } from './takeMetamorph';

const SR = 8000;

function sine(freq: number, seconds: number, amp = 0.5): Float32Array {
  const n = Math.round(seconds * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    out[i] = amp * Math.sin((2 * Math.PI * freq * i) / SR);
  }
  return out;
}

function zcr(data: Float32Array, from = 0, to = data.length): number {
  let crossings = 0;
  for (let i = from + 1; i < to; i += 1) {
    if (data[i] >= 0 !== data[i - 1] >= 0) {
      crossings += 1;
    }
  }
  return crossings / (to - from);
}

function rms(data: Float32Array, from = 0, to = data.length): number {
  let sum = 0;
  for (let i = from; i < to; i += 1) {
    sum += data[i] * data[i];
  }
  return Math.sqrt(sum / (to - from));
}

const low = () => sine(110, 2);
const high = () => sine(1000, 2);

describe('morphGains', () => {
  it('runs from all host to all donor on every curve', () => {
    for (const curve of ['linear', 'equal-power', 's-curve'] as const) {
      expect(morphGains(0, curve).host).toBeCloseTo(1);
      expect(morphGains(0, curve).donor).toBeCloseTo(0);
      expect(morphGains(1, curve).host).toBeCloseTo(0);
      expect(morphGains(1, curve).donor).toBeCloseTo(1);
    }
  });

  it('keeps equal power at the midpoint and equal gain on linear', () => {
    const ep = morphGains(0.5, 'equal-power');
    expect(ep.host ** 2 + ep.donor ** 2).toBeCloseTo(1);
    const lin = morphGains(0.5, 'linear');
    expect(lin.host + lin.donor).toBeCloseTo(1);
    expect(morphGains(0.25, 's-curve').donor).toBeLessThan(0.25);
  });
});

describe('morphTakeChannels', () => {
  it('returns the host untouched at amount 0', () => {
    const host = low();
    const [out] = morphTakeChannels([host], [high()], SR, { amount: 0 });
    expect(out).not.toBe(host);
    expect(Array.from(out)).toEqual(Array.from(host));
  });

  it('reconstructs the host through the grain overlap when the donor is the host', () => {
    const host = low();
    const [out] = morphTakeChannels([host], [host], SR, {
      amount: 0.5,
      curve: 'linear',
      jitter: 0,
      searchMs: 0,
    });
    let maxErr = 0;
    for (let i = 0; i < host.length; i += 1) {
      maxErr = Math.max(maxErr, Math.abs(out[i] - host[i]));
    }
    expect(maxErr).toBeLessThan(1e-4);
  });

  it('takes on the donor timbre at full amount while keeping the host length', () => {
    const host = low();
    const donor = high();
    const [out] = morphTakeChannels([host], [donor], SR, { amount: 1 });
    expect(out.length).toBe(host.length);
    expect(Math.abs(zcr(out) - zcr(donor))).toBeLessThan(
      Math.abs(zcr(out) - zcr(host)),
    );
  });

  it('carries the host dynamics onto the donor grains', () => {
    const host = low();
    for (let i = host.length / 2; i < host.length; i += 1) {
      host[i] *= 0.1;
    }
    const [out] = morphTakeChannels([host], [high()], SR, {
      amount: 1,
      jitter: 0,
    });
    const half = host.length / 2;
    const loud = rms(out, 1000, half - 1000);
    const quiet = rms(out, half + 1000, host.length - 1000);
    expect(quiet / loud).toBeLessThan(0.25);
  });

  it('sweeps from host to donor across the take on rise', () => {
    const host = low();
    const donor = high();
    const [out] = morphTakeChannels([host], [donor], SR, {
      amount: 1,
      sweep: 'rise',
    });
    const tenth = Math.floor(host.length / 10);
    expect(zcr(out, 0, tenth)).toBeLessThan(zcr(out, host.length - tenth));
  });

  it('is deterministic for the same seed and varies with another', () => {
    const opts = { amount: 0.7, jitter: 1, seed: 7 };
    const noise = new Float32Array(SR * 2);
    let s = 1;
    for (let i = 0; i < noise.length; i += 1) {
      s = (s * 1103515245 + 12345) >>> 0;
      noise[i] = (s / 4294967296 - 0.5) * 0.5;
    }
    const a = morphTakeChannels([low()], [noise], SR, opts)[0];
    const b = morphTakeChannels([low()], [noise], SR, opts)[0];
    const c = morphTakeChannels([low()], [noise], SR, { ...opts, seed: 8 })[0];
    expect(Array.from(a)).toEqual(Array.from(b));
    expect(Array.from(a)).not.toEqual(Array.from(c));
  });

  it('feeds a mono donor into every host channel', () => {
    const out = morphTakeChannels([low(), low()], [high()], SR, { amount: 1 });
    expect(out).toHaveLength(2);
    expect(rms(out[1])).toBeGreaterThan(0.1);
  });

  it('falls back to the host when the donor is shorter than one grain', () => {
    const host = low();
    const [out] = morphTakeChannels([host], [new Float32Array(10)], SR, {
      amount: 1,
    });
    expect(Array.from(out)).toEqual(Array.from(host));
  });
});
