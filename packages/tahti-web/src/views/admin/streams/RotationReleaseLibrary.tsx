import { PlusIcon } from 'lucide-react';

import { Button } from '@tahti-player/ui';

import type { ProgrammeLibraryTrack } from '../../../api/studio-extras/schedule';
import { formatDuration } from '../../../lib/playableToTrack';

export function RotationReleaseLibrary({
  tracks,
  busyId,
  onAdd,
}: {
  tracks: ProgrammeLibraryTrack[];
  busyId: string | null;
  onAdd: (releaseTrackId: string) => void;
}) {
  const available = tracks.filter((track) => !track.soundId);
  if (available.length === 0) {
    return null;
  }
  return (
    <section className="flex flex-col gap-2" aria-label="From their releases">
      <h3 className="text-sm font-bold">From their releases</h3>
      <ul className="border-border divide-border divide-y rounded-lg border">
        {available.map((track) => (
          <li
            key={track.releaseTrackId}
            className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
          >
            <span className="min-w-0 truncate">
              <span className="font-medium">{track.trackTitle}</span>
              <span className="text-foreground-secondary">
                {' · '}
                {track.releaseTitle}
                {track.durationSec
                  ? ` · ${formatDuration(track.durationSec)}`
                  : ''}
              </span>
            </span>
            <Button
              size="xs"
              variant="secondary"
              disabled={busyId !== null}
              aria-label={`Add ${track.trackTitle} to the rotation`}
              onClick={() => onAdd(track.releaseTrackId)}
            >
              <PlusIcon size={14} aria-hidden className="mr-1" />
              {busyId === track.releaseTrackId ? 'Adding…' : 'Add'}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
