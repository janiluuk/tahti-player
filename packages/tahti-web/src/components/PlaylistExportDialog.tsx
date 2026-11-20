import { useState } from 'react';
import { toast } from 'sonner';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import { Button, Dialog, FilterChips, Loader } from '@tahti-player/ui';

import type {
  NativeExportResult,
  NativeExportStyle,
  NativePlaylistSummary,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { webT } from '../lib/webT';

/** What the finished export means for moving the file, in plain words. */
export function describeExport(
  result: NativeExportResult,
  style: NativeExportStyle,
  t: TFunction<'web'> = webT(),
): { title: string; description?: string } {
  const title = t('playlistExportDialogBatch32.exported', {
    count: result.written,
    path: result.path,
  });
  if (style === 'absolute') {
    return {
      title,
      description: t('playlistExportDialogBatch32.absoluteNote'),
    };
  }
  const notes: string[] = [];
  if (result.outsideRoot > 0) {
    notes.push(
      t('playlistExportDialogBatch32.outsideRoot', {
        count: result.outsideRoot,
      }),
    );
  }
  if (result.absoluteFallback > 0) {
    notes.push(
      t('playlistExportDialogBatch32.otherDrive', {
        count: result.absoluteFallback,
      }),
    );
  }
  return {
    title,
    description: notes.length
      ? notes.join(' ')
      : t('playlistExportDialogBatch32.relativeNote'),
  };
}

type Props = {
  playlist: NativePlaylistSummary | null;
  library: TahtiNativeLibrary;
  onClose: () => void;
};

/** Chooses relative or absolute paths, then asks where to save the M3U8. */
export function PlaylistExportDialog({ playlist, library, onClose }: Props) {
  const { t } = useTranslation('web');
  const [style, setStyle] = useState<NativeExportStyle>('relative');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!playlist) {
      return;
    }
    setBusy(true);
    try {
      const result = await library.playlists.exportM3u(playlist.id, style);
      if (result) {
        const message = describeExport(result, style, t);
        toast.success(message.title, { description: message.description });
        onClose();
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('playlistExportDialogLeftovers.exportFailed'),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root
      isOpen={playlist !== null}
      onClose={() => (busy ? undefined : onClose())}
    >
      <Dialog.Title>
        {t('playlistExportDialogBatch32.title', { name: playlist?.name ?? '' })}
      </Dialog.Title>
      <Dialog.Description>
        {t('playlistExportDialog.savesAnM3u8FileUtf')}
      </Dialog.Description>
      <div className="flex flex-col gap-2 py-2">
        <span className="text-sm font-medium" aria-hidden>
          {t('playlistExportDialog.filePaths')}
        </span>
        <FilterChips
          aria-label={t('playlistExportDialog.filePaths')}
          items={[
            {
              id: 'relative',
              label: t('playlistExportDialogFields.relativeToTheSavedFile'),
            },
            {
              id: 'absolute',
              label: t('playlistExportDialogFields.fullPaths'),
            },
          ]}
          selected={style}
          onChange={(id) => setStyle(id as NativeExportStyle)}
        />
        <p className="text-foreground-secondary text-xs">
          {style === 'relative'
            ? t('playlistExportDialogStates.bestForSharingOrMoving')
            : t('playlistExportDialogStates.worksOnThisComputerAs')}
        </p>
      </div>
      <Dialog.Actions>
        <Dialog.Close>{t('playlistExportDialog.cancel')}</Dialog.Close>
        <Button className="gap-1.5" disabled={busy} onClick={() => void run()}>
          {busy ? <Loader size="inline" shape="circle" /> : null}
          {t('playlistExportDialogText.chooseWhereToSave')}
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
