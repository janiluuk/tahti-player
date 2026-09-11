// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChannelSlideshowBackdrop } from './ChannelSlideshowBackdrop';

const IMAGES = [
  'https://example.com/one.jpg',
  'https://example.com/two.jpg',
  'https://example.com/three.jpg',
];

function renderBackdrop(props: {
  images: string[];
  preset?: string | null;
  intervalSeconds?: number;
  transitionMs?: number;
  autoplay?: boolean;
}): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<ChannelSlideshowBackdrop {...props} />);
  });
  return { container, root };
}

describe('ChannelSlideshowBackdrop', () => {
  // jsdom doesn't implement WebGL at all — every mount now probes it via
  // `supportsWebGL()`, so stub getContext to return null (the same as a real
  // WebGL-unavailable browser) instead of jsdom's noisy per-call "not
  // implemented" console.error.
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders nothing for an empty image list', () => {
    const { container } = renderBackdrop({ images: [] });
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders a single image statically and never starts a transition', () => {
    vi.useFakeTimers();
    const { container } = renderBackdrop({
      images: [IMAGES[0]!],
      autoplay: true,
      intervalSeconds: 1,
    });
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    const imgs = container.querySelectorAll('img');
    expect(imgs).toHaveLength(1);
    expect(imgs[0]?.getAttribute('src')).toBe(IMAGES[0]);
  });

  it('stays on the first image when autoplay is off', () => {
    vi.useFakeTimers();
    const { container } = renderBackdrop({
      images: IMAGES,
      autoplay: false,
      intervalSeconds: 1,
    });
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    const imgs = container.querySelectorAll('img');
    expect(imgs).toHaveLength(1);
    expect(imgs[0]?.getAttribute('src')).toBe(IMAGES[0]);
  });

  it('crossfades to the next image after the interval, then settles on it', () => {
    vi.useFakeTimers();
    const { container } = renderBackdrop({
      images: IMAGES,
      preset: 'FADE',
      autoplay: true,
      intervalSeconds: 5,
      transitionMs: 500,
    });

    // Still on the first image before the interval elapses.
    act(() => {
      vi.advanceTimersByTime(4_000);
    });
    expect(container.querySelectorAll('img')).toHaveLength(1);
    expect(container.querySelector('img')?.getAttribute('src')).toBe(IMAGES[0]);

    // Interval fires — the crossfade mounts both the current and next image.
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    const midImgs = Array.from(container.querySelectorAll('img')).map((img) =>
      img.getAttribute('src'),
    );
    expect(midImgs).toEqual([IMAGES[0], IMAGES[1]]);

    // Transition duration elapses — settles back to a single, advanced image.
    act(() => {
      vi.advanceTimersByTime(500);
    });
    const settledImgs = container.querySelectorAll('img');
    expect(settledImgs).toHaveLength(1);
    expect(settledImgs[0]?.getAttribute('src')).toBe(IMAGES[1]);
  });

  it('resets to the first image when the image set changes', () => {
    vi.useFakeTimers();
    const { container, root } = renderBackdrop({
      images: IMAGES,
      preset: 'FADE',
      autoplay: true,
      intervalSeconds: 5,
      transitionMs: 500,
    });
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(container.querySelector('img')?.getAttribute('src')).toBe(IMAGES[1]);

    act(() => {
      root.render(
        <ChannelSlideshowBackdrop
          images={[IMAGES[2]!]}
          preset="FADE"
          autoplay
          intervalSeconds={5}
          transitionMs={500}
        />,
      );
    });
    expect(container.querySelectorAll('img')).toHaveLength(1);
    expect(container.querySelector('img')?.getAttribute('src')).toBe(IMAGES[2]);
  });

  it('falls back to a CSS crossfade for a WebGL preset when the browser has no WebGL context', () => {
    vi.useFakeTimers();
    const { container } = renderBackdrop({
      images: IMAGES,
      preset: 'CUBE_FLIP',
      autoplay: true,
      intervalSeconds: 5,
      transitionMs: 500,
    });

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    // Mid-crossfade: two images, not a WebGL canvas.
    const midImgs = Array.from(container.querySelectorAll('img')).map((img) =>
      img.getAttribute('src'),
    );
    expect(midImgs).toEqual([IMAGES[0], IMAGES[1]]);
    expect(container.querySelector('canvas')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(500);
    });
    const settledImgs = container.querySelectorAll('img');
    expect(settledImgs).toHaveLength(1);
    expect(settledImgs[0]?.getAttribute('src')).toBe(IMAGES[1]);
  });
});
