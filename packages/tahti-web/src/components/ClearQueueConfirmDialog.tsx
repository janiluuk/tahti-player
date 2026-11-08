import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog } from '@tahti-player/ui';

type Props = {
  isOpen: boolean;
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Confirms before clearing the play queue — shared by the playerbar's
 * collapsed queue strip and the sidebar queue panel, so clearing always
 * asks first regardless of which surface it's triggered from. */
export function ClearQueueConfirmDialog({
  isOpen,
  count,
  onCancel,
  onConfirm,
}: Props) {
  const { t } = useTranslation('web');
  return (
    <Dialog.Root isOpen={isOpen} onClose={onCancel}>
      <Dialog.Title>{t('clearQueueConfirmDialog.clearQueue')}</Dialog.Title>
      <Dialog.Description>
        This removes all {count} {count === 1 ? 'track' : 'tracks'} from your
        play queue. This can&apos;t be undone.
      </Dialog.Description>
      <Dialog.Actions>
        <Dialog.Close>{t('clearQueueConfirmDialog.cancel')}</Dialog.Close>
        <Button intent="danger" onClick={onConfirm}>
          {t('clearQueueConfirmDialog.clearQueue2')}
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
