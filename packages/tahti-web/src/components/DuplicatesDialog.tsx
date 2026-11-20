import { FolderOpenIcon, TrashIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Button, Dialog, InlineError, Loader, Tooltip } from '@tahti-player/ui';

import { formatLibrarySize } from '../lib/libraryFormat';
import type {
  NativeDuplicateGroup,
  NativeLibraryTrack,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { formatDuration } from '../lib/playableToTrack';
import { webT } from '../lib/webT';
import { ConfirmDialog } from './ConfirmDialog';
import { PageEmpty } from './PageStates';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  library: TahtiNativeLibrary;
  /** Called after the catalog changed. */
  onChanged: () => void;
};

function groupHeading(group: NativeDuplicateGroup) {
  const t = webT();
  const count = group.tracks.length;
  if (group.kind === 'exact') {
    return t('duplicatesDialogBatch30.identicalFiles', { count });
  }
  return group.confirmedDifferent
    ? t('duplicatesDialogBatch30.sameNameDifferentFiles', { count })
    : t('duplicatesDialogBatch30.possiblySameTrack', { count });
}

function groupHint(group: NativeDuplicateGroup) {
  if (group.kind === 'exact') {
    return webT()('duplicatesDialogBatch30.byteForByteHint');
  }
  return group.confirmedDifferent
    ? webT()('duplicatesDialogStates.comparedAndDifferentTheseAre')
    : webT()('duplicatesDialogStates.sameTitleArtistAndLength');
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
  const { t } = useTranslation('web');
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
          : webT()('duplicatesDialogBatch30.couldNotLookForDuplicates'),
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
          ? t('duplicatesDialogBatch30.comparisonStopped')
          : result.alreadyCurrent
            ? t('duplicatesDialogBatch30.comparedFilesUpToDate', {
                count: result.hashed,
                n: result.hashed.toLocaleString('en-US'),
                current: result.alreadyCurrent.toLocaleString('en-US'),
              })
            : t('duplicatesDialogBatch30.comparedFiles', {
                count: result.hashed,
                n: result.hashed.toLocaleString('en-US'),
              }),
        result.failed
          ? {
              description: t('duplicatesDialogBatch30.filesCouldNotBeRead', {
                count: result.failed,
              }),
            }
          : undefined,
      );
      await load();
    } catch (failure) {
      toast.error(
        failure instanceof Error
          ? failure.message
          : t('duplicatesDialogLeftovers.couldNotCompare'),
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
        t('duplicatesDialogBatch30.keptAndMerged', {
          title: keep.title,
          count: result.removed,
          n: result.removed.toLocaleString('en-US'),
        }),
        {
          description: t('duplicatesDialogBatch30.mergeCarriedOver'),
        },
      );
      onChanged();
      await load();
    } catch (failure) {
      toast.error(
        failure instanceof Error
          ? failure.message
          : t('duplicatesDialogBatch30.couldNotMerge'),
      );
    }
  };

  const remove = async (track: NativeLibraryTrack) => {
    try {
      await library.remove(track.id);
      toast.success(
        i18n.t('web:toasts.removedTrackFromLibraryNamed', {
          title: track.title,
        }),
        {
          description: t('duplicatesDialogFields.theAudioFileOnDisk'),
        },
      );
      onChanged();
      await load();
    } catch (failure) {
      toast.error(
        failure instanceof Error
          ? failure.message
          : t('duplicatesDialogBatch30.couldNotRemove'),
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
        <Dialog.Title>{t('duplicatesDialog.findDuplicates')}</Dialog.Title>
        <Dialog.Description>
          {t('duplicatesDialog.reviewOnlyNothingIsRemoved')}
        </Dialog.Description>
        <div className="flex items-center gap-2">
          <Button
            className="gap-1.5"
            variant="secondary"
            disabled={hashing !== null}
            onClick={() => void compare()}
          >
            {hashing ? <Loader size="inline" shape="circle" /> : null}
            {t('duplicatesDialogText.compareFileContents')}
          </Button>
          {hashing ? (
            <>
              <span className="text-foreground-secondary text-xs" role="status">
                {hashing.total > 0
                  ? t('duplicatesDialogBatch30.comparingProgress', {
                      done: hashing.done.toLocaleString('en-US'),
                      total: hashing.total.toLocaleString('en-US'),
                    })
                  : t('duplicatesDialogBatch30.starting')}
              </span>
              <Button
                size="sm"
                variant="text"
                onClick={() => void library.catalog.cancelHash()}
              >
                {t('duplicatesDialog.stop')}
              </Button>
            </>
          ) : (
            <span className="text-foreground-secondary text-xs">
              {t('duplicatesDialog.readsEveryFileOnceTo')}
            </span>
          )}
        </div>
        <div className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto py-2">
          {error ? (
            <InlineError>{error}</InlineError>
          ) : groups === null ? (
            <p className="text-foreground-secondary flex items-center gap-2 text-sm">
              <Loader size="inline" shape="circle" />
              {t('duplicatesDialog.looking')}
            </p>
          ) : groups.length === 0 ? (
            <PageEmpty
              title={t('empties.noDuplicatesFound')}
              description={t('empties.useCompareFileContentsToCheck')}
            />
          ) : (
            groups.map((group) => (
              <section
                key={group.tracks.map((track) => track.id).join('|')}
                className="flex flex-col gap-1"
                aria-label={groupHeading(group)}
              >
                <h3 className="text-sm font-semibold">{groupHeading(group)}</h3>
                <p className="text-foreground-secondary text-xs">
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
                        <Tooltip content={track.path} side="top">
                          <p className="text-foreground-secondary truncate text-xs">
                            {track.path} · {formatLibrarySize(track.sizeBytes)}
                            {track.duration
                              ? ` · ${formatDuration(track.duration)}`
                              : ''}
                          </p>
                        </Tooltip>
                      </div>
                      <Button
                        size="sm"
                        variant="text"
                        aria-label={t(
                          'duplicatesDialogLabels.keepTitleAtPathAnd',
                          { title: track.title, path: track.path },
                        )}
                        onClick={() =>
                          setMerging({
                            keep: track,
                            others: group.tracks.filter(
                              (other) => other.id !== track.id,
                            ),
                          })
                        }
                      >
                        {t('duplicatesDialog.keepThis')}
                      </Button>
                      <Tooltip
                        content={t(
                          'duplicatesDialogLabels.revealTitleInFolder',
                          { title: track.title },
                        )}
                        side="top"
                      >
                        <Button
                          size="icon-sm"
                          variant="text"
                          aria-label={t(
                            'duplicatesDialogLabels.revealTitleInFolder',
                            { title: track.title },
                          )}
                          onClick={() =>
                            void library
                              .reveal(track.id)
                              .catch((failure) =>
                                toast.error(
                                  failure instanceof Error
                                    ? failure.message
                                    : t(
                                        'duplicatesDialogBatch30.couldNotOpenFolder',
                                      ),
                                ),
                              )
                          }
                        >
                          <FolderOpenIcon size={14} aria-hidden />
                        </Button>
                      </Tooltip>
                      <Tooltip
                        content={t(
                          'duplicatesDialogLabels.removeTitleFromLibrary',
                          { title: track.title },
                        )}
                        side="top"
                      >
                        <Button
                          size="icon-sm"
                          variant="text"
                          intent="danger"
                          aria-label={t(
                            'duplicatesDialogLabels.removeTitleFromLibrary',
                            { title: track.title },
                          )}
                          onClick={() => setPending(track)}
                        >
                          <TrashIcon size={14} aria-hidden />
                        </Button>
                      </Tooltip>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
        <Dialog.Actions>
          <Dialog.Close>{t('duplicatesDialog.done')}</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>
      <ConfirmDialog
        isOpen={merging !== null}
        destructive
        title={t('duplicatesDialog.keepThisOneAndMerge')}
        description={t('duplicatesDialogBatch30.mergeDescription', {
          title: merging?.keep.title ?? '',
          count: merging?.others.length ?? 0,
        })}
        confirmLabel={t('duplicatesDialog.merge')}
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
        destructive
        title={t('duplicatesDialog.removeThisTrackFromThe')}
        description={t('duplicatesDialogBatch30.removeDescription', {
          title: pending?.title ?? '',
        })}
        confirmLabel={t('duplicatesDialog.remove')}
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
