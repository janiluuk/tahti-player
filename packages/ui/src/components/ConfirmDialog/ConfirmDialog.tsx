import { Button } from '../Button';
import { Dialog } from '../Dialog';

export type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Shared destructive/confirm prompt — prefer this over `window.confirm`. */
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root isOpen={isOpen} onClose={onCancel}>
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Description>{description}</Dialog.Description>
      <Dialog.Actions>
        <Dialog.Close>{cancelLabel}</Dialog.Close>
        <Button
          onClick={() => {
            onConfirm();
          }}
        >
          {confirmLabel}
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
