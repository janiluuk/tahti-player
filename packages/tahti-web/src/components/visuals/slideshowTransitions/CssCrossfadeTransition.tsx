import { useEffect, useRef, useState, type CSSProperties } from 'react';

import type { SlideshowTransitionProps } from './types';

export const CSS_SLIDESHOW_PRESETS = [
  'FADE',
  'ZOOM',
  'PAN',
  'BLUR_CROSS',
] as const;

export type CssSlideshowPreset = (typeof CSS_SLIDESHOW_PRESETS)[number];

export function isCssSlideshowPreset(
  preset: string | null | undefined,
): preset is CssSlideshowPreset {
  return CSS_SLIDESHOW_PRESETS.includes(preset as CssSlideshowPreset);
}

const BASE_STYLE: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  transitionTimingFunction: 'ease-in-out',
  willChange: 'opacity, transform, filter',
};

/** From/to layer styles per preset, keyed on whether the transition has
 * "entered" (crossed from its start state to its end state) yet. */
function layerStyle(
  preset: CssSlideshowPreset,
  layer: 'from' | 'to',
  entered: boolean,
): CSSProperties {
  switch (preset) {
    case 'ZOOM':
      return layer === 'from'
        ? { opacity: entered ? 0 : 1 }
        : {
            opacity: entered ? 1 : 0,
            transform: entered ? 'scale(1)' : 'scale(1.06)',
          };
    case 'PAN':
      return layer === 'from'
        ? {
            opacity: entered ? 0 : 1,
            transform: entered ? 'translateX(-6%)' : 'translateX(0)',
          }
        : {
            opacity: entered ? 1 : 0,
            transform: entered ? 'translateX(0)' : 'translateX(6%)',
          };
    case 'BLUR_CROSS':
      return layer === 'from'
        ? {
            opacity: entered ? 0 : 1,
            filter: entered ? 'blur(12px)' : 'blur(0px)',
          }
        : {
            opacity: entered ? 1 : 0,
            filter: entered ? 'blur(0px)' : 'blur(12px)',
          };
    case 'FADE':
    default:
      return layer === 'from'
        ? { opacity: entered ? 0 : 1 }
        : { opacity: entered ? 1 : 0 };
  }
}

/** CSS-only crossfade counterpart to `WebglSlideshowTransition` — same
 * `SlideshowTransitionProps` shape, so callers can treat all 8 slideshow
 * presets uniformly. Mounts both images stacked, flips a boolean on the
 * next frame so the CSS transition actually animates, and calls
 * `onComplete` once `durationMs` has elapsed. */
export function CssCrossfadeTransition({
  preset,
  fromUrl,
  toUrl,
  durationMs,
  onComplete,
}: SlideshowTransitionProps & { preset: CssSlideshowPreset }) {
  const [entered, setEntered] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setEntered(false);
    const raf = requestAnimationFrame(() => setEntered(true));
    const timer = window.setTimeout(() => onCompleteRef.current(), durationMs);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [fromUrl, toUrl, durationMs]);

  const duration = `${durationMs}ms`;

  return (
    <div
      aria-hidden
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
    >
      <img
        src={fromUrl}
        alt=""
        style={{
          ...BASE_STYLE,
          ...layerStyle(preset, 'from', entered),
          transitionDuration: duration,
          transitionProperty: 'opacity, transform, filter',
        }}
      />
      <img
        src={toUrl}
        alt=""
        style={{
          ...BASE_STYLE,
          ...layerStyle(preset, 'to', entered),
          transitionDuration: duration,
          transitionProperty: 'opacity, transform, filter',
        }}
      />
    </div>
  );
}
