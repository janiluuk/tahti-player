import { Button, Meter } from '@tahti-player/ui';

export function ReleaseTrackUploadProgress({
  title,
  progress,
  onCancel,
}: {
  title: string;
  progress: number;
  onCancel: () => void;
}) {
  const pct = Math.round(progress * 100);
  return (
    <div className="flex w-full items-center gap-2 text-xs">
      <Meter
        value={pct}
        className="flex-1"
        aria-label={`Uploading ${title}, ${pct}%`}
      />
      <span className="text-foreground-secondary w-9 text-right tabular-nums">
        {pct}%
      </span>
      <Button size="sm" variant="text" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}
