import { useEffect, useState } from 'react';

import { Meter } from '@tahti-player/ui';

import type {
  ChannelNowPlaying,
  ChannelNowPlayingNext,
} from '../../api/channel-now-playing-types';
import { formatDuration } from '../../lib/playableToTrack';

/** How far past its duration a track may run before the progress bar is
 * hidden - the poller only notices a track change on its next sync, so a
 * short overrun is expected; a long one means the data is stale. */
const OVERRUN_GRACE_SEC = 30;
/** Tolerated server/client clock skew for a `startedAt` in the future. */
const FUTURE_SKEW_SEC = 60;

export type TrackProgress = {
  elapsedSec: number;
  remainingSec: number;
  durationSec: number;
};

export function computeTrackProgress(
  startedAt: string | null | undefined,
  durationSec: number | null | undefined,
  nowMs: number,
): TrackProgress | null {
  if (
    !startedAt ||
    durationSec == null ||
    !Number.isFinite(durationSec) ||
    durationSec <= 0
  ) {
    return null;
  }
  const startedMs = Date.parse(startedAt);
  if (!Number.isFinite(startedMs)) {
    return null;
  }
  const rawElapsed = (nowMs - startedMs) / 1000;
  if (
    rawElapsed < -FUTURE_SKEW_SEC ||
    rawElapsed > durationSec + OVERRUN_GRACE_SEC
  ) {
    return null;
  }
  const elapsedSec = Math.min(durationSec, Math.max(0, rawElapsed));
  return {
    elapsedSec,
    remainingSec: durationSec - elapsedSec,
    durationSec,
  };
}

function useNowMs(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) {
      return;
    }
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

type Props = {
  nowPlaying: ChannelNowPlaying;
  next?: ChannelNowPlayingNext | null;
};

/** Time left in the current rotation track and, on curated rotations, the
 * track that plays after it. Renders nothing when neither is known. */
export function ChannelStageTrackMeta({ nowPlaying, next }: Props) {
  const timed = Boolean(nowPlaying.startedAt && nowPlaying.durationSec);
  const nowMs = useNowMs(timed);
  const progress = computeTrackProgress(
    nowPlaying.startedAt,
    nowPlaying.durationSec,
    nowMs,
  );

  if (!progress && !next) {
    return null;
  }

  const remaining = formatDuration(Math.ceil(progress?.remainingSec ?? 0));

  return (
    <div className="mt-3 flex max-w-2xl flex-col gap-1.5 text-xs text-white/75">
      {progress && (
        <div className="flex items-center gap-3">
          <Meter
            value={Math.floor(progress.elapsedSec)}
            max={progress.durationSec}
            className="flex-1"
            trackClassName="bg-white/20"
            barClassName="bg-white/80"
            aria-label={`Track progress, ${remaining} left`}
          />
          <span className="shrink-0 tabular-nums">{remaining} left</span>
        </div>
      )}
      {next && (
        <p className="truncate">
          <span className="text-white/55">Up next:</span> {next.title} -{' '}
          {next.artistName}
        </p>
      )}
    </div>
  );
}
