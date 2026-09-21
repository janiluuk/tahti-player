import { LoaderCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, Input } from '@tahti-player/ui';

import type { TahtiNativeLibrary } from '../lib/nativeLibrary';
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
      toast.success(
        `Saved ${added.toLocaleString('en-US')} ${added === 1 ? 'track' : 'tracks'} to “${playlist.name}”.`,
        added < trackIds.length
          ? {
              description: `${trackIds.length - added} local ${trackIds.length - added === 1 ? 'file is' : 'files are'} not in your library and weren’t saved.`,
            }
          : undefined,
      );
      setName('');
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root isOpen={isOpen} onClose={close} className="max-w-md">
      <Dialog.Title>Save queue as local playlist</Dialog.Title>
      <Dialog.Description>
        Saves the {trackIds.length.toLocaleString('en-US')} local{' '}
        {trackIds.length === 1 ? 'track' : 'tracks'} in your queue, in queue
        order, to a playlist on this device.
        {streamed > 0
          ? ` ${streamed} streamed ${streamed === 1 ? 'track (Tahti, radio or live)' : 'tracks (Tahti, radio or live)'} can’t be stored locally and ${streamed === 1 ? 'isn’t' : 'aren’t'} included — use “Save queue to cloud playlist” for those.`
          : ''}
      </Dialog.Description>
      <Input
        label="Playlist name"
        value={name}
        autoFocus
        error={error ?? undefined}
        onChange={(event) => setName(event.target.value)}
      />
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <Button
          disabled={busy || !name.trim() || trackIds.length === 0}
          onClick={() => void save()}
        >
          {busy ? (
            <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
          ) : null}
          Save local playlist
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
