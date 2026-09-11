import { useEffect, useMemo, useState } from 'react';

import { supportsWebGL } from '../lib/webgl';
import {
  CssCrossfadeTransition,
  isCssSlideshowPreset,
  isWebglSlideshowPreset,
  WebglSlideshowTransition,
} from './visuals/slideshowTransitions';

export type ChannelSlideshowBackdropProps = {
  images: string[];
  /** One of the 8 `SLIDESHOW_PRESETS` from `ChannelDesigner` — FADE/ZOOM/PAN/
   * BLUR_CROSS render as a CSS crossfade, the other 4 as a WebGL transition.
   * Falls back to a plain FADE crossfade for an unrecognized value, or when
   * the browser can't create a WebGL context (see `lib/webgl.ts`). */
  preset?: string | null;
  intervalSeconds?: number;
  transitionMs?: number;
  autoplay?: boolean;
  className?: string;
};

const DEFAULT_INTERVAL_SECONDS = 8;
const DEFAULT_TRANSITION_MS = 600;

/** A full-bleed image that rotates through `images` on a timer, crossfading
 * with the configured transition preset — the channel backdrop's "Static
 * slideshow" gallery mode. A single image (or autoplay off) just renders
 * statically, matching the plain-`<img>` behavior this replaces. */
export function ChannelSlideshowBackdrop({
  images,
  preset,
  intervalSeconds = DEFAULT_INTERVAL_SECONDS,
  transitionMs = DEFAULT_TRANSITION_MS,
  autoplay = true,
  className,
}: ChannelSlideshowBackdropProps) {
  const [index, setIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  // Checked once per mount, not per transition — a browser's WebGL capability
  // doesn't change mid-session, and re-probing on every crossfade would just
  // create/discard a canvas repeatedly for no reason.
  const webglOk = useMemo(() => supportsWebGL(), []);

  // Reset to the first image whenever the set of images changes (e.g. the
  // editor adds/removes a slide) rather than pointing at a now-stale index.
  useEffect(() => {
    setIndex(0);
    setTransitioning(false);
  }, [images.join('\n')]);

  useEffect(() => {
    if (!autoplay || images.length < 2) {
      return;
    }
    const id = window.setInterval(
      () => setTransitioning(true),
      Math.max(1, intervalSeconds) * 1000,
    );
    return () => window.clearInterval(id);
  }, [autoplay, images.length, intervalSeconds]);

  const currentUrl = images[index];
  if (!currentUrl) {
    return null;
  }

  const advance = () => {
    setIndex((current) => (current + 1) % images.length);
    setTransitioning(false);
  };

  if (transitioning && images.length > 1) {
    const nextUrl = images[(index + 1) % images.length]!;
    if (isWebglSlideshowPreset(preset) && webglOk) {
      return (
        <div className={className}>
          <img
            src={currentUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <WebglSlideshowTransition
            preset={preset}
            fromUrl={currentUrl}
            toUrl={nextUrl}
            durationMs={transitionMs}
            onComplete={advance}
          />
        </div>
      );
    }
    return (
      <div className={className}>
        <CssCrossfadeTransition
          preset={isCssSlideshowPreset(preset) ? preset : 'FADE'}
          fromUrl={currentUrl}
          toUrl={nextUrl}
          durationMs={transitionMs}
          onComplete={advance}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <img
        src={currentUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}
