import { useState } from 'react';

import { MediaArtwork, usePrefersReducedMotion } from '@tahti-player/ui';

import {
  useBackdropFrameMonitor,
  useBackdropFramesSlow,
} from '../../lib/backdropMotion';
import { hasSoftwareWebGL } from '../../lib/webgl';

/** The event banner (or default artwork) blurred and slowly drifting behind
 * the event hero. Fills its positioned parent; still under reduced motion,
 * without a GPU and once the frame monitor sees frames drop, where each
 * drift step re-blurs the whole banner. */
export function EventBannerBackdrop({
  src,
  seed,
}: {
  src: string | null;
  seed: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [softwareRendering] = useState(hasSoftwareWebGL);
  const framesSlow = useBackdropFramesSlow();
  const still = reducedMotion || softwareRendering || framesSlow;
  useBackdropFrameMonitor(!still);
  return (
    <div
      aria-hidden
      data-testid="event-banner-backdrop"
      data-still={still || undefined}
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="tahti-event-backdrop-drift absolute -inset-[15%] opacity-60 blur-3xl saturate-150">
        <MediaArtwork src={src} alt="" seed={seed} imageReveal={false} />
      </div>
      <div className="from-background/30 via-background/60 to-background absolute inset-0 bg-linear-to-b" />
    </div>
  );
}
