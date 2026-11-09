import { Button } from '@tahti-player/ui';

export type RadioOverlayItem = {
  title: string;
  subtitle: string;
  artworkUrl?: string | null;
};

/** What is on Tahti Radio right now, as text laid straight over the
 * visualizer with no card behind it: white type with a soft shadow, readable
 * against the hero's ambient scrim. Adds a "Next" line when the next track or
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
      className="flex max-w-xl min-w-0 flex-col gap-1.5 text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.7)]"
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
              className="font-display block max-w-full truncate p-0 text-xl font-semibold tracking-tight text-white underline-offset-4 hover:underline sm:text-2xl"
            >
              {current.title}
            </Button>
          ) : (
            <div className="font-display truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">
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
          className="truncate text-xs text-white/80"
          data-testid="radio-now-playing-next"
        >
          <span className="font-semibold text-white">Next:</span> {next.title} -{' '}
          {next.subtitle}
        </p>
      ) : null}
    </div>
  );
}
