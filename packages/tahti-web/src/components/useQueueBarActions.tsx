import { HardDriveIcon, ListMusicIcon, ShuffleIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import type { QueueHeaderMenuItem } from '@tahti-player/ui';

import { getNativeLibrary } from '../lib/nativeLibrary';
import { usePlayerStore } from '../stores/playerStore';
import { ClearQueueConfirmDialog } from './ClearQueueConfirmDialog';
import { SaveQueueAsPlaylistDialog } from './SaveQueueAsPlaylistDialog';
import { SaveQueueLocalDialog } from './SaveQueueLocalDialog';

export type QueueBarActions = {
  queueLength: number;
  requestClear: () => void;
  menuItems: QueueHeaderMenuItem[];
  /** Confirmation and save dialogs; render once next to the triggers. */
  dialogs: ReactNode;
};

export function useQueueBarActions(): QueueBarActions {
  const queueLength = usePlayerStore((s) => s.queue.length);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const shuffleQueueOrder = usePlayerStore((s) => s.shuffleQueueOrder);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [savingAsPlaylist, setSavingAsPlaylist] = useState(false);
  const [savingLocal, setSavingLocal] = useState(false);
  const nativeLibrary = getNativeLibrary();

  const menuItems: QueueHeaderMenuItem[] = [
    {
      id: 'save-as-playlist',
      label: nativeLibrary
        ? 'Save queue to cloud playlist'
        : 'Save queue as playlist',
      icon: <ListMusicIcon size={15} aria-hidden />,
      disabled: queueLength === 0,
      onClick: () => setSavingAsPlaylist(true),
    },
    ...(nativeLibrary
      ? [
          {
            id: 'save-local',
            label: 'Save queue as local playlist',
            icon: <HardDriveIcon size={15} aria-hidden />,
            disabled: queueLength === 0,
            onClick: () => setSavingLocal(true),
          },
        ]
      : []),
    {
      id: 'shuffle-order',
      label: 'Randomize queue order',
      icon: <ShuffleIcon size={15} aria-hidden />,
      disabled: queueLength < 2,
      onClick: shuffleQueueOrder,
    },
  ];

  const dialogs = (
    <>
      <ClearQueueConfirmDialog
        isOpen={confirmingClear}
        count={queueLength}
        onCancel={() => setConfirmingClear(false)}
        onConfirm={() => {
          clearQueue();
          setConfirmingClear(false);
        }}
      />
      {nativeLibrary ? (
        <SaveQueueLocalDialog
          isOpen={savingLocal}
          onClose={() => setSavingLocal(false)}
          library={nativeLibrary}
        />
      ) : null}
      <SaveQueueAsPlaylistDialog
        isOpen={savingAsPlaylist}
        onClose={() => setSavingAsPlaylist(false)}
      />
    </>
  );

  return {
    queueLength,
    requestClear: () => setConfirmingClear(true),
    menuItems,
    dialogs,
  };
}
