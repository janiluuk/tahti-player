import { Badge, cn } from '@tahti-player/ui';

/** Red-bordered pill with a pulsing dot for a live/on-air state — kept off
 * the brand amber so "live" reads as its own signal, not another CTA.
 * Pulse is Tailwind's `motion-safe:` variant, so it's automatically
 * inert under prefers-reduced-motion — no extra JS needed. */
export function OnAirBadge({
  label = 'ON AIR',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <Badge
      variant="pill"
      color="red"
      className={cn(
        'bg-background-input text-accent-red border-accent-red gap-2 border px-3 py-1 font-mono tracking-wide',
        className,
      )}
    >
      <span
        className="bg-accent-red h-2 w-2 rounded-full motion-safe:animate-pulse"
        aria-hidden
      />
      {label}
    </Badge>
  );
}
