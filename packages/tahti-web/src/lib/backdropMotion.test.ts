// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  judgeFrameIntervals,
  setBackdropFrameVerdict,
  useBackdropFrameMonitor,
  useBackdropFramesSlow,
} from './backdropMotion';

const frames = (ms: number, count: number) => Array<number>(count).fill(ms);

describe('judgeFrameIntervals', () => {
  it('waits until it has seen enough frames', () => {
    expect(judgeFrameIntervals(frames(16.7, 60))).toBe('pending');
  });

  it('calls a page smooth after the settle time at 60 fps', () => {
    expect(judgeFrameIntervals(frames(16.7, 500))).toBe('smooth');
  });

  it('calls a page slow after three seconds at 10 fps', () => {
    expect(judgeFrameIntervals(frames(100, 29))).toBe('pending');
    expect(judgeFrameIntervals(frames(100, 30))).toBe('slow');
  });

  it('ignores a short burst of long frames', () => {
    expect(
      judgeFrameIntervals([
        ...frames(16.7, 100),
        ...frames(120, 8),
        ...frames(16.7, 400),
      ]),
    ).toBe('smooth');
  });

  it('counts mixed frames by time spent in long ones', () => {
    const mostlySlow = Array.from({ length: 80 }, (_, index) =>
      index % 3 === 0 ? 16.7 : 70,
    );
    expect(judgeFrameIntervals(mostlySlow)).toBe('slow');
    const mostlySmooth = Array.from({ length: 600 }, (_, index) =>
      index % 4 === 0 ? 60 : 16.7,
    );
    expect(judgeFrameIntervals(mostlySmooth)).toBe('smooth');
  });

  it('restarts the window after a hidden tab or a paused debugger', () => {
    expect(
      judgeFrameIntervals([
        ...frames(100, 20),
        Number.POSITIVE_INFINITY,
        ...frames(100, 20),
      ]),
    ).toBe('pending');
    expect(
      judgeFrameIntervals([...frames(100, 20), 5000, ...frames(100, 20)]),
    ).toBe('pending');
  });
});

describe('useBackdropFrameMonitor', () => {
  afterEach(() => {
    act(() => setBackdropFrameVerdict('pending'));
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function driveFrames(intervalMs: number) {
    let now = 0;
    let pending: FrameRequestCallback | null = null;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      pending = cb;
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {
      pending = null;
    });
    vi.spyOn(performance, 'now').mockReturnValue(0);
    return {
      run(count: number) {
        for (let index = 0; index < count && pending; index += 1) {
          const cb: FrameRequestCallback = pending;
          pending = null;
          now += intervalMs;
          cb(now);
        }
      },
      get sampling() {
        return pending !== null;
      },
    };
  }

  it('holds backdrops still once frames drop, then stops sampling', () => {
    const frames = driveFrames(100);
    const { result } = renderHook(() => {
      const slow = useBackdropFramesSlow();
      useBackdropFrameMonitor(!slow);
      return slow;
    });
    expect(result.current).toBe(false);
    act(() => frames.run(200));
    expect(result.current).toBe(true);
    expect(frames.sampling).toBe(false);
    expect(sessionStorage.getItem('tahti:backdrop-still')).toBe('1');
  });

  it('stops sampling on a smooth page without holding anything still', () => {
    const frames = driveFrames(16.7);
    const { result } = renderHook(() => {
      const slow = useBackdropFramesSlow();
      useBackdropFrameMonitor(!slow);
      return slow;
    });
    act(() => frames.run(2000));
    expect(result.current).toBe(false);
    expect(frames.sampling).toBe(false);
  });

  it('does not sample while no animated backdrop is mounted', () => {
    const frames = driveFrames(100);
    const { rerender, unmount } = renderHook(
      ({ animating }) => useBackdropFrameMonitor(animating),
      { initialProps: { animating: false } },
    );
    expect(frames.sampling).toBe(false);
    rerender({ animating: true });
    expect(frames.sampling).toBe(true);
    unmount();
    expect(frames.sampling).toBe(false);
  });
});
