import { useTranslation } from '@tahti-player/i18n';
import {
  ConfirmDialog as UiConfirmDialog,
  type ConfirmDialogProps as UiConfirmDialogProps,
} from '@tahti-player/ui';

export type ConfirmDialogProps = UiConfirmDialogProps;

export function ConfirmDialog({
  confirmLabel,
  cancelLabel,
  ...rest
}: ConfirmDialogProps) {
  const { t } = useTranslation('web');
  return (
    <UiConfirmDialog
      confirmLabel={confirmLabel ?? t('actions.confirm')}
      cancelLabel={cancelLabel ?? t('actions.cancel')}
      {...rest}
    />
  );
}
