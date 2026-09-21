import { LoaderCircleIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, Input, Toggle } from '@tahti-player/ui';

import type {
  NativeEntryStatus,
  NativeImportPreview,
  NativePlaylistSummary,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';

const STATUS_LABEL: Record<NativeEntryStatus, string> = {
  linked: 'In library',
  needsImport: 'Not in library yet',
  missing: 'File not found',
  unsupported: 'Unsupported format',
  remote: 'Stream URL',
};

function basename(path: string) {
  return path.split(/[\\/]/).pop() || path;
}

/** Summary line for a preview, e.g. "12 of 14 already in your library". */
export function describePreview(preview: NativeImportPreview): string {
  const parts = [
    `${preview.linked} of ${preview.total} already in your library`,
  ];
  if (preview.needsImport) {
    parts.push(`${preview.needsImport} not imported yet`);
  }
  if (preview.missing) {
    parts.push(`${preview.missing} not found`);
  }
  if (preview.unsupported) {
    parts.push(`${preview.unsupported} unsupported`);
  }
  if (preview.remote) {
    parts.push(
      `${preview.remote} stream URL${preview.remote === 1 ? '' : 's'}`,
    );
  }
  return parts.join(' · ');
}

type Props = {
  /** The parsed file to review; null keeps the dialog closed. */
  initial: NativeImportPreview | null;
  library: TahtiNativeLibrary;
  onClose: () => void;
  onImported: (playlist: NativePlaylistSummary) => void;
};

/** Reviews an M3U/M3U8 before creating the playlist: what resolves, what doesn't, and how to fix it. */
export function PlaylistImportDialog({
  initial,
  library,
  onClose,
  onImported,
}: Props) {
  const [preview, setPreview] = useState<NativeImportPreview | null>(initial);
  const [name, setName] = useState('');
  const [importFiles, setImportFiles] = useState(true);
  const [relinkRoot, setRelinkRoot] = useState<string | null>(null);
  const [busy, setBusy] = useState<'scan' | 'import' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreview(initial);
    setName(initial?.suggestedName ?? '');
    setImportFiles(true);
    setRelinkRoot(null);
    setError(null);
  }, [initial]);

  const chooseFolder = async () => {
    if (!preview) {
      return;
    }
    setBusy('scan');
    try {
      const folder = await library.playlists.pickRelinkFolder();
      if (!folder) {
        return;
      }
      const next = await library.playlists.importPreview(
        preview.sourcePath,
        folder,
      );
      if (next) {
        setPreview(next);
        setRelinkRoot(folder);
      }
    } catch (failure) {
      toast.error(
        failure instanceof Error
          ? failure.message
          : 'Could not search that folder.',
      );
    } finally {
      setBusy(null);
    }
  };

  const commit = async () => {
    if (!preview || !name.trim()) {
      return;
    }
    setBusy('import');
    setError(null);
    try {
      const outcome = await library.playlists.importCommit(
        preview.sourcePath,
        name.trim(),
        importFiles,
        relinkRoot,
      );
      const details = [
        outcome.imported
          ? `${outcome.imported} ${outcome.imported === 1 ? 'file' : 'files'} added to your library`
          : null,
        outcome.unresolved
          ? `${outcome.unresolved} ${outcome.unresolved === 1 ? 'entry is' : 'entries are'} unavailable and will link up when the file is in your library`
          : null,
      ].filter(Boolean);
      toast.success(
        `Imported “${outcome.playlist.name}” with ${outcome.playlist.trackCount} entries.`,
        details.length ? { description: details.join('. ') + '.' } : undefined,
      );
      onImported(outcome.playlist);
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Import failed.');
    } finally {
      setBusy(null);
    }
  };

  const unresolvedCount = preview ? preview.total - preview.linked : 0;

  return (
    <Dialog.Root
      isOpen={initial !== null}
      onClose={() => (busy ? undefined : onClose())}
    >
      <Dialog.Title>Import playlist</Dialog.Title>
      <Dialog.Description>
        {preview
          ? `${basename(preview.sourcePath)} — ${describePreview(preview)}.`
          : ''}
      </Dialog.Description>
      {preview ? (
        <div className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto py-2">
          <Input
            label="Playlist name"
            value={name}
            error={error ?? undefined}
            onChange={(event) => setName(event.target.value)}
          />
          {preview.needsImport > 0 ? (
            <div className="flex items-center gap-2">
              <Toggle
                checked={importFiles}
                onChange={setImportFiles}
                aria-label="Add files to the library"
              />
              <span className="text-sm">
                Also add the {preview.needsImport}{' '}
                {preview.needsImport === 1 ? 'file' : 'files'} that{' '}
                {preview.needsImport === 1 ? 'isn’t' : 'aren’t'} in your library
                yet
              </span>
            </div>
          ) : null}
          {preview.missing > 0 || relinkRoot ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={busy !== null}
                onClick={() => void chooseFolder()}
              >
                {busy === 'scan' ? (
                  <LoaderCircleIcon
                    size={14}
                    className="animate-spin"
                    aria-hidden
                  />
                ) : null}
                Find missing files in a folder…
              </Button>
              <span className="text-foreground-secondary min-w-0 flex-1 truncate text-xs">
                {relinkRoot
                  ? `Searching ${relinkRoot}`
                  : 'Matches by folder path, then by a unique file name.'}
              </span>
            </div>
          ) : null}
          {unresolvedCount > 0 ? (
            <section>
              <h3 className="mb-1 text-sm font-semibold">
                Not yet in your library
              </h3>
              <p className="text-foreground-secondary mb-1 text-xs">
                These are kept in the playlist as unavailable entries, never
                dropped, and link up when the file is in your library.
              </p>
              <ul
                className="flex flex-col gap-1"
                aria-label="Unresolved entries"
              >
                {preview.unresolved.map((entry) => (
                  <li
                    key={`${entry.line}-${entry.path}`}
                    className="border-border flex items-center gap-2 rounded-md border px-2 py-1 text-sm"
                    title={entry.path}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {entry.title}
                    </span>
                    <span className="text-foreground-secondary shrink-0 text-xs">
                      {STATUS_LABEL[entry.status]}
                    </span>
                  </li>
                ))}
              </ul>
              {unresolvedCount > preview.unresolved.length ? (
                <p className="text-foreground-secondary mt-1 text-xs">
                  …and {unresolvedCount - preview.unresolved.length} more.
                </p>
              ) : null}
            </section>
          ) : null}
        </div>
      ) : null}
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <Button
          disabled={!preview || !name.trim() || busy !== null}
          onClick={() => void commit()}
        >
          {busy === 'import' ? (
            <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
          ) : null}
          Import playlist
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
