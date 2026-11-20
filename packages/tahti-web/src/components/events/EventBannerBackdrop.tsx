import { MediaArtwork } from '@tahti-player/ui';

/** The event banner (or default artwork) blurred and slowly drifting behind
 * the event hero. Fills its positioned parent; static under reduced motion. */
export function EventBannerBackdrop({
  src,
  seed,
}: {
  src: string | null;
  seed: string;
}) {
  return (
    <div
      aria-hidden
      data-testid="event-banner-backdrop"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="tahti-event-backdrop-drift absolute -inset-[15%] opacity-60 blur-3xl saturate-150">
        <MediaArtwork src={src} alt="" seed={seed} imageReveal={false} />
      </div>
      <div className="from-background/30 via-background/60 to-background absolute inset-0 bg-linear-to-b" />
    </div>
  );
}
