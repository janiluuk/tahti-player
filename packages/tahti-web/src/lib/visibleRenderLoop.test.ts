import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { startVisibleRenderLoop } from './visibleRenderLoop';

type Callback = (now: number) => void;

let frames: Map<number, Callback>;
let nextFrame: number;
let resizeCallbacks: Array<(entries: unknown[]) => void>;
let intersectionCallbacks: Array<(entries: unknown[]) => void>;
let hidden: boolean;

const runFrame = (now: number) => {
  const pending = [...frames.values()];
  frames.clear();
  pending.forEach((callback) => callback(now));
};

const resizeTo = (width: number, height: number) =>
  resizeCallbacks.forEach((callback) =>
    callback([{ contentRect: { width, height } }]),
  );

const setOnScreen = (isIntersecting: boolean) =>
  intersectionCallbacks.forEach((callback) => callback([{ isIntersecting }]));

const setHidden = (value: boolean) => {
  hidden = value;
  document.dispatchEvent(new Event('visibilitychange'));
};

function element(width = 300, height = 150) {
  const node = document.createElement('canvas');
  Object.defineProperty(node, 'clientWidth', { value: width });
  Object.defineProperty(node, 'clientHeight', { value: height });
  return node;
}

beforeEach(() => {
  frames = new Map();
  nextFrame = 1;
  resizeCallbacks = [];
  intersectionCallbacks = [];
  hidden = false;
  vi.stubGlobal('requestAnimationFrame', (callback: Callback) => {
    const id = nextFrame++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: (entries: unknown[]) => void) {
        resizeCallbacks.push(callback);
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: (entries: unknown[]) => void) {
        intersectionCallbacks.push(callback);
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('startVisibleRenderLoop', () => {
  it('sizes once, then renders every frame past the frame cap', () => {
    const onResize = vi.fn();
    const render = vi.fn();
    startVisibleRenderLoop(element(), { minFrameMs: 30, onResize, render });

    runFrame(0);
    runFrame(10);
    runFrame(40);
    expect(onResize).toHaveBeenCalledTimes(1);
    expect(onResize).toHaveBeenCalledWith({ width: 300, height: 150 });
    expect(render.mock.calls.map(([now]) => now)).toEqual([0, 40]);
  });

  it('resizes only when the observed size changes', () => {
    const onResize = vi.fn();
    startVisibleRenderLoop(element(), { onResize, render: vi.fn() });
    runFrame(0);
    resizeTo(300, 150);
    runFrame(20);
    resizeTo(640, 360.4);
    runFrame(40);
    expect(onResize.mock.calls.map(([size]) => size)).toEqual([
      { width: 300, height: 150 },
      { width: 640, height: 360 },
    ]);
  });

  it('stops requesting frames offscreen, hidden or with no size, and wakes again', () => {
    const render = vi.fn();
    startVisibleRenderLoop(element(), { onResize: vi.fn(), render });
    runFrame(0);

    setOnScreen(false);
    runFrame(20);
    expect(frames.size).toBe(0);
    setOnScreen(true);
    runFrame(40);

    setHidden(true);
    runFrame(60);
    expect(frames.size).toBe(0);
    setHidden(false);
    runFrame(80);

    resizeTo(0, 0);
    runFrame(100);
    expect(frames.size).toBe(0);
    resizeTo(200, 100);
    runFrame(120);

    expect(render.mock.calls.map(([now]) => now)).toEqual([0, 40, 80, 120]);
  });

  it('does not start for an element without a size', () => {
    startVisibleRenderLoop(element(0, 0), {
      onResize: vi.fn(),
      render: vi.fn(),
    });
    expect(frames.size).toBe(0);
  });

  it('cancels its frame and ignores observers after stop', () => {
    const render = vi.fn();
    const stop = startVisibleRenderLoop(element(), {
      onResize: vi.fn(),
      render,
    });
    stop();
    expect(frames.size).toBe(0);
    setOnScreen(true);
    resizeTo(500, 500);
    setHidden(false);
    expect(frames.size).toBe(0);
    expect(render).not.toHaveBeenCalled();
  });
});
