import { Button, MediaArtwork } from '@tahti-player/ui';

import { Eyebrow } from '../tahti/Eyebrow';

export type RadioOverlayItem = {
  title: string;
  subtitle: string;
  artworkUrl?: string | null;
};

/** What is on Tahti Radio right now, on a solid card over the visualizer so
 * it stays readable on any preset, plus a "Next" line when the next track or
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
      className="border-border bg-background/90 flex max-w-xl min-w-0 flex-col gap-2 rounded-lg border p-3 backdrop-blur-sm"
      data-testid="radio-now-playing-overlay"
    >
      <div className="flex min-w-0 items-center gap-3">
        {current?.artworkUrl ? (
          <MediaArtwork
            size="thumb"
            src={current.artworkUrl}
            alt=""
            className="shrink-0 rounded-md"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <Eyebrow tone="green">{label}</Eyebrow>
          {current && onCurrentInfo ? (
            <Button
              type="button"
              variant="text"
              size="flexible"
              onClick={onCurrentInfo}
              className="text-foreground block max-w-full truncate p-0 text-lg font-bold tracking-tight underline-offset-4 hover:underline"
            >
              {current.title}
            </Button>
          ) : (
            <div className="text-foreground truncate text-lg font-bold tracking-tight">
              {current?.title ?? '24/7 rotation'}
            </div>
          )}
          <div className="text-foreground-secondary truncate text-sm">
            {current?.subtitle ?? 'Tahti Radio'}
          </div>
        </div>
      </div>
      {next ? (
        <p
          className="border-border text-foreground-secondary truncate border-t pt-2 text-xs"
          data-testid="radio-now-playing-next"
        >
          <span className="text-foreground font-semibold">Next:</span>{' '}
          {next.title} - {next.subtitle}
        </p>
      ) : null}
    </div>
  );
}
