import { lazy, Suspense, type ComponentType } from 'react';

import type { SlideshowTransitionProps } from './types';

// Lazy-loaded like ChannelVisualizer's presets — each pulls in Three.js, which is large.
const ParticleDissolve = lazy(() =>
  import('./ParticleDissolveTransition').then((m) => ({
    default: m.ParticleDissolveTransition,
  })),
);
const GlitchWipe = lazy(() =>
  import('./GlitchWipeTransition').then((m) => ({
    default: m.GlitchWipeTransition,
  })),
);
const CubeFlip = lazy(() =>
  import('./CubeFlipTransition').then((m) => ({
    default: m.CubeFlipTransition,
  })),
);
const LiquidDistortion = lazy(() =>
  import('./LiquidDistortionTransition').then((m) => ({
    default: m.LiquidDistortionTransition,
  })),
);

export const WEBGL_SLIDESHOW_PRESETS = [
  'PARTICLE_DISSOLVE',
  'GLITCH_WIPE',
  'CUBE_FLIP',
  'LIQUID_DISTORTION',
] as const;

export type WebglSlideshowPreset = (typeof WEBGL_SLIDESHOW_PRESETS)[number];

const COMPONENTS: Record<
  WebglSlideshowPreset,
  ComponentType<SlideshowTransitionProps>
> = {
  PARTICLE_DISSOLVE: ParticleDissolve,
  GLITCH_WIPE: GlitchWipe,
  CUBE_FLIP: CubeFlip,
  LIQUID_DISTORTION: LiquidDistortion,
};

export function isWebglSlideshowPreset(
  preset: string | null | undefined,
): preset is WebglSlideshowPreset {
  return WEBGL_SLIDESHOW_PRESETS.includes(preset as WebglSlideshowPreset);
}

/** Renders the WebGL transition for a given slideshow preset, or null if the preset
 * isn't a WebGL one (caller should check `isWebglSlideshowPreset` first). */
export function WebglSlideshowTransition({
  preset,
  ...props
}: SlideshowTransitionProps & { preset: WebglSlideshowPreset }) {
  const Component = COMPONENTS[preset];
  return (
    <Suspense fallback={null}>
      <Component {...props} />
    </Suspense>
  );
}
