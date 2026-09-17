import { Button, Dialog, Input } from '@tahti-player/ui';

type Props = {
  isOpen: boolean;
  presetBusy: boolean;
  presetNameInput: string;
  onNameChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function SavePresetDialog({
  isOpen,
  presetBusy,
  presetNameInput,
  onNameChange,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Dialog.Root
      isOpen={isOpen}
      onClose={() => {
        if (!presetBusy) {
          onClose();
        }
      }}
    >
      <Dialog.Title>Save preset</Dialog.Title>
      <Dialog.Description>
        Save the current look under a name so you can switch back to it later.
      </Dialog.Description>
      <Input
        label="Preset name"
        value={presetNameInput}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder="e.g. Neon night"
        autoFocus
      />
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <Button disabled={presetBusy} onClick={onConfirm}>
          Save preset
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
