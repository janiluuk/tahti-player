import { describe, expect, it } from 'vitest';

import { formatClock, rulerTicks } from './draw';
import {
  clampView,
  followPlayhead,
  minSpanSec,
  panBy,
  viewForRange,
  zoomAt,
} from './viewMath';

const MIN = minSpanSec(48000);

describe('view math', () => {
  it('zooms at an anchor, keeping it at the same screen position', () => {
    const view = { start: 10, end: 20 };
    const next = zoomAt(view, 100, 12.5, 0.5, MIN);
    expect(next.end - next.start).toBeCloseTo(5);
    expect((12.5 - next.start) / (next.end - next.start)).toBeCloseTo(0.25);
  });

  it('zooms down to a few dozen samples but no further', () => {
    let view = { start: 0, end: 60 };
    for (let i = 0; i < 100; i++) {
      view = zoomAt(view, 60, 30, 0.5, MIN);
    }
    expect(view.end - view.start).toBeCloseTo(32 / 48000, 9);
    expect(view.start).toBeLessThanOrEqual(30);
    expect(view.end).toBeGreaterThanOrEqual(30);
  });

  it('never zooms out past the whole track', () => {
    expect(zoomAt({ start: 10, end: 20 }, 60, 15, 100, MIN)).toEqual({
      start: 0,
      end: 60,
    });
  });

  it('keeps pans inside the track', () => {
    expect(panBy({ start: 50, end: 60 }, 60, 5, MIN)).toEqual({
      start: 50,
      end: 60,
    });
    expect(panBy({ start: 2, end: 12 }, 60, -5, MIN)).toEqual({
      start: 0,
      end: 10,
    });
    expect(clampView({ start: -1, end: 200 }, 60, MIN)).toEqual({
      start: 0,
      end: 60,
    });
  });

  it('pages to follow the playhead only once it leaves the view', () => {
    const view = { start: 10, end: 20 };
    expect(followPlayhead(view, 60, 15, MIN)).toBe(view);
    expect(followPlayhead(view, 60, 21, MIN)).toEqual({ start: 21, end: 31 });
    expect(followPlayhead(view, 60, 58, MIN)).toEqual({ start: 50, end: 60 });
  });

  it('frames a range with a little padding', () => {
    const view = viewForRange({ start: 10, end: 20 }, 60, MIN);
    expect(view.start).toBeCloseTo(9.5);
    expect(view.end).toBeCloseTo(20.5);
  });
});

describe('ruler', () => {
  it('uses whole seconds when zoomed out and milliseconds when zoomed in', () => {
    const wide = rulerTicks({ start: 0, end: 60 }, 1200);
    expect(wide.step).toBe(5);
    expect(wide.major[1]).toBe(5);
    const narrow = rulerTicks({ start: 1, end: 1.01 }, 1000);
    expect(narrow.step).toBeLessThan(0.01);
    expect(narrow.major.every((t) => t >= 1 && t <= 1.01)).toBe(true);
  });

  it('keeps labels at least the minimum distance apart', () => {
    const view = { start: 0, end: 3.7 };
    const { step } = rulerTicks(view, 800, 90);
    expect((step / 3.7) * 800).toBeGreaterThanOrEqual(90);
  });

  it('formats the clock to the precision of the step', () => {
    expect(formatClock(65.5)).toBe('1:06');
    expect(formatClock(65.5, 0.1)).toBe('1:05.5');
    expect(formatClock(1.2345, 0.001)).toBe('0:01.235');
    expect(formatClock(59.9996, 0.001)).toBe('1:00.000');
    expect(formatClock(-3)).toBe('0:00');
  });
});
