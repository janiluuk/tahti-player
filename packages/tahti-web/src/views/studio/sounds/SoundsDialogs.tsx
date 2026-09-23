import { Dialog } from '@tahti-player/ui';

import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { TrackEditDialog } from '../../../components/TrackEditDialog';
import { TrackInsightsPanel } from '../../../components/TrackInsightsPanel';
import type { StudioSoundsState } from './useStudioSoundsState';

export function SoundsDialogs({ state }: { state: StudioSoundsState }) {
  const {
    editingId,
    setEditingId,
    setItems,
    statsItem,
    setStatsItem,
    pendingDeleteItem,
    setPendingDeleteItem,
    confirmDelete,
  } = state;

  return (
    <>
      <TrackEditDialog
        soundId={editingId}
        onClose={() => setEditingId(null)}
        onSaved={(saved) =>
          setItems((current) =>
            current.map((item) => (item.id === saved.id ? saved : item)),
          )
        }
      />
      <Dialog.Root
        isOpen={Boolean(statsItem)}
        onClose={() => setStatsItem(null)}
        className="max-w-3xl"
      >
        <Dialog.Title>{statsItem?.title ?? 'Track stats'}</Dialog.Title>
        <Dialog.Description>
          Plays, downloads, and listener geography for this track.
        </Dialog.Description>
        {statsItem ? (
          <TrackInsightsPanel kind="sound" id={statsItem.id} />
        ) : null}
        <Dialog.Actions>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>
      <ConfirmDialog
        isOpen={pendingDeleteItem !== null}
        title={
          pendingDeleteItem
            ? `Delete “${pendingDeleteItem.title}”?`
            : 'Delete track?'
        }
        description="This cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteItem(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
