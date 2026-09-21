import { FolderOpenIcon, LoaderCircleIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog } from '@tahti-player/ui';

import type {
  NativeRestorePreview,
  NativeRootMapping,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';

const n = (value: number) => value.toLocaleString('en-US');

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
          : 'Could not choose a folder.',
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
        `Restored ${n(result.tracksRestored)} ${result.tracksRestored === 1 ? 'track' : 'tracks'} and ${n(result.playlistsCreated)} ${result.playlistsCreated === 1 ? 'playlist' : 'playlists'}.`,
        {
          description:
            [
              result.tracksMissing
                ? `${n(result.tracksMissing)} files were not found`
                : '',
              result.tracksFailed
                ? `${n(result.tracksFailed)} could not be read`
                : '',
              result.playlistsRenamed
                ? `${n(result.playlistsRenamed)} playlists were renamed because the name was taken`
                : '',
            ]
              .filter(Boolean)
              .join('; ') || undefined,
        },
      );
    } catch (failure) {
      toast.error(
        failure instanceof Error ? failure.message : 'Could not restore.',
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
      <Dialog.Title>Restore from backup</Dialog.Title>
      <Dialog.Description>
        Restores your catalog: watched folders, edits, ratings, labels, tags,
        play counts and playlists. The music files themselves are not part of
        the backup — they must already be on this computer.
      </Dialog.Description>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : !preview ? (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
          Reading the backup…
        </p>
      ) : (
        <div className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto py-2">
          <p className="text-sm">
            Backup from {preview.createdAt} UTC: {n(preview.tracks)} tracks,{' '}
            {n(preview.playlists)} playlists, {n(preview.edits)} hand-edited
            tags.
          </p>
          <p className="text-sm" role="status">
            {n(preview.filesFound)} of {n(preview.tracks)} files found
            {preview.filesMissing > 0
              ? `; ${n(preview.filesMissing)} not found (they will be skipped)`
              : ''}
            .
          </p>
          {preview.roots.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Watched folders</p>
              {preview.roots.map((root) => (
                <div key={root.from} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="truncate" title={root.from}>
                      {root.from}
                    </p>
                    <p
                      className={
                        root.exists
                          ? 'text-muted-foreground truncate'
                          : 'text-destructive truncate'
                      }
                      title={root.to}
                    >
                      {root.exists ? '→' : 'Not found:'} {root.to} ·{' '}
                      {n(root.tracks)} tracks
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void chooseFolder(root.from)}
                  >
                    <FolderOpenIcon size={14} aria-hidden />
                    Choose new folder…
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
          {preview.missingExamples.length > 0 ? (
            <div className="text-muted-foreground flex flex-col gap-0.5 text-xs">
              <p>Not found, for example:</p>
              {preview.missingExamples.map((path) => (
                <p key={path} className="truncate" title={path}>
                  {path}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      )}
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <Button
          disabled={busy || !preview || preview.filesFound === 0}
          onClick={() => void restore()}
        >
          {busy ? (
            <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
          ) : null}
          Restore
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
