import { Button, Dialog } from '@tahti-player/ui';

type Props = {
  isOpen: boolean;
  label: string;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Confirms before taking a widget off the Listen dashboard. The widget's
 * own settings (a station's overrides, an embed's saved URL/label) aren't
 * touched by this — only its place on the dashboard. */
export function RemoveWidgetDialog({
  isOpen,
  label,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Dialog.Root isOpen={isOpen} onClose={onCancel}>
      <Dialog.Title>Remove {label}?</Dialog.Title>
      <Dialog.Description>
        This takes {label} off your Listen dashboard. You can add it back later
        from Manage widgets.
      </Dialog.Description>
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <Button variant="secondary" intent="danger" onClick={onConfirm}>
          Remove
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
