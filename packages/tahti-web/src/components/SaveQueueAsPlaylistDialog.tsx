import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog, InlineError, Input } from '@tahti-player/ui';

import {
  addStudioCollectionItem,
  createStudioCollection,
  deleteStudioCollection,
} from '../api/studio';
import { soundIdFromPlayableId } from '../lib/soundId';
import { toastWithUndo } from '../lib/undoToast';
import { usePlayerStore } from '../stores/playerStore';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

/** Creates a new studio collection from the current queue's Tahti sound
 * tracks (composing the same createStudioCollection/addStudioCollectionItem
 * calls AddToPlaylistPanel uses for single tracks — no new persistence). */
export function SaveQueueAsPlaylistDialog({ isOpen, onClose }: Props) {
  const { t } = useTranslation('web');
  const queue = usePlayerStore((s) => s.queue);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const soundIds = queue
    .map((item) => soundIdFromPlayableId(item.track.source.id))
    .filter((id): id is string => Boolean(id));
  const skipped = queue.length - soundIds.length;
  const localCount = queue.filter((item) =>
    item.track.source.id.startsWith('local:'),
  ).length;

  const handleClose = () => {
    if (busy) {
      return;
    }
    setName('');
    setError(null);
    onClose();
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || soundIds.length === 0) {
      return;
    }
    setBusy(true);
    setError(null);
    const created = await createStudioCollection({ name: trimmed });
    if (!created.ok) {
      setBusy(false);
      setError(created.error);
      return;
    }
    for (const soundId of soundIds) {
      await addStudioCollectionItem(created.data.slug, soundId);
    }
    setBusy(false);
    setName('');
    onClose();
    toastWithUndo(
      t('multicastSectionBatch32.saved', { name: created.data.name }),
      {
        undo: () => deleteStudioCollection(created.data.slug),
        undoneMessage: t('multicastSectionBatch32.removed', {
          name: created.data.name,
        }),
      },
    );
  };

  return (
    <Dialog.Root isOpen={isOpen} onClose={handleClose} className="max-w-md">
      <Dialog.Title>
        {t('saveQueueAsPlaylistDialog.saveQueueAsPlaylist')}
      </Dialog.Title>
      <Dialog.Description>
        {t('saveQueueAsPlaylistDialogBatch35.description', {
          count: soundIds.length,
        })}
        {skipped - localCount > 0 &&
          ` ${t('saveQueueAsPlaylistDialogBatch35.otherSkipped', { count: skipped - localCount })}`}
        {localCount > 0 &&
          ` ${t('saveQueueAsPlaylistDialogBatch35.localSkipped', { count: localCount })}`}
      </Dialog.Description>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}
      >
        <Input
          label={t('saveQueueAsPlaylistDialog.playlistName')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
        />
        {error && <InlineError className="mt-2">{error}</InlineError>}
        <Dialog.Actions>
          <Dialog.Close>{t('saveQueueAsPlaylistDialog.cancel')}</Dialog.Close>
          <Button
            disabled={busy || !name.trim() || soundIds.length === 0}
            type="submit"
          >
            {busy
              ? t('saveQueueAsPlaylistDialogStates.saving')
              : t('saveQueueAsPlaylistDialogStates.savePlaylist')}
          </Button>
        </Dialog.Actions>
      </form>
    </Dialog.Root>
  );
}
