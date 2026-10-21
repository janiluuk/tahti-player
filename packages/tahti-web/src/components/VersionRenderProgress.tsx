import { useEffect, useState } from 'react';

import { Meter } from '@tahti-player/ui';

import {
  subscribeToVersionProgress,
  type VersionProgress,
} from '../api/sound-version-progress';

/** Live percentage for a version that is still rendering; tells the list
 * to reload once the render finishes. */
export function VersionRenderProgress({
  soundId,
  versionId,
  onDone,
}: {
  soundId: string;
  versionId: string;
  onDone: () => void;
}) {
  const [progress, setProgress] = useState<VersionProgress | null>(null);

  useEffect(
    () =>
      subscribeToVersionProgress(soundId, versionId, (next) => {
        setProgress(next);
        if (next.status === 'READY' || next.status === 'ERROR') {
          onDone();
        }
      }),
    [soundId, versionId, onDone],
  );

  if (!progress || progress.status === 'READY' || progress.status === 'ERROR') {
    return null;
  }

  const pct = Math.round(Math.min(1, Math.max(0, progress.pct)) * 100);
  const detail =
    progress.segment && progress.segmentCount
      ? `part ${progress.segment} of ${progress.segmentCount}`
      : progress.phase;

  return (
    <div className="mt-1.5 flex max-w-xs items-center gap-2 text-xs">
      <Meter value={pct} className="flex-1" aria-label={`Rendering, ${pct}%`} />
      <span className="text-foreground-secondary tabular-nums">
        {pct}%{detail ? ` · ${detail}` : ''}
      </span>
    </div>
  );
}
