import {
  ArchiveRestoreIcon,
  CopyIcon,
  DownloadIcon,
  HistoryIcon,
  ImageIcon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Button, Loader } from '@tahti-player/ui';

import type { TahtiNativeLibrary } from '../lib/nativeLibrary';
import { BackupRestoreDialog } from './BackupRestoreDialog';
import { useArtworkBackfill } from './desktop-library/useArtworkBackfill';
import { DuplicatesDialog } from './DuplicatesDialog';
import { LocalLibraryAnalysis } from './LocalLibraryAnalysis';
import { PlayHistoryDialog } from './PlayHistoryDialog';

type Props = {
  library: TahtiNativeLibrary;
  /** Called after the catalog changed. */
  onChanged: () => void;
};

/** Library upkeep: duplicate review, missing artwork and catalog backup/restore. */
export function LocalLibraryTools({ library, onChanged }: Props) {
  const { t } = useTranslation('web');
  const [duplicatesOpen, setDuplicatesOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoreFrom, setRestoreFrom] = useState<string | null>(null);
  const artwork = useArtworkBackfill(library.artworkBackfill, onChanged);

  const backUp = async () => {
    setBackingUp(true);
    try {
      const summary = await library.catalog.exportBackup();
      if (summary) {
        toast.success(i18n.t('web:toasts.catalogBackedUp'), {
          description: `${summary.tracks.toLocaleString('en-US')} tracks, ${summary.playlists.toLocaleString('en-US')} playlists and ${summary.edits.toLocaleString('en-US')} edited tags saved. Your music files are not included.`,
        });
      }
    } catch (failure) {
      toast.error(
        failure instanceof Error
          ? failure.message
          : t('localLibraryToolsLeftovers.couldNotBackUp'),
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
        failure instanceof Error
          ? failure.message
          : t('localLibraryToolsLeftovers.couldNotOpenFile'),
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
        <p className="flex-1 text-xs font-semibold">
          {t('localLibraryTools.libraryTools')}
        </p>
        <Button
          className="gap-1.5"
          size="sm"
          variant="text"
          onClick={() => setDuplicatesOpen(true)}
        >
          <CopyIcon size={14} aria-hidden />
          {t('localLibraryTools.findDuplicates')}
        </Button>
        <Button
          className="gap-1.5"
          size="sm"
          variant="text"
          onClick={() => setHistoryOpen(true)}
        >
          <HistoryIcon size={14} aria-hidden />
          {t('localLibraryTools.history')}
        </Button>
        {artwork.available ? (
          <Button
            className="gap-1.5"
            size="sm"
            variant="text"
            disabled={artwork.running}
            onClick={() => void artwork.start()}
          >
            {artwork.running ? (
              <Loader size="inline" shape="circle" />
            ) : (
              <ImageIcon size={14} aria-hidden />
            )}
            {t('localLibraryToolsText.findMissingArtwork')}
          </Button>
        ) : null}
        <Button
          className="gap-1.5"
          size="sm"
          variant="text"
          disabled={backingUp}
          onClick={() => void backUp()}
        >
          {backingUp ? (
            <Loader size="inline" shape="circle" />
          ) : (
            <DownloadIcon size={14} aria-hidden />
          )}
          {t('localLibraryToolsText.backUpCatalog')}
        </Button>
        <Button
          className="gap-1.5"
          size="sm"
          variant="text"
          onClick={() => void chooseBackup()}
        >
          <ArchiveRestoreIcon size={14} aria-hidden />
          {t('localLibraryTools.restore')}
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
