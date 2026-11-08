import { useTranslation } from '@tahti-player/i18n';
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
  const { t } = useTranslation('web');
  return (
    <Dialog.Root
      isOpen={isOpen}
      onClose={() => {
        if (!presetBusy) {
          onClose();
        }
      }}
    >
      <Dialog.Title>{t('savePresetDialog.savePreset')}</Dialog.Title>
      <Dialog.Description>
        {t('savePresetDialog.saveTheCurrentLookUnder')}
      </Dialog.Description>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm();
        }}
      >
        <Input
          label={t('savePresetDialog.presetName')}
          value={presetNameInput}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="e.g. Neon night"
          autoFocus
        />
        <Dialog.Actions>
          <Dialog.Close>{t('actions.cancel')}</Dialog.Close>
          <Button disabled={presetBusy} type="submit">
            {t('savePresetDialog.savePreset')}
          </Button>
        </Dialog.Actions>
      </form>
    </Dialog.Root>
  );
}
