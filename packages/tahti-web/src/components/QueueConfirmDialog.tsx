import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog } from '@tahti-player/ui';

type Props = {
  isOpen: boolean;
  count: number;
  /** Whose tracks these are, e.g. an album or artist name — used in the description. */
  sourceLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Confirms before dumping many tracks into the play queue at once, e.g. a
 * whole album or artist discography — a stray click shouldn't silently
 * commit that many tracks with no way to see it coming. */
export function QueueConfirmDialog({
  isOpen,
  count,
  sourceLabel,
  onCancel,
  onConfirm,
}: Props) {
  const { t } = useTranslation('web');
  return (
    <Dialog.Root isOpen={isOpen} onClose={onCancel}>
      <Dialog.Title>Queue {count} tracks?</Dialog.Title>
      <Dialog.Description>
        This adds all {count} tracks from {sourceLabel} to your play queue.
      </Dialog.Description>
      <Dialog.Actions>
        <Dialog.Close>{t('queueConfirmDialogText.cancel')}</Dialog.Close>
        <Button onClick={onConfirm}>Queue {count} tracks</Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
