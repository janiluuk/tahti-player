import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog } from '@tahti-player/ui';

import { fetchStreamOverlay } from '../../api/broadcast';
import { StreamOverlayEditor } from '../StreamOverlayEditor';
import type { StreamManagerState } from './useStreamManagerState';

/** The overlay-settings and end-stream-confirmation dialogs, shown only
 * when the viewer can control the stream. */
export function ManagerDialogs({ state }: { state: StreamManagerState }) {
  const { t } = useTranslation('web');
  const {
    overlayModalOpen,
    setOverlayModalOpen,
    setOverlayShowTitle,
    confirmEndOpen,
    setConfirmEndOpen,
    ending,
    handleEnd,
  } = state;

  return (
    <>
      <Dialog.Root
        isOpen={overlayModalOpen}
        onClose={() => setOverlayModalOpen(false)}
        className="max-w-lg"
      >
        <Dialog.Title>{t('managerDialogs.streamOverlay')}</Dialog.Title>
        <div className="mt-4">
          <StreamOverlayEditor
            onSaved={() => {
              setOverlayModalOpen(false);
              void fetchStreamOverlay().then((result) =>
                setOverlayShowTitle(result.data.streamOverlayShowTitle),
              );
            }}
          />
        </div>
      </Dialog.Root>
      <Dialog.Root
        isOpen={confirmEndOpen}
        onClose={() => setConfirmEndOpen(false)}
      >
        <Dialog.Title>{t('managerDialogs.stopYourLiveStream')}</Dialog.Title>
        <Dialog.Description>
          {t('managerDialogs.listenersWillHearThe24')}
        </Dialog.Description>
        <Dialog.Actions>
          <Dialog.Close>{t('managerDialogs.cancel')}</Dialog.Close>
          <Button
            intent="danger"
            disabled={ending}
            onClick={() => {
              setConfirmEndOpen(false);
              void handleEnd();
            }}
          >
            {ending
              ? t('streamManagerManagerDialogsStates.ending')
              : t('streamManagerManagerDialogsStates.stopStream')}
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
}
