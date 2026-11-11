import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog } from '@tahti-player/ui';

type Props = {
  isOpen: boolean;
  label: string;
  title?: string;
  detail?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Confirms before taking a widget off the Listen dashboard. The widget's
 * own settings (a station's overrides, an embed's saved URL/label) aren't
 * touched by this — only its place on the dashboard. */
export function RemoveWidgetDialog({
  isOpen,
  label,
  title,
  detail,
  confirmLabel,
  onCancel,
  onConfirm,
}: Props) {
  const { t } = useTranslation('web');
  return (
    <Dialog.Root isOpen={isOpen} onClose={onCancel}>
      <Dialog.Title>
        {title ?? t('removeWidgetDialog.title', { label })}
      </Dialog.Title>
      <Dialog.Description>
        {detail ?? t('removeWidgetDialog.detail', { label })}
      </Dialog.Description>
      <Dialog.Actions>
        <Dialog.Close>{t('removeWidgetDialog.cancel')}</Dialog.Close>
        <Button variant="secondary" intent="danger" onClick={onConfirm}>
          {confirmLabel ?? t('removeWidgetDialog.remove')}
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
