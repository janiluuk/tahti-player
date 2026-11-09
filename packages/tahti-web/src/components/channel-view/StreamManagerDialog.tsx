import { useTranslation } from '@tahti-player/i18n';
import { Dialog } from '@tahti-player/ui';

import { StreamManagerPanel } from '../StreamManagerPanel';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  channelState: string;
  readOnly: boolean;
};

export function StreamManagerDialog({
  isOpen,
  onClose,
  slug,
  channelState,
  readOnly,
}: Props) {
  const { t } = useTranslation('web');
  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose} className="max-w-xl">
      <Dialog.Title>{t('streamManagerDialogText.streamManager')}</Dialog.Title>
      <div className="mt-4">
        <StreamManagerPanel
          slug={slug}
          channelState={channelState}
          readOnly={readOnly}
        />
      </div>
    </Dialog.Root>
  );
}
