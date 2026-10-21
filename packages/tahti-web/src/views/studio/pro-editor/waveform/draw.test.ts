import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { drawWaveformLayer, RULER_CSS_PX, type Palette } from './draw';
import { buildWaveformData, waveformFromServerPyramid } from './peaks';

type Rect = [number, number, number, number];

class FakePath {
  rects: Rect[] = [];
  rect(x: number, y: number, w: number, h: number) {
    this.rects.push([x, y, w, h]);
  }
  moveTo() {}
  lineTo() {}
  closePath() {}
}

function fakeContext() {
  const filled: Array<{ style: string; path: FakePath }> = [];
  const line: Array<[number, number]> = [];
  const dots: Array<[number, number]> = [];
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    font: '',
    textBaseline: '',
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    stroke: vi.fn(),
    moveTo: (x: number, y: number) => line.push([x, y]),
    lineTo: (x: number, y: number) => line.push([x, y]),
    arc: (x: number, y: number) => dots.push([x, y]),
    fill(path?: FakePath) {
      if (path) {
        filled.push({ style: ctx.fillStyle, path });
      }
    },
  };
  return {
    ctx: ctx as unknown as CanvasRenderingContext2D,
    filled,
    line,
    dots,
  };
}

const palette: Palette = {
  wave: 'wave',
  clip: 'clip',
  grid: 'grid',
  text: 'text',
  rulerBg: 'ruler',
  cut: 'cut',
  selection: 'sel',
  playhead: 'head',
  marker: 'marker',
};

const WIDTH = 800;
const HEIGHT = 220;
const laneTop = RULER_CSS_PX + 2;
const laneHalf = (HEIGHT - laneTop) / 2 - 2;
const mid = laneTop + (HEIGHT - laneTop) / 2;

describe('drawWaveformLayer', () => {
  beforeEach(() => {
    vi.stubGlobal('Path2D', FakePath);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('draws every sample at its exact position and value when zoomed past one sample per pixel', () => {
    const samples = new Float32Array([0, 0.5, -0.5, 1, -1, 0.25, 0, 0]);
    const data = buildWaveformData([samples], 8000, true);
    const { ctx, line, dots } = fakeContext();
    drawWaveformLayer(
      ctx,
      WIDTH,
      HEIGHT,
      1,
      data,
      { start: 0, end: 8 / 8000 },
      palette,
    );

    const pxPerSample = WIDTH / 8;
    for (let i = 0; i < samples.length; i++) {
      const point = line[i]!;
      expect(point[0]).toBeCloseTo(i * pxPerSample);
      expect(point[1]).toBeCloseTo(mid - samples[i]! * laneHalf);
    }
    expect(dots).toHaveLength(samples.length);
  });

  it('shows a one-sample spike at full height in its column when zoomed out', () => {
    const samples = new Float32Array(48000);
    samples[24000] = 0.8;
    samples[24001] = -0.6;
    const data = buildWaveformData([samples], 48000, true);
    const { ctx, filled } = fakeContext();
    drawWaveformLayer(
      ctx,
      WIDTH,
      HEIGHT,
      1,
      data,
      { start: 0, end: 1 },
      palette,
    );

    const envelope = filled.find((f) => f.style === 'wave')!.path.rects;
    const column = envelope.find(
      ([x]) => x === Math.floor(24000 / (48000 / WIDTH)),
    )!;
    expect(column[1]).toBeCloseTo(mid - 0.8 * laneHalf);
    expect(column[1] + column[3]).toBeCloseTo(mid + 0.6 * laneHalf);
  });

  it('marks clipped columns only on decoded (exact) data', () => {
    const samples = new Float32Array(4800);
    samples[100] = 1;
    const exact = fakeContext();
    drawWaveformLayer(
      exact.ctx,
      WIDTH,
      HEIGHT,
      1,
      buildWaveformData([samples], 48000, true),
      { start: 0, end: 0.1 },
      palette,
    );
    expect(
      exact.filled.find((f) => f.style === 'clip')!.path.rects.length,
    ).toBeGreaterThan(0);

    const overview = fakeContext();
    drawWaveformLayer(
      overview.ctx,
      WIDTH,
      HEIGHT,
      1,
      waveformFromServerPyramid(
        { sampleRate: 8000, durationSec: 1, levels: [[255, 255]] },
        1,
      ),
      { start: 0, end: 1 },
      palette,
    );
    expect(
      overview.filled.find((f) => f.style === 'clip')!.path.rects,
    ).toHaveLength(0);
  });

  it('gives each channel its own lane', () => {
    const left = new Float32Array(4800).fill(0.5);
    const right = new Float32Array(4800).fill(-0.5);
    const { ctx, filled } = fakeContext();
    drawWaveformLayer(
      ctx,
      WIDTH,
      HEIGHT,
      1,
      buildWaveformData([left, right], 48000, true),
      { start: 0, end: 0.1 },
      palette,
    );
    const envelopes = filled.filter(
      (f) => f.style === 'wave' && f.path.rects.length > 0,
    );
    expect(envelopes.length).toBeGreaterThanOrEqual(2);
    const firstTop = envelopes[0]!.path.rects[0]![1];
    const secondTop = envelopes[envelopes.length - 1]!.path.rects[0]![1];
    expect(secondTop).toBeGreaterThan(firstTop + 50);
  });
});
