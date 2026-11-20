import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation, type ParseKeys } from '@tahti-player/i18n';
import {
  Button,
  Dialog,
  Input,
  Loader,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import type {
  NativeEntryStatus,
  NativeImportPreview,
  NativePlaylistSummary,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { webT } from '../lib/webT';

const STATUS_LABEL_KEYS = {
  linked: 'playlistImportDialogBatch31.statusLinked',
  needsImport: 'playlistImportDialogBatch31.statusNeedsImport',
  missing: 'playlistImportDialogBatch31.statusMissing',
  unsupported: 'playlistImportDialogBatch31.statusUnsupported',
  remote: 'playlistImportDialogBatch31.statusRemote',
} as const satisfies Record<NativeEntryStatus, ParseKeys<'web'>>;

function basename(path: string) {
  return path.split(/[\\/]/).pop() || path;
}

/** Summary line for a preview, e.g. "12 of 14 already in your library". */
export function describePreview(preview: NativeImportPreview): string {
  const t = webT();
  const parts = [
    t('playlistImportDialogBatch31.summaryLinked', {
      linked: preview.linked,
      total: preview.total,
    }),
  ];
  if (preview.needsImport) {
    parts.push(
      t('playlistImportDialogBatch31.summaryNeedsImport', {
        n: preview.needsImport,
      }),
    );
  }
  if (preview.missing) {
    parts.push(
      t('playlistImportDialogBatch31.summaryMissing', { n: preview.missing }),
    );
  }
  if (preview.unsupported) {
    parts.push(
      t('playlistImportDialogBatch31.summaryUnsupported', {
        n: preview.unsupported,
      }),
    );
  }
  if (preview.remote) {
    parts.push(
      t('playlistImportDialogBatch31.summaryRemote', { count: preview.remote }),
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
  const { t } = useTranslation('web');
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
          : t('playlistImportDialogBatch31.couldNotSearchFolder'),
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
          ? t('playlistImportDialogBatch31.filesAdded', {
              count: outcome.imported,
            })
          : null,
        outcome.unresolved
          ? t('playlistImportDialogBatch31.entriesUnavailable', {
              count: outcome.unresolved,
            })
          : null,
      ].filter(Boolean);
      toast.success(
        t('playlistImportDialogBatch31.importedToast', {
          name: outcome.playlist.name,
          count: outcome.playlist.trackCount,
        }),
        details.length ? { description: details.join('. ') + '.' } : undefined,
      );
      onImported(outcome.playlist);
      onClose();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : t('playlistImportDialogLeftovers.importFailed'),
      );
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
      <Dialog.Title>{t('playlistImport.importPlaylist')}</Dialog.Title>
      <Dialog.Description>
        {preview
          ? `${basename(preview.sourcePath)} — ${describePreview(preview)}.`
          : ''}
      </Dialog.Description>
      <form
        className="contents"
        onSubmit={(event) => {
          event.preventDefault();
          void commit();
        }}
      >
        {preview ? (
          <div className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto py-2">
            <Input
              label={t('playlistImport.playlistName')}
              value={name}
              error={error ?? undefined}
              onChange={(event) => setName(event.target.value)}
            />
            {preview.needsImport > 0 ? (
              <div className="flex items-center gap-2">
                <Toggle
                  checked={importFiles}
                  onChange={setImportFiles}
                  aria-label={t('playlistImport.addFilesToTheLibrary')}
                />
                <span className="text-sm">
                  {t('playlistImportDialogBatch31.alsoAddFiles', {
                    count: preview.needsImport,
                  })}
                </span>
              </div>
            ) : null}
            {preview.missing > 0 || relinkRoot ? (
              <div className="flex items-center gap-2">
                <Button
                  className="gap-1.5"
                  size="sm"
                  variant="secondary"
                  disabled={busy !== null}
                  onClick={() => void chooseFolder()}
                >
                  {busy === 'scan' ? (
                    <Loader size="inline" shape="circle" />
                  ) : null}
                  {t('playlistImportText.findMissingInFolder')}
                </Button>
                <span className="text-foreground-secondary min-w-0 flex-1 truncate text-xs">
                  {relinkRoot
                    ? t('playlistImportDialogBatch31.searchingFolder', {
                        path: relinkRoot,
                      })
                    : t('playlistImportDialogBatch31.matchesHint')}
                </span>
              </div>
            ) : null}
            {unresolvedCount > 0 ? (
              <section>
                <h3 className="mb-1 text-sm font-semibold">
                  {t('playlistImport.notYetInYourLibrary')}
                </h3>
                <p className="text-foreground-secondary mb-1 text-xs">
                  {t('playlistImport.theseAreKeptInThe')}
                </p>
                <ul
                  className="flex flex-col gap-1"
                  aria-label={t('playlistImport.unresolvedEntries')}
                >
                  {preview.unresolved.map((entry) => (
                    <li
                      key={`${entry.line}-${entry.path}`}
                      className="border-border flex items-center gap-2 rounded-md border px-2 py-1 text-sm"
                    >
                      <Tooltip
                        content={entry.path}
                        side="top"
                        wrapperClassName="min-w-0 flex-1"
                      >
                        <span
                          className="block truncate"
                          aria-description={entry.path}
                        >
                          {entry.title}
                        </span>
                      </Tooltip>
                      <span className="text-foreground-secondary shrink-0 text-xs">
                        {t(STATUS_LABEL_KEYS[entry.status])}
                      </span>
                    </li>
                  ))}
                </ul>
                {unresolvedCount > preview.unresolved.length ? (
                  <p className="text-foreground-secondary mt-1 text-xs">
                    {t('playlistImportDialogBatch31.andMore', {
                      n: unresolvedCount - preview.unresolved.length,
                    })}
                  </p>
                ) : null}
              </section>
            ) : null}
          </div>
        ) : null}
        <Dialog.Actions>
          <Dialog.Close>{t('playlistImport.cancel')}</Dialog.Close>
          <Button
            className="gap-1.5"
            disabled={!preview || !name.trim() || busy !== null}
            type="submit"
          >
            {busy === 'import' ? <Loader size="inline" shape="circle" /> : null}
            {t('playlistImportText.importPlaylist')}
          </Button>
        </Dialog.Actions>
      </form>
    </Dialog.Root>
  );
}
