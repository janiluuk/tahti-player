// jsdom drives every requestAnimationFrame from one shared setInterval that it
// creates on the first pending callback. Created under a file's fake timers,
// that interval never fires once real timers return, and frames stay dead
// for every later file in the worker (motion values stuck at their initial
// style, rAF-awaiting tests time out). One timeout per frame has no shared
// state to strand.
//
// motion captures `requestAnimationFrame` once, when it is first imported in a
// worker, and keeps that reference for every later file. So this must run
// before setup.ts imports motion, and must schedule on the real timers taken
// here: a frame queued on a file's fake timers would be dropped by
// `vi.useRealTimers()` and leave motion's frame loop waiting forever.
const realSetTimeout = globalThis.setTimeout;
const realClearTimeout = globalThis.clearTimeout;

export function installAnimationFrames(): void {
  const request = (callback: FrameRequestCallback) =>
    realSetTimeout(() => callback(performance.now()), 16) as unknown as number;
  const cancel = (handle: number) => realClearTimeout(handle);
  window.requestAnimationFrame = request;
  window.cancelAnimationFrame = cancel;
  globalThis.requestAnimationFrame = request;
  globalThis.cancelAnimationFrame = cancel;
}

installAnimationFrames();
