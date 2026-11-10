import { useTranslation } from '@tahti-player/i18n';
import { Dialog } from '@tahti-player/ui';

import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { TrackEditDialog } from '../../../components/TrackEditDialog';
import { TrackInsightsPanel } from '../../../components/TrackInsightsPanel';
import { SoundsBulkEditDialog } from './SoundsBulkEditDialog';
import type { StudioSoundsState } from './useStudioSoundsState';

export function SoundsDialogs({ state }: { state: StudioSoundsState }) {
  const { t } = useTranslation('web');
  const {
    editingId,
    setEditingId,
    setItems,
    statsItem,
    setStatsItem,
    pendingDeleteItem,
    setPendingDeleteItem,
    confirmDelete,
    pendingBulkDelete,
    setPendingBulkDelete,
    confirmBulkDelete,
    bulkConfirmMismatch,
    setBulkConfirmMismatch,
    confirmBulkMismatch,
    selectedIds,
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
        <Dialog.Title>
          {statsItem?.title ?? t('library.soundsStatsTitle')}
        </Dialog.Title>
        <Dialog.Description>
          {t('library.soundsStatsDescription')}
        </Dialog.Description>
        {statsItem ? (
          <TrackInsightsPanel kind="sound" id={statsItem.id} />
        ) : null}
        <Dialog.Actions>
          <Dialog.Close>{t('actions.close')}</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>
      <ConfirmDialog
        destructive
        isOpen={pendingDeleteItem !== null}
        title={
          pendingDeleteItem
            ? t('library.soundsDeleteNamed', { title: pendingDeleteItem.title })
            : t('library.soundsDeleteTrack')
        }
        description={t('library.soundsCannotUndo')}
        confirmLabel={t('actions.delete')}
        onCancel={() => setPendingDeleteItem(null)}
        onConfirm={confirmDelete}
      />
      <ConfirmDialog
        destructive
        isOpen={pendingBulkDelete}
        title={
          selectedIds.size === 1
            ? t('library.soundsDeleteSelectedOne')
            : t('library.soundsDeleteSelectedOther', {
                count: selectedIds.size,
              })
        }
        description={t('library.soundsCannotUndo')}
        confirmLabel={t('actions.delete')}
        onCancel={() => setPendingBulkDelete(false)}
        onConfirm={confirmBulkDelete}
      />
      <ConfirmDialog
        isOpen={bulkConfirmMismatch !== null}
        title={t('library.soundsConfirmTotalTitle')}
        description={t('library.soundsConfirmTotalDescription', {
          count: bulkConfirmMismatch?.totalMatched ?? 0,
        })}
        confirmLabel={t('library.soundsConfirmTotalContinue')}
        onCancel={() => setBulkConfirmMismatch(null)}
        onConfirm={confirmBulkMismatch}
      />
      <SoundsBulkEditDialog state={state} />
    </>
  );
}
