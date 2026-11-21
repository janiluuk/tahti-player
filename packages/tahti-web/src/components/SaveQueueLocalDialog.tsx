import { useState } from 'react';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Button, Dialog, Input, Loader } from '@tahti-player/ui';

import { dateLocaleTag } from '../lib/locale';
import type { TahtiNativeLibrary } from '../lib/nativeLibrary';
import { toastWithUndo } from '../lib/undoToast';
import { usePlayerStore } from '../stores/playerStore';

const LOCAL_PREFIX = 'local:';

/** Library track ids in the queue (in order, repeats kept) and how many
 * queue entries are not local files and so can't be stored on this device. */
export function localQueueSplit(queueIds: string[]) {
  const trackIds = queueIds
    .filter((id) => id.startsWith(LOCAL_PREFIX))
    .map((id) => id.slice(LOCAL_PREFIX.length));
  return { trackIds, streamed: queueIds.length - trackIds.length };
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  library: TahtiNativeLibrary;
};

/** Saves the queue as a playlist on this device, offline and independent of cloud collections. */
export function SaveQueueLocalDialog({ isOpen, onClose, library }: Props) {
  const { t } = useTranslation('web');
  const queue = usePlayerStore((s) => s.queue);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { trackIds, streamed } = localQueueSplit(
    queue.map((item) => item.track.source.id),
  );

  const close = () => {
    if (!busy) {
      setName('');
      setError(null);
      onClose();
    }
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed || trackIds.length === 0) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const playlist = await library.playlists.create(trimmed);
      const added = await library.playlists.addTracks(playlist.id, trackIds);
      const skippedCount = trackIds.length - added;
      const skippedNote =
        skippedCount > 0
          ? ` ${t('saveQueueLocalDialogBatch35.skippedNote', { count: skippedCount })}`
          : '';
      toastWithUndo(
        `${t('saveQueueLocalDialogBatch35.saved', {
          count: added,
          countLabel: added.toLocaleString(dateLocaleTag()),
          name: playlist.name,
        })}${skippedNote}`,
        {
          undo: async () => {
            await library.playlists.delete(playlist.id);
            return { ok: true as const };
          },
          undoneMessage: t('toasts.removedNamedQuotes', {
            name: playlist.name,
          }),
        },
      );
      setName('');
      onClose();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : i18n.t('web:batch51.couldNotSave'),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root isOpen={isOpen} onClose={close} className="max-w-md">
      <Dialog.Title>
        {t('saveQueueLocalDialog.saveQueueAsLocalPlaylist')}
      </Dialog.Title>
      <Dialog.Description>
        {t('saveQueueLocalDialogBatch35.description', {
          count: trackIds.length,
          countLabel: trackIds.length.toLocaleString(dateLocaleTag()),
        })}
        {streamed > 0
          ? ` ${t('saveQueueLocalDialogBatch35.streamedNote', { count: streamed })}`
          : ''}
      </Dialog.Description>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <Input
          label={t('saveQueueLocalDialog.playlistName')}
          value={name}
          autoFocus
          error={error ?? undefined}
          onChange={(event) => setName(event.target.value)}
        />
        <Dialog.Actions>
          <Dialog.Close>{t('saveQueueLocalDialog.cancel')}</Dialog.Close>
          <Button
            className="gap-1.5"
            disabled={busy || !name.trim() || trackIds.length === 0}
            type="submit"
          >
            {busy ? <Loader size="inline" shape="circle" /> : null}
            {t('saveQueueLocalText.saveLocalPlaylist')}
          </Button>
        </Dialog.Actions>
      </form>
    </Dialog.Root>
  );
}
