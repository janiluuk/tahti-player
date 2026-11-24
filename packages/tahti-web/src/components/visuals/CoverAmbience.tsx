import { useId, type CSSProperties } from 'react';

import { cn, usePrefersReducedMotion } from '@tahti-player/ui';

export type CoverAmbienceVariant = 'glow' | 'water';

type Props = {
  coverUrl?: string | null;
  /** Dominant cover colour; tints the light and the water. */
  rgb?: [number, number, number] | null;
  variant: CoverAmbienceVariant;
  className?: string;
};

function rgba(rgb: [number, number, number] | null | undefined, alpha: number) {
  return rgb
    ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
    : `rgba(120, 120, 140, ${alpha})`;
}

/**
 * Background built only from the cover art, for when the visualizer is off.
 * `glow`: the blurred cover with slowly drifting colour light. `water`: the
 * cover's upper part as a slowly panning landscape over its own reflection,
 * which ripples. Motion stops under prefers-reduced-motion.
 */
export function CoverAmbience({ coverUrl, rgb, variant, className }: Props) {
  const filterId = `cover-ripple-${useId().replace(/:/g, '')}`;
  const still = usePrefersReducedMotion();
  const image = coverUrl ? `url("${coverUrl}")` : undefined;

  if (variant === 'glow') {
    return (
      <div
        data-testid="cover-ambience"
        data-variant="glow"
        aria-hidden
        className={cn('absolute inset-0 overflow-hidden', className)}
      >
        <div
          className="tahti-event-backdrop-drift absolute -inset-[15%] bg-cover bg-center opacity-70 blur-3xl saturate-150"
          style={{ backgroundImage: image }}
        />
        <div
          className="tahti-event-backdrop-drift absolute inset-0 mix-blend-screen"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 30%, ${rgba(rgb, 0.45)}, transparent 55%), radial-gradient(circle at 75% 70%, ${rgba(rgb, 0.3)}, transparent 50%)`,
            animationDuration: '52s',
            animationDirection: 'alternate-reverse',
          }}
        />
        <div className="bg-background/30 absolute inset-0" />
      </div>
    );
  }

  const layer: CSSProperties = {
    backgroundImage: image,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
  };

  return (
    <div
      data-testid="cover-ambience"
      data-variant="water"
      aria-hidden
      className={cn('absolute inset-0 overflow-hidden bg-black', className)}
    >
      <svg className="absolute size-0" aria-hidden focusable="false">
        <filter id={filterId} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.006 0.06"
            numOctaves="2"
            seed="7"
            result="noise"
          >
            {still ? null : (
              <animate
                attributeName="baseFrequency"
                dur="14s"
                values="0.006 0.06;0.008 0.075;0.006 0.06"
                repeatCount="indefinite"
              />
            )}
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="14"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
      <div
        data-testid="cover-ambience-land"
        className="tahti-cover-pan absolute inset-x-0 top-0 h-[58%]"
        style={{ ...layer, backgroundPosition: '50% 35%' }}
      />
      {/* The reflection is the landscape box itself, flipped about its own
          centre so its top row meets the horizon, then cropped to the
          water's 42%. */}
      <div className="absolute inset-x-0 bottom-0 h-[42%] overflow-hidden">
        <div
          data-testid="cover-ambience-water"
          className="tahti-cover-pan absolute -inset-x-6 top-0 h-[138.1%] -scale-y-100"
          style={{
            ...layer,
            backgroundPosition: '50% 35%',
            filter: `url(#${filterId}) brightness(0.7) saturate(1.2)`,
          }}
        />
      </div>
      <div
        className="absolute inset-x-0 bottom-0 h-[42%]"
        style={{
          backgroundImage: `linear-gradient(to bottom, ${rgba(rgb, 0.35)}, rgba(0, 0, 0, 0.55))`,
        }}
      />
      <div className="absolute inset-x-0 top-[58%] h-px -translate-y-px bg-white/15 blur-[1px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/40" />
    </div>
  );
}
