import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fadeLevelAt, rampLevel } from './audioFade';

describe('fadeLevelAt', () => {
  it('starts and ends on the given levels in both directions', () => {
    expect(fadeLevelAt(1, 0, 0)).toBe(1);
    expect(fadeLevelAt(1, 0, 1)).toBeCloseTo(0);
    expect(fadeLevelAt(0, 1, 0)).toBe(0);
    expect(fadeLevelAt(0, 1, 1)).toBeCloseTo(1);
  });

  it('moves one way only and holds more than half the level at the midpoint', () => {
    const down = [0.25, 0.5, 0.75].map((p) => fadeLevelAt(1, 0, p));
    expect(down[0]).toBeGreaterThan(down[1]);
    expect(down[1]).toBeGreaterThan(down[2]);
    expect(down[1]).toBeCloseTo(Math.SQRT1_2);
    expect(fadeLevelAt(0, 1, 0.5)).toBeCloseTo(Math.SQRT1_2);
  });
});

describe('rampLevel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('walks the level down and finishes exactly on the target', async () => {
    const levels: number[] = [];
    const done = rampLevel({
      from: 1,
      to: 0,
      ms: 200,
      onLevel: (level) => levels.push(level),
    });
    await vi.advanceTimersByTimeAsync(250);
    expect(await done).toBe(true);
    expect(levels[levels.length - 1]).toBe(0);
    expect(levels.length).toBe(4);
    expect([...levels].sort((a, b) => b - a)).toEqual(levels);
  });

  it('stops where it is when cancelled', async () => {
    const levels: number[] = [];
    let cancelled = false;
    const done = rampLevel({
      from: 0,
      to: 1,
      ms: 500,
      onLevel: (level) => levels.push(level),
      cancelled: () => cancelled,
    });
    await vi.advanceTimersByTimeAsync(120);
    cancelled = true;
    await vi.advanceTimersByTimeAsync(500);
    expect(await done).toBe(false);
    expect(levels.length).toBe(2);
    expect(levels[levels.length - 1]).toBeLessThan(1);
  });
});
