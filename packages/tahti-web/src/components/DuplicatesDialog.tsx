import { FolderOpenIcon, LoaderCircleIcon, TrashIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog } from '@tahti-player/ui';

import { formatLibrarySize } from '../lib/libraryFormat';
import type {
  NativeDuplicateGroup,
  NativeLibraryTrack,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { formatDuration } from '../lib/playableToTrack';
import { ConfirmDialog } from './ConfirmDialog';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  library: TahtiNativeLibrary;
  /** Called after the catalog changed. */
  onChanged: () => void;
};

function groupHeading(group: NativeDuplicateGroup) {
  if (group.kind === 'exact') {
    return `Identical files (${group.tracks.length})`;
  }
  return group.confirmedDifferent
    ? `Same name, different files (${group.tracks.length})`
    : `Possibly the same track (${group.tracks.length})`;
}

function groupHint(group: NativeDuplicateGroup) {
  if (group.kind === 'exact') {
    return 'Byte-for-byte copies. Keep one and remove the rest from the library if you like.';
  }
  return group.confirmedDifferent
    ? 'Compared and different: these are separate recordings or versions, not duplicates.'
    : 'Same title, artist and length. Compare file contents to find out whether they are really the same.';
}

/**
 * Review of duplicate tracks. Exact duplicates come from comparing file
 * contents (on request); similar ones from matching names and lengths and
 * are only suggestions. Nothing is ever removed automatically, and "remove"
 * only takes a track out of the library, never off the disk.
 */
export function DuplicatesDialog({
  isOpen,
  onClose,
  library,
  onChanged,
}: Props) {
  const [groups, setGroups] = useState<NativeDuplicateGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hashing, setHashing] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [pending, setPending] = useState<NativeLibraryTrack | null>(null);
  const [merging, setMerging] = useState<{
    keep: NativeLibraryTrack;
    others: NativeLibraryTrack[];
  } | null>(null);

  const load = useCallback(async () => {
    try {
      setGroups(await library.catalog.duplicates());
      setError(null);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Could not look for duplicates.',
      );
    }
  }, [library]);

  useEffect(() => {
    if (isOpen) {
      setGroups(null);
      void load();
    }
  }, [isOpen, load]);

  const compare = async () => {
    setHashing({ done: 0, total: 0 });
    const stop = library.catalog.onHashProgress(setHashing);
    try {
      const result = await library.catalog.hashTracks([]);
      toast.success(
        result.cancelled
          ? 'Comparison stopped.'
          : `Compared ${result.hashed.toLocaleString('en-US')} files${
              result.alreadyCurrent
                ? ` (${result.alreadyCurrent.toLocaleString('en-US')} already up to date)`
                : ''
            }.`,
        result.failed
          ? {
              description: `${result.failed} files could not be read.`,
            }
          : undefined,
      );
      await load();
    } catch (failure) {
      toast.error(
        failure instanceof Error ? failure.message : 'Could not compare files.',
      );
    } finally {
      stop();
      setHashing(null);
    }
  };

  const merge = async (
    keep: NativeLibraryTrack,
    others: NativeLibraryTrack[],
  ) => {
    try {
      const result = await library.catalog.mergeTracks(
        keep.id,
        others.map((track) => track.id),
      );
      toast.success(
        `Kept “${keep.title}” and merged ${result.removed.toLocaleString('en-US')} ${result.removed === 1 ? 'copy' : 'copies'} into it.`,
        {
          description:
            'Ratings, tags, plays and playlist entries were carried over. No audio file was touched.',
        },
      );
      onChanged();
      await load();
    } catch (failure) {
      toast.error(
        failure instanceof Error
          ? failure.message
          : 'Could not merge the tracks.',
      );
    }
  };

  const remove = async (track: NativeLibraryTrack) => {
    try {
      await library.remove(track.id);
      toast.success(`Removed “${track.title}” from the library.`, {
        description: 'The audio file on disk was not touched.',
      });
      onChanged();
      await load();
    } catch (failure) {
      toast.error(
        failure instanceof Error
          ? failure.message
          : 'Could not remove the track.',
      );
    }
  };

  return (
    <>
      <Dialog.Root
        isOpen={isOpen}
        onClose={() => (hashing ? undefined : onClose())}
        className="max-w-2xl"
      >
        <Dialog.Title>Find duplicates</Dialog.Title>
        <Dialog.Description>
          Review only: nothing is removed unless you choose it, and removing a
          track never deletes its file.
        </Dialog.Description>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            disabled={hashing !== null}
            onClick={() => void compare()}
          >
            {hashing ? (
              <LoaderCircleIcon
                size={14}
                className="animate-spin"
                aria-hidden
              />
            ) : null}
            Compare file contents
          </Button>
          {hashing ? (
            <>
              <span className="text-muted-foreground text-xs" role="status">
                {hashing.total > 0
                  ? `Comparing ${hashing.done.toLocaleString('en-US')} of ${hashing.total.toLocaleString('en-US')}…`
                  : 'Starting…'}
              </span>
              <Button
                size="sm"
                variant="text"
                onClick={() => void library.catalog.cancelHash()}
              >
                Stop
              </Button>
            </>
          ) : (
            <span className="text-muted-foreground text-xs">
              Reads every file once to find exact copies; unchanged files are
              skipped next time.
            </span>
          )}
        </div>
        <div className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto py-2">
          {error ? (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          ) : groups === null ? (
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <LoaderCircleIcon
                size={14}
                className="animate-spin"
                aria-hidden
              />
              Looking…
            </p>
          ) : groups.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No duplicates found. Use “Compare file contents” to check for
              exact copies.
            </p>
          ) : (
            groups.map((group) => (
              <section
                key={group.tracks.map((track) => track.id).join('|')}
                className="flex flex-col gap-1"
                aria-label={groupHeading(group)}
              >
                <h3 className="text-sm font-semibold">{groupHeading(group)}</h3>
                <p className="text-muted-foreground text-xs">
                  {groupHint(group)}
                </p>
                <ul className="flex flex-col gap-1">
                  {group.tracks.map((track) => (
                    <li
                      key={track.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate">
                          {track.title}
                          {track.artist ? ` — ${track.artist}` : ''}
                        </p>
                        <p
                          className="text-muted-foreground truncate text-xs"
                          title={track.path}
                        >
                          {track.path} · {formatLibrarySize(track.sizeBytes)}
                          {track.duration
                            ? ` · ${formatDuration(track.duration)}`
                            : ''}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="text"
                        aria-label={`Keep ${track.title} at ${track.path} and merge the others into it`}
                        onClick={() =>
                          setMerging({
                            keep: track,
                            others: group.tracks.filter(
                              (other) => other.id !== track.id,
                            ),
                          })
                        }
                      >
                        Keep this
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="text"
                        aria-label={`Reveal ${track.title} in folder`}
                        onClick={() =>
                          void library
                            .reveal(track.id)
                            .catch((failure) =>
                              toast.error(
                                failure instanceof Error
                                  ? failure.message
                                  : 'Could not open the folder.',
                              ),
                            )
                        }
                      >
                        <FolderOpenIcon size={14} aria-hidden />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="text"
                        intent="danger"
                        aria-label={`Remove ${track.title} from library`}
                        onClick={() => setPending(track)}
                      >
                        <TrashIcon size={14} aria-hidden />
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
        <Dialog.Actions>
          <Dialog.Close>Done</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>
      <ConfirmDialog
        isOpen={merging !== null}
        title="Keep this one and merge the others into it?"
        description={`“${merging?.keep.title ?? ''}” keeps the best rating, the label, all tags, the combined play count and the playlist spots of ${merging?.others.length ?? 0} other ${merging?.others.length === 1 ? 'copy' : 'copies'}, which are then removed from the library. No audio file on disk is touched.`}
        confirmLabel="Merge"
        onCancel={() => setMerging(null)}
        onConfirm={() => {
          const pendingMerge = merging;
          setMerging(null);
          if (pendingMerge) {
            void merge(pendingMerge.keep, pendingMerge.others);
          }
        }}
      />
      <ConfirmDialog
        isOpen={pending !== null}
        title="Remove this track from the library?"
        description={`“${pending?.title ?? ''}” is only removed from your Tahti library. The audio file on disk is not touched.`}
        confirmLabel="Remove"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          const track = pending;
          setPending(null);
          if (track) {
            void remove(track);
          }
        }}
      />
    </>
  );
}
