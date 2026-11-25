import { useEffect, useSyncExternalStore } from 'react';

export type FrameVerdict = 'pending' | 'smooth' | 'slow';

export type FrameMonitorOptions = {
  /** A frame interval at least this long counts as a dropped frame. */
  longFrameMs: number;
  /** Trailing span of time the long frames must dominate. */
  windowMs: number;
  /** Share of the window's time spent in long frames that means "slow". */
  slowShare: number;
  /** Sampled this long without a slow window, the page is smooth. */
  settleMs: number;
  /** Intervals this long are a paused tab or a debugger, not jank. */
  gapMs: number;
};

export const FRAME_MONITOR_DEFAULTS: FrameMonitorOptions = {
  longFrameMs: 50,
  windowMs: 3000,
  slowShare: 0.6,
  settleMs: 8000,
  gapMs: 1000,
};

/** Decides from rAF intervals (ms, oldest first) whether animated backdrops
 * keep the page below ~20 fps for a sustained stretch. */
export function judgeFrameIntervals(
  intervals: readonly number[],
  options: FrameMonitorOptions = FRAME_MONITOR_DEFAULTS,
): FrameVerdict {
  const { longFrameMs, windowMs, slowShare, settleMs, gapMs } = options;
  const window: number[] = [];
  let windowTotal = 0;
  let windowLong = 0;
  let sampled = 0;

  for (const interval of intervals) {
    if (!(interval > 0) || interval >= gapMs) {
      window.length = 0;
      windowTotal = 0;
      windowLong = 0;
      continue;
    }
    window.push(interval);
    windowTotal += interval;
    sampled += interval;
    if (interval >= longFrameMs) {
      windowLong += interval;
    }
    while (window.length > 1 && windowTotal - window[0]! >= windowMs) {
      const dropped = window.shift()!;
      windowTotal -= dropped;
      if (dropped >= longFrameMs) {
        windowLong -= dropped;
      }
    }
    if (windowTotal >= windowMs && windowLong / windowTotal >= slowShare) {
      return 'slow';
    }
  }

  return sampled >= settleMs ? 'smooth' : 'pending';
}

/** Lazy three.js chunks, image decodes and route work make the first
 * second of a backdrop janky on any machine. */
const WARM_UP_MS = 1200;
const SESSION_KEY = 'tahti:backdrop-still';

let verdict: FrameVerdict = readStoredVerdict();
const listeners = new Set<() => void>();
let activeMonitors = 0;
let rafId: number | null = null;
let intervals: number[] = [];

function readStoredVerdict(): FrameVerdict {
  try {
    return globalThis.sessionStorage?.getItem(SESSION_KEY) === '1'
      ? 'slow'
      : 'pending';
  } catch {
    return 'pending';
  }
}

function setVerdict(next: FrameVerdict): void {
  if (verdict === next) {
    return;
  }
  verdict = next;
  if (next === 'slow') {
    try {
      globalThis.sessionStorage?.setItem(SESSION_KEY, '1');
    } catch {
      // Storage blocked: the decision still holds for this page load.
    }
  }
  listeners.forEach((listener) => listener());
}

function stopSampling(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  intervals = [];
}

function startSampling(): void {
  if (
    rafId !== null ||
    verdict !== 'pending' ||
    typeof requestAnimationFrame !== 'function'
  ) {
    return;
  }
  const startedAt = performance.now();
  let last = startedAt;
  const tick = (now: number) => {
    if (document.hidden) {
      intervals.push(Number.POSITIVE_INFINITY);
    } else if (now - startedAt > WARM_UP_MS) {
      intervals.push(now - last);
    }
    last = now;
    const next = judgeFrameIntervals(intervals);
    if (next !== 'pending') {
      stopSampling();
      setVerdict(next);
      return;
    }
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isSlow(): boolean {
  return verdict === 'slow';
}

/** True once the live frame monitor found that animated backdrops drop
 * frames on this device; stays true for the rest of the session. */
export function useBackdropFramesSlow(): boolean {
  return useSyncExternalStore(subscribe, isSlow, () => false);
}

/** Samples frame times while `animating` is true (an animated backdrop is
 * on screen) until it reaches a verdict, then stops for good. */
export function useBackdropFrameMonitor(animating: boolean): void {
  useEffect(() => {
    if (!animating) {
      return;
    }
    activeMonitors += 1;
    startSampling();
    return () => {
      activeMonitors -= 1;
      if (activeMonitors === 0) {
        stopSampling();
      }
    };
  }, [animating]);
}

/** Storybook and tests: pin the verdict instead of measuring. */
export function setBackdropFrameVerdict(next: FrameVerdict): void {
  stopSampling();
  if (next !== 'slow') {
    try {
      globalThis.sessionStorage?.removeItem(SESSION_KEY);
    } catch {
      // Nothing stored to clear.
    }
  }
  setVerdict(next);
}
