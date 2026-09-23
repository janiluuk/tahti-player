import { describe, expect, it } from 'vitest';

import {
  audibleRange,
  buildWaveformData,
  nearestListedCrossing,
  nearestZeroCrossing,
  peakInRange,
  SUMMARY_BLOCK_SIZES,
  waveformFromServerPyramid,
} from './peaks';

function seeded(length: number, seed = 1) {
  let state = seed;
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    out[i] = (state / 4294967296) * 2 - 1;
  }
  return out;
}

function bruteForce(samples: Float32Array, start: number, end: number) {
  let min = Infinity;
  let max = -Infinity;
  for (let i = Math.floor(start); i < Math.ceil(end); i++) {
    min = Math.min(min, samples[i]!);
    max = Math.max(max, samples[i]!);
  }
  return { min, max };
}

describe('buildWaveformData / peakInRange', () => {
  const samples = seeded(300_000);
  const data = buildWaveformData([samples], 48000, true);
  const channel = data.channels[0]!;

  it('builds one summary level per block size, each covering every sample', () => {
    expect(channel.levels.map((level) => level.blockSize)).toEqual([
      ...SUMMARY_BLOCK_SIZES,
    ]);
    for (const level of channel.levels) {
      expect(level.min.length).toBe(
        Math.ceil(samples.length / level.blockSize),
      );
    }
  });

  it('matches a brute-force min/max for block-aligned ranges at every level', () => {
    for (const [start, end] of [
      [0, 256],
      [4096, 4096 * 3],
      [65536, 65536 * 2],
      [0, samples.length],
    ] as const) {
      const peak = peakInRange(channel, start, end)!;
      expect(peak.min).toBeCloseTo(bruteForce(samples, start, end).min, 6);
      expect(peak.max).toBeCloseTo(bruteForce(samples, start, end).max, 6);
    }
  });

  it('reads raw samples for ranges narrower than the first summary', () => {
    const peak = peakInRange(channel, 1000, 1010)!;
    expect(peak.min).toBe(bruteForce(samples, 1000, 1010).min);
    expect(peak.max).toBe(bruteForce(samples, 1000, 1010).max);
    const single = peakInRange(channel, 1234, 1235)!;
    expect(single.min).toBe(samples[1234]);
    expect(single.max).toBe(samples[1234]);
  });

  it('computes RMS', () => {
    const square = new Float32Array(1024).map((_, i) => (i % 2 ? 0.5 : -0.5));
    const peak = peakInRange(
      buildWaveformData([square], 48000, true).channels[0]!,
      0,
      1024,
    )!;
    expect(peak.rms).toBeCloseTo(0.5, 6);
  });

  it('falls back to the finest summary when raw samples were dropped', () => {
    const summaryOnly = buildWaveformData([samples], 48000, false).channels[0]!;
    const peak = peakInRange(summaryOnly, 1000, 1010)!;
    const block = bruteForce(samples, 768, 1024);
    expect(peak.min).toBeCloseTo(block.min, 6);
    expect(peak.max).toBeCloseTo(block.max, 6);
  });

  it('keeps each channel separate', () => {
    const left = new Float32Array(512).fill(0.25);
    const right = new Float32Array(512).fill(-0.75);
    const stereo = buildWaveformData([left, right], 44100, true);
    expect(stereo.channels).toHaveLength(2);
    expect(peakInRange(stereo.channels[1]!, 0, 512)!.min).toBe(-0.75);
    expect(peakInRange(stereo.channels[0]!, 0, 512)!.max).toBe(0.25);
  });
});

describe('waveformFromServerPyramid', () => {
  it('turns 0-255 absolute peaks into a symmetric mono placeholder, finest level first', () => {
    const data = waveformFromServerPyramid(
      {
        sampleRate: 8000,
        durationSec: 4,
        levels: [
          [255, 0],
          [128, 64, 255, 0],
        ],
      },
      4,
    )!;
    expect(data.exact).toBe(false);
    expect(data.length).toBe(32000);
    const levels = data.channels[0]!.levels;
    expect(levels.map((level) => level.blockSize)).toEqual([8000, 16000]);
    expect(levels[0]!.max[2]).toBe(1);
    expect(levels[0]!.min[2]).toBe(-1);
    expect(levels[0]!.meanSq).toBeNull();
  });

  it('returns null without usable levels', () => {
    expect(
      waveformFromServerPyramid(
        { sampleRate: 8000, durationSec: 4, levels: [[]] },
        4,
      ),
    ).toBeNull();
  });
});

describe('zero crossings', () => {
  it('finds the nearest sign change within the radius', () => {
    const samples = new Float32Array([
      0.5, 0.4, 0.3, -0.2, -0.4, -0.1, 0.2, 0.3,
    ]);
    const data = buildWaveformData([samples], 8, true);
    expect(nearestZeroCrossing(data, 2, 2)).toBe(3);
    expect(nearestZeroCrossing(data, 6, 1)).toBe(6);
    expect(nearestZeroCrossing(data, 0, 1)).toBeNull();
  });

  it('returns null without raw samples', () => {
    const data = buildWaveformData([seeded(1024)], 48000, false);
    expect(nearestZeroCrossing(data, 500, 50)).toBeNull();
  });

  it('snaps to a listed crossing only within the distance', () => {
    expect(nearestListedCrossing([0.1, 0.5, 0.9], 0.52, 0.05)).toBe(0.5);
    expect(nearestListedCrossing([0.1, 0.5, 0.9], 0.7, 0.05)).toBeNull();
    expect(nearestListedCrossing([], 0.7, 1)).toBeNull();
  });
});

describe('audibleRange', () => {
  it('finds where sound starts and ends, with padding', () => {
    const samples = new Float32Array(48000 * 3);
    samples.fill(0.5, 48000, 96000);
    const range = audibleRange(
      buildWaveformData([samples], 48000, true),
      -48,
      0,
    )!;
    expect(range.start).toBe(48000 - (48000 % 256));
    expect(range.end).toBeGreaterThanOrEqual(96000);
    expect(range.end).toBeLessThan(96000 + 256);
  });

  it('returns null for an all-silent file', () => {
    expect(
      audibleRange(buildWaveformData([new Float32Array(4096)], 48000, true)),
    ).toBeNull();
  });
});
