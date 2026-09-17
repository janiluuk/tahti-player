import { Button, Dialog } from '@tahti-player/ui';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ResetConfirmDialog({ isOpen, onClose, onConfirm }: Props) {
  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose}>
      <Dialog.Title>Reset unsaved changes?</Dialog.Title>
      <Dialog.Description>
        This discards everything you&apos;ve changed since the last save and
        restores your live look. This can&apos;t be undone.
      </Dialog.Description>
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <Button onClick={onConfirm} variant="secondary">
          Reset
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
