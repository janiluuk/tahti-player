import { Button } from '../Button';
import { Dialog } from '../Dialog';

export type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Paint the confirm button red for deletes, removals and other one-way actions. */
  destructive?: boolean;
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
  destructive = false,
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
          intent={destructive ? 'danger' : undefined}
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
