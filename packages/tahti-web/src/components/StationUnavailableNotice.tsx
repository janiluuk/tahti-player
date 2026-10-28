import { RadioTowerIcon, RotateCcwIcon } from 'lucide-react';

import { Alert, Button } from '@tahti-player/ui';

import {
  streamFailureDescription,
  streamFailureLabel,
  type StreamFailure,
} from '../lib/streamFailure';
import { usePlayerStore } from '../stores/playerStore';
import { useStationHealth } from '../stores/stationHealthStore';

/** The failure to show for a station: its own failed playback first, else
 * the session's health check of its stream. */
export function useStationFailure(
  playableId: string,
  streamUrl: string | null | undefined,
): StreamFailure | null {
  const playbackFailure = usePlayerStore((s) =>
    s.currentId === playableId && s.status === 'error' ? s.failure : null,
  );
  const health = useStationHealth(streamUrl);
  if (playbackFailure) {
    return playbackFailure;
  }
  return health?.state === 'unavailable' ? health.failure : null;
}

/** "Station unavailable" with the reason and a Try again. Try again reloads
 * the station when it is the current item, else starts it with `onPlay`. */
export function StationUnavailableNotice({
  playableId,
  streamUrl,
  onPlay,
  className,
}: {
  playableId: string;
  streamUrl: string | null | undefined;
  onPlay: () => void;
  className?: string;
}) {
  const failure = useStationFailure(playableId, streamUrl);
  const isCurrent = usePlayerStore((s) => s.currentId === playableId);
  const retry = usePlayerStore((s) => s.retry);
  if (!failure) {
    return null;
  }
  return (
    <Alert
      tone="error"
      className={className}
      icon={<RadioTowerIcon size={16} aria-hidden />}
      title={`Station unavailable · ${streamFailureLabel(failure)}`}
      data-testid="station-unavailable"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="min-w-0 flex-1 basis-56">
          {streamFailureDescription(failure)}
        </span>
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          onClick={isCurrent ? retry : onPlay}
        >
          <RotateCcwIcon size={14} aria-hidden />
          Try again
        </Button>
      </div>
    </Alert>
  );
}
