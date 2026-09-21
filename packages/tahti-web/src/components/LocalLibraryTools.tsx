import {
  ArchiveRestoreIcon,
  CopyIcon,
  DownloadIcon,
  HistoryIcon,
  LoaderCircleIcon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@tahti-player/ui';

import type { TahtiNativeLibrary } from '../lib/nativeLibrary';
import { BackupRestoreDialog } from './BackupRestoreDialog';
import { DuplicatesDialog } from './DuplicatesDialog';
import { LocalLibraryAnalysis } from './LocalLibraryAnalysis';
import { PlayHistoryDialog } from './PlayHistoryDialog';

type Props = {
  library: TahtiNativeLibrary;
  /** Called after the catalog changed. */
  onChanged: () => void;
};

/** Library upkeep: duplicate review and catalog backup/restore. */
export function LocalLibraryTools({ library, onChanged }: Props) {
  const [duplicatesOpen, setDuplicatesOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoreFrom, setRestoreFrom] = useState<string | null>(null);

  const backUp = async () => {
    setBackingUp(true);
    try {
      const summary = await library.catalog.exportBackup();
      if (summary) {
        toast.success('Catalog backed up.', {
          description: `${summary.tracks.toLocaleString('en-US')} tracks, ${summary.playlists.toLocaleString('en-US')} playlists and ${summary.edits.toLocaleString('en-US')} edited tags saved. Your music files are not included.`,
        });
      }
    } catch (failure) {
      toast.error(
        failure instanceof Error ? failure.message : 'Could not back up.',
      );
    } finally {
      setBackingUp(false);
    }
  };

  const chooseBackup = async () => {
    try {
      const path = await library.catalog.pickBackup();
      if (path) {
        setRestoreFrom(path);
      }
    } catch (failure) {
      toast.error(
        failure instanceof Error ? failure.message : 'Could not open the file.',
      );
    }
  };

  return (
    <>
      <LocalLibraryAnalysis library={library} onChanged={onChanged} />
      <div
        className="border-border flex flex-wrap items-center gap-1 rounded-md border p-2"
        data-testid="library-tools"
      >
        <p className="flex-1 text-xs font-semibold">Library tools</p>
        <Button
          size="sm"
          variant="text"
          onClick={() => setDuplicatesOpen(true)}
        >
          <CopyIcon size={14} aria-hidden />
          Find duplicates
        </Button>
        <Button size="sm" variant="text" onClick={() => setHistoryOpen(true)}>
          <HistoryIcon size={14} aria-hidden />
          History
        </Button>
        <Button
          size="sm"
          variant="text"
          disabled={backingUp}
          onClick={() => void backUp()}
        >
          {backingUp ? (
            <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
          ) : (
            <DownloadIcon size={14} aria-hidden />
          )}
          Back up catalog
        </Button>
        <Button size="sm" variant="text" onClick={() => void chooseBackup()}>
          <ArchiveRestoreIcon size={14} aria-hidden />
          Restore…
        </Button>
        <DuplicatesDialog
          isOpen={duplicatesOpen}
          onClose={() => setDuplicatesOpen(false)}
          library={library}
          onChanged={onChanged}
        />
        <PlayHistoryDialog
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          library={library}
          onChanged={onChanged}
        />
        <BackupRestoreDialog
          isOpen={restoreFrom !== null}
          onClose={() => setRestoreFrom(null)}
          library={library}
          sourcePath={restoreFrom}
          onRestored={onChanged}
        />
      </div>
    </>
  );
}
