import { DiscIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@tahti-player/ui';

import {
  addReleaseTrackToProgramme,
  type ProgrammeView,
} from '../api/studio-extras';
import type { StudioRelease } from '../api/studio-types';

export function ReleaseTracksToRotation({
  releases,
  disabled,
  onAdded,
}: {
  releases: StudioRelease[];
  disabled?: boolean;
  onAdded: (programme: ProgrammeView) => void;
}) {
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<ReadonlySet<string>>(new Set());

  const groups = releases
    .map((release) => ({
      release,
      tracks: (release.tracks ?? []).filter(
        (track) => !track.status || track.status === 'READY',
      ),
    }))
    .filter((group) => group.tracks.length > 0);

  if (groups.length === 0) {
    return null;
  }

  const add = async (
    release: StudioRelease,
    track: NonNullable<StudioRelease['tracks']>[number],
  ) => {
    setAddingId(track.id);
    const result = await addReleaseTrackToProgramme({
      releaseTrackId: track.id,
      title: `${release.title} — ${track.title}`,
      durationSec: track.durationSec,
    });
    setAddingId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setAddedIds((current) => new Set(current).add(track.id));
    onAdded(result.data);
    toast.success(`Added “${track.title}” to the rotation.`);
  };

  return (
    <section
      aria-label="Add from your releases"
      className="border-border flex flex-col gap-3 border-t px-4 py-4 sm:px-5"
    >
      <div>
        <h3 className="text-sm font-semibold">Add from your releases</h3>
        <p className="text-foreground-secondary text-xs">
          Put a released track into the 24/7 rotation without uploading it
          again.
        </p>
      </div>
      {groups.map(({ release, tracks }) => (
        <div key={release.id} className="flex flex-col gap-1">
          <p className="text-foreground-secondary flex items-center gap-1.5 text-xs font-medium uppercase">
            <DiscIcon size={13} aria-hidden />
            {release.title}
          </p>
          <ul className="flex flex-col gap-1">
            {tracks.map((track) => {
              const added = addedIds.has(track.id);
              return (
                <li
                  key={track.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 truncate">{track.title}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={disabled || added || addingId !== null}
                    aria-label={`Add ${track.title} from ${release.title} to the rotation`}
                    onClick={() => void add(release, track)}
                  >
                    <PlusIcon size={14} aria-hidden className="mr-1.5" />
                    {added
                      ? 'Added'
                      : addingId === track.id
                        ? 'Adding…'
                        : 'Add'}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
