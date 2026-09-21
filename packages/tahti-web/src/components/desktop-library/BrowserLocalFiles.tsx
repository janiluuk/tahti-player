import { LibraryIcon, TrashIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  EmptyState,
  FilePicker,
  Input,
  Tooltip,
} from '@tahti-player/ui';

import type { TahtiPlayable } from '../../api/types';
import {
  filterLocalLibraryTracks,
  isLocalTrackPlayable,
  playableFromLocalTrack,
  useLocalLibraryStore,
} from '../../stores/localLibraryStore';
import { PlayableTrackTable } from '../PlayableTrackTable';

const FILE_LABELS = {
  title: 'Add audio files',
  description:
    'File names are remembered on this device. Audio blobs clear on reload — choose the same files again to play. Uploading to your Tahti archive is Studio → Upload.',
  browse: 'Choose files',
};

/** Browser-only library: files are kept in memory, no desktop catalog. */
export function BrowserLocalFiles() {
  const [query, setQuery] = useState('');
  const tracks = useLocalLibraryStore((s) => s.tracks);
  const addFiles = useLocalLibraryStore((s) => s.addFiles);
  const remove = useLocalLibraryStore((s) => s.remove);
  const filteredTracks = useMemo(
    () => filterLocalLibraryTracks(tracks, query),
    [query, tracks],
  );
  const unresolvedTracks = useMemo(
    () => filteredTracks.filter((track) => !isLocalTrackPlayable(track)),
    [filteredTracks],
  );
  const playableLocalTracks = useMemo(
    () => filteredTracks.filter((track) => isLocalTrackPlayable(track)),
    [filteredTracks],
  );
  const playableItems = useMemo(
    () =>
      playableLocalTracks
        .map(playableFromLocalTrack)
        .filter((item): item is TahtiPlayable => item !== null),
    [playableLocalTracks],
  );
  const playableById = useMemo(
    () =>
      new Map(playableLocalTracks.map((track) => [`local:${track.id}`, track])),
    [playableLocalTracks],
  );

  const onFiles = (files: readonly File[]) => {
    const added = addFiles(files);
    if (added.length === 0) {
      toast.error('Choose an audio file.');
      return;
    }
    toast.success(
      added.length === 1
        ? `Ready “${added[0]?.title}”.`
        : `Ready ${added.length} files.`,
    );
  };

  return (
    <>
      <FilePicker
        accept="audio/*"
        multiple
        labels={FILE_LABELS}
        onFiles={onFiles}
      />
      <p className="border-primary/30 bg-primary/5 text-foreground-secondary rounded-md border px-2 py-1.5 text-xs">
        Tahti Player desktop runtime detected. Native library is unavailable;
        browser imports remain available.
      </p>
      {tracks.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<LibraryIcon size={28} className="opacity-50" />}
          title="Local library"
          description="Import files to play them in the Tahti player. Soulseek search lands here after the desktop add-on is connected."
          className="flex-1"
        />
      ) : (
        <>
          <Input
            type="search"
            label="Search local files"
            placeholder="Title, artist, or file name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {unresolvedTracks.length > 0 ? (
            <ul className="tahti-hide-scrollbar flex max-h-32 flex-col gap-1 overflow-y-auto">
              {unresolvedTracks.map((track) => (
                <li
                  key={track.id}
                  className="border-border flex items-center gap-2 rounded-md border px-2 py-1.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {track.title}
                    </p>
                    <p className="text-foreground-secondary truncate text-xs">
                      Re-import {track.fileName} to play
                    </p>
                  </div>
                  <Tooltip content="Remove" side="top">
                    <Button
                      size="icon-sm"
                      variant="text"
                      intent="danger"
                      aria-label={`Remove ${track.title}`}
                      onClick={() => {
                        remove(track.id);
                        toast.success(`Removed “${track.title}”.`);
                      }}
                    >
                      <TrashIcon size={14} aria-hidden />
                    </Button>
                  </Tooltip>
                </li>
              ))}
            </ul>
          ) : null}
          {playableItems.length === 0 ? (
            unresolvedTracks.length === 0 ? (
              <EmptyState
                size="sm"
                title="No local files found"
                description={`Nothing matches “${query.trim()}”.`}
                className="flex-1"
              />
            ) : null
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <PlayableTrackTable
                items={playableItems}
                selectable
                onRemove={(item) => {
                  const track = playableById.get(item.id);
                  if (!track) {
                    return;
                  }
                  remove(track.id);
                  toast.success(`Removed “${item.title}”.`);
                }}
                onBulkRemove={(items) => {
                  for (const item of items) {
                    const track = playableById.get(item.id);
                    if (track) {
                      remove(track.id);
                    }
                  }
                  toast.success(
                    items.length === 1
                      ? 'Removed 1 track.'
                      : `Removed ${items.length} tracks.`,
                  );
                }}
                compactActions
              />
            </div>
          )}
        </>
      )}
    </>
  );
}
