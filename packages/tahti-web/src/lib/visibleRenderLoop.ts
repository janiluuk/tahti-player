export type RenderSize = { width: number; height: number };

export type VisibleRenderLoopOptions = {
  /** Frames closer together than this are skipped (a frame-rate cap). */
  minFrameMs?: number;
  /** Called before a frame whenever the element's size changed since the last one. */
  onResize: (size: RenderSize) => void;
  render: (now: number) => void;
};

/**
 * Runs `render` on animation frames only while `element` is on screen, the
 * page is visible and the element has a size. While any of those is false no
 * frames are requested at all. The size comes from a ResizeObserver, so
 * frames never read layout. Returns a stop function.
 */
export function startVisibleRenderLoop(
  element: HTMLElement,
  { minFrameMs = 0, onResize, render }: VisibleRenderLoopOptions,
): () => void {
  let size: RenderSize = {
    width: element.clientWidth,
    height: element.clientHeight,
  };
  let resized = true;
  let onScreen = true;
  let frame = 0;
  let lastFrame = -Infinity;
  let stopped = false;

  const active = () =>
    !stopped &&
    onScreen &&
    !document.hidden &&
    size.width > 0 &&
    size.height > 0;

  const draw = (now: number) => {
    frame = 0;
    if (!active()) {
      return;
    }
    frame = requestAnimationFrame(draw);
    if (now - lastFrame < minFrameMs) {
      return;
    }
    lastFrame = now;
    if (resized) {
      resized = false;
      onResize(size);
    }
    render(now);
  };

  const wake = () => {
    if (frame === 0 && active()) {
      frame = requestAnimationFrame(draw);
    }
  };

  const resizeObserver =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver((entries) => {
          const box = entries[entries.length - 1]?.contentRect;
          if (!box) {
            return;
          }
          const next = {
            width: Math.round(box.width),
            height: Math.round(box.height),
          };
          if (next.width !== size.width || next.height !== size.height) {
            size = next;
            resized = true;
          }
          wake();
        });
  resizeObserver?.observe(element);

  const intersectionObserver =
    typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver((entries) => {
          const entry = entries[entries.length - 1];
          if (entry) {
            onScreen = entry.isIntersecting;
            wake();
          }
        });
  intersectionObserver?.observe(element);

  document.addEventListener('visibilitychange', wake);
  wake();

  return () => {
    stopped = true;
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    document.removeEventListener('visibilitychange', wake);
  };
}
