import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog } from '@tahti-player/ui';

import type { ChannelVisualPreset } from '../../api/channel-design';

type Props = {
  target: ChannelVisualPreset | null;
  presetBusy: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeletePresetDialog({
  target,
  presetBusy,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useTranslation('web');
  return (
    <Dialog.Root
      isOpen={target !== null}
      onClose={() => {
        if (!presetBusy) {
          onClose();
        }
      }}
    >
      <Dialog.Title>Delete &ldquo;{target?.name}&rdquo;?</Dialog.Title>
      <Dialog.Description>
        This preset will be gone for good. Your current, live look is not
        affected.
      </Dialog.Description>
      <Dialog.Actions>
        <Dialog.Close>{t('actions.cancel')}</Dialog.Close>
        <Button disabled={presetBusy} variant="secondary" onClick={onConfirm}>
          Delete preset
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
