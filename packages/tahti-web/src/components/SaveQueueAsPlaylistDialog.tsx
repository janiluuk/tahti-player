import { useState } from 'react';

import { Button, Dialog, Input } from '@tahti-player/ui';

import { addStudioCollectionItem, createStudioCollection } from '../api/studio';
import { soundIdFromPlayableId } from '../lib/soundId';
import { usePlayerStore } from '../stores/playerStore';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

/** Creates a new studio collection from the current queue's Tahti sound
 * tracks (composing the same createStudioCollection/addStudioCollectionItem
 * calls AddToPlaylistPanel uses for single tracks — no new persistence). */
export function SaveQueueAsPlaylistDialog({ isOpen, onClose }: Props) {
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
  };

  return (
    <Dialog.Root isOpen={isOpen} onClose={handleClose} className="max-w-md">
      <Dialog.Title>Save queue as playlist</Dialog.Title>
      <Dialog.Description>
        Creates a new playlist from the {soundIds.length}{' '}
        {soundIds.length === 1 ? 'track' : 'tracks'} in your queue that are part
        of the Tahti catalog.
        {skipped - localCount > 0 &&
          ` ${skipped - localCount} other ${skipped - localCount === 1 ? 'track isn’t' : 'tracks aren’t'} included.`}
        {localCount > 0 &&
          ` ${localCount} local ${localCount === 1 ? 'file lives' : 'files live'} on this device and can’t be added to a cloud playlist — use “Save queue as local playlist” to keep ${localCount === 1 ? 'it' : 'them'}.`}
      </Dialog.Description>
      <Input
        label="Playlist name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoFocus
      />
      {error && (
        <p className="text-accent-red mt-2 text-sm" role="alert">
          {error}
        </p>
      )}
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <Button
          disabled={busy || !name.trim() || soundIds.length === 0}
          onClick={() => void handleSave()}
        >
          {busy ? 'Saving…' : 'Save playlist'}
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
