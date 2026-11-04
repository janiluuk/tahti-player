import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog } from '@tahti-player/ui';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ResetConfirmDialog({ isOpen, onClose, onConfirm }: Props) {
  const { t } = useTranslation('web');
  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose}>
      <Dialog.Title>Reset unsaved changes?</Dialog.Title>
      <Dialog.Description>
        This discards everything you&apos;ve changed since the last save and
        restores your live look. This can&apos;t be undone.
      </Dialog.Description>
      <Dialog.Actions>
        <Dialog.Close>{t('actions.cancel')}</Dialog.Close>
        <Button onClick={onConfirm} variant="secondary">
          {t('actions.reset')}
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
