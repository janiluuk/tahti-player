import { FolderOpenIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog, InlineError, Loader, Tooltip } from '@tahti-player/ui';

import { dateLocaleTag } from '../lib/locale';
import type {
  NativeRestorePreview,
  NativeRootMapping,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';

const n = (value: number) => value.toLocaleString(dateLocaleTag());

type Props = {
  isOpen: boolean;
  onClose: () => void;
  library: TahtiNativeLibrary;
  /** The chosen backup file. */
  sourcePath: string | null;
  /** Called after the catalog changed. */
  onRestored: () => void;
};

/**
 * Restore preview: what the backup holds, which of its watched folders exist
 * here, and a way to point each one at its new location before anything is
 * written. A backup holds the catalog (paths, edits, ratings, tags, playlists),
 * never the audio.
 */
export function BackupRestoreDialog({
  isOpen,
  onClose,
  library,
  sourcePath,
  onRestored,
}: Props) {
  const { t } = useTranslation('web');
  const [mappings, setMappings] = useState<NativeRootMapping[]>([]);
  const [preview, setPreview] = useState<NativeRestorePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMappings([]);
      setPreview(null);
      setError(null);
    }
  }, [isOpen, sourcePath]);

  useEffect(() => {
    if (!isOpen || !sourcePath) {
      return;
    }
    let cancelled = false;
    library.catalog
      .previewBackup(sourcePath, mappings)
      .then((value) => {
        if (!cancelled) {
          setPreview(value);
          setError(null);
        }
      })
      .catch((failure) => {
        if (!cancelled) {
          setPreview(null);
          setError(
            failure instanceof Error ? failure.message : String(failure),
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, sourcePath, mappings, library]);

  const chooseFolder = async (from: string) => {
    try {
      const to = await library.catalog.pickFolder();
      if (to) {
        setMappings((current) => [
          ...current.filter((mapping) => mapping.from !== from),
          { from, to },
        ]);
      }
    } catch (failure) {
      toast.error(
        failure instanceof Error
          ? failure.message
          : t('backupRestoreDialogBatch32.couldNotChooseFolder'),
      );
    }
  };

  const restore = async () => {
    if (!sourcePath) {
      return;
    }
    setBusy(true);
    try {
      const result = await library.catalog.restoreBackup(sourcePath, mappings);
      onRestored();
      onClose();
      toast.success(
        t('backupRestoreDialogBatch32.restored', {
          tracks: t('backupRestoreDialogBatch32.trackCount', {
            count: result.tracksRestored,
            formatted: n(result.tracksRestored),
          }),
          playlists: t('backupRestoreDialogBatch32.playlistCount', {
            count: result.playlistsCreated,
            formatted: n(result.playlistsCreated),
          }),
        }),
        {
          description:
            [
              result.tracksMissing
                ? t('backupRestoreDialogBatch32.filesNotFound', {
                    count: result.tracksMissing,
                    formatted: n(result.tracksMissing),
                  })
                : '',
              result.tracksFailed
                ? t('backupRestoreDialogBatch32.couldNotBeRead', {
                    count: result.tracksFailed,
                    formatted: n(result.tracksFailed),
                  })
                : '',
              result.playlistsRenamed
                ? t('backupRestoreDialogBatch32.playlistsRenamed', {
                    count: result.playlistsRenamed,
                    formatted: n(result.playlistsRenamed),
                  })
                : '',
            ]
              .filter(Boolean)
              .join('; ') || undefined,
        },
      );
    } catch (failure) {
      toast.error(
        failure instanceof Error
          ? failure.message
          : t('backupRestoreDialogLeftovers.couldNotRestore'),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root
      isOpen={isOpen}
      onClose={() => (busy ? undefined : onClose())}
      className="max-w-xl"
    >
      <Dialog.Title>{t('backupRestore.restoreFromBackup')}</Dialog.Title>
      <Dialog.Description>
        {t('backupRestore.restoresYourCatalogWatchedFolders')}
      </Dialog.Description>
      {error ? (
        <InlineError>{error}</InlineError>
      ) : !preview ? (
        <p className="text-foreground-secondary flex items-center gap-2 text-sm">
          <Loader size="inline" shape="circle" />
          {t('backupRestore.readingTheBackup')}
        </p>
      ) : (
        <div className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto py-2">
          <p className="text-sm">
            {t('backupRestoreDialogBatch32.backupSummary', {
              date: preview.createdAt,
              tracks: t('backupRestoreDialogBatch32.trackCount', {
                count: preview.tracks,
                formatted: n(preview.tracks),
              }),
              playlists: t('backupRestoreDialogBatch32.playlistCount', {
                count: preview.playlists,
                formatted: n(preview.playlists),
              }),
              edits: t('backupRestoreDialogBatch32.editCount', {
                count: preview.edits,
                formatted: n(preview.edits),
              }),
            })}
          </p>
          <p className="text-sm" role="status">
            {preview.filesMissing > 0
              ? t('backupRestoreDialogBatch32.filesFoundSomeMissing', {
                  found: n(preview.filesFound),
                  total: n(preview.tracks),
                  missing: n(preview.filesMissing),
                })
              : t('backupRestoreDialogBatch32.filesFound', {
                  found: n(preview.filesFound),
                  total: n(preview.tracks),
                })}
          </p>
          {preview.roots.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">
                {t('backupRestore.watchedFolders')}
              </p>
              {preview.roots.map((root) => (
                <div key={root.from} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1 text-xs">
                    <Tooltip content={root.from} side="top">
                      <p className="truncate">{root.from}</p>
                    </Tooltip>
                    <p
                      className={
                        root.exists
                          ? 'text-foreground-secondary truncate'
                          : 'text-accent-red-strong truncate'
                      }
                      title={root.to}
                    >
                      {root.exists
                        ? '→'
                        : t('backupRestoreDialogBatch32.notFoundPrefix')}{' '}
                      {root.to} ·{' '}
                      {t('backupRestoreDialogBatch32.trackCount', {
                        count: root.tracks,
                        formatted: n(root.tracks),
                      })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void chooseFolder(root.from)}
                    className="gap-1.5"
                  >
                    <FolderOpenIcon size={14} aria-hidden />
                    {t('backupRestore.chooseNewFolder')}
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
          {preview.missingExamples.length > 0 ? (
            <div className="text-foreground-secondary flex flex-col gap-0.5 text-xs">
              <p>{t('backupRestoreDialogBatch32.notFoundExamples')}</p>
              {preview.missingExamples.map((path) => (
                <Tooltip key={path} content={path} side="top">
                  <p className="truncate">{path}</p>
                </Tooltip>
              ))}
            </div>
          ) : null}
        </div>
      )}
      <Dialog.Actions>
        <Dialog.Close>{t('backupRestore.cancel')}</Dialog.Close>
        <Button
          disabled={busy || !preview || preview.filesFound === 0}
          onClick={() => void restore()}
          className="gap-1.5"
        >
          {busy ? <Loader size="inline" shape="circle" /> : null}
          {t('backupRestoreDialogBatch32.restore')}
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
