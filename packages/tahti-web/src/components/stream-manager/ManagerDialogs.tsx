import { Button, Dialog } from '@tahti-player/ui';

import { fetchStreamOverlay } from '../../api/broadcast';
import { StreamOverlayEditor } from '../StreamOverlayEditor';
import type { StreamManagerState } from './useStreamManagerState';

/** The overlay-settings and end-stream-confirmation dialogs, shown only
 * when the viewer can control the stream. */
export function ManagerDialogs({ state }: { state: StreamManagerState }) {
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
        <Dialog.Title>Stream overlay</Dialog.Title>
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
        <Dialog.Title>Stop your live stream?</Dialog.Title>
        <Dialog.Description>
          Listeners will hear the 24/7 rotation instead. You can go live again
          any time.
        </Dialog.Description>
        <Dialog.Actions>
          <Dialog.Close>Cancel</Dialog.Close>
          <Button
            disabled={ending}
            onClick={() => {
              setConfirmEndOpen(false);
              void handleEnd();
            }}
          >
            {ending ? 'Ending…' : 'Stop stream'}
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
}
