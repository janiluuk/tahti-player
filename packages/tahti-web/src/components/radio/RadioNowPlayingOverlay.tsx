import { Button } from '@tahti-player/ui';

export type RadioOverlayItem = {
  title: string;
  subtitle: string;
  artworkUrl?: string | null;
};

/** What is on Tahti Radio right now, on a see-through card over the
 * visualizer: blurred glass tinted with the cover's darkened colour
 * (`--radio-ambient`, set by RadioPlayerWidget) and white text with a soft
 * shadow, so it stays readable on any preset. The cover itself is the hero's
 * thumbnail, so the card has none. Adds a "Next" line when the next track or
 * show is known. */
export function RadioNowPlayingOverlay({
  label,
  current,
  next,
  onCurrentInfo,
}: {
  label: string;
  current: RadioOverlayItem | null;
  next: RadioOverlayItem | null;
  onCurrentInfo?: () => void;
}) {
  return (
    <div
      className="flex max-w-xl min-w-0 flex-col gap-2 rounded-lg border border-white/15 bg-linear-to-br from-[rgb(var(--radio-ambient,12_12_16)/0.55)] to-[rgb(var(--radio-ambient,12_12_16)/0.25)] p-3 text-white shadow-lg backdrop-blur-md [text-shadow:0_1px_2px_rgb(0_0_0/0.55)]"
      data-testid="radio-now-playing-overlay"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.2em] text-white/90 uppercase">
            <span
              aria-hidden
              className="bg-accent-green size-2 shrink-0 rounded-full shadow-[0_0_6px_currentColor]"
            />
            {label}
          </span>
          {current && onCurrentInfo ? (
            <Button
              type="button"
              variant="text"
              size="flexible"
              onClick={onCurrentInfo}
              className="block max-w-full truncate p-0 text-lg font-bold tracking-tight text-white underline-offset-4 hover:underline"
            >
              {current.title}
            </Button>
          ) : (
            <div className="truncate text-lg font-bold tracking-tight text-white">
              {current?.title ?? '24/7 rotation'}
            </div>
          )}
          <div className="truncate text-sm text-white/80">
            {current?.subtitle ?? 'Tahti Radio'}
          </div>
        </div>
      </div>
      {next ? (
        <p
          className="truncate border-t border-white/15 pt-2 text-xs text-white/80"
          data-testid="radio-now-playing-next"
        >
          <span className="font-semibold text-white">Next:</span> {next.title} -{' '}
          {next.subtitle}
        </p>
      ) : null}
    </div>
  );
}
