import { Button, Dialog } from '@tahti-player/ui';

export function AlbumPlayPromptDialog({
  title,
  onClose,
  onQueue,
  onPlayNow,
}: {
  title: string | null;
  onClose: () => void;
  onQueue: () => void;
  onPlayNow: () => void;
}) {
  return (
    <Dialog.Root isOpen={title != null} onClose={onClose}>
      {title != null && (
        <>
          <Dialog.Title>Play {title}?</Dialog.Title>
          <Dialog.Description>
            Something&apos;s already queued — add this album to the end, or play
            it now instead?
          </Dialog.Description>
          <Dialog.Actions>
            <Dialog.Close>Cancel</Dialog.Close>
            <Button variant="secondary" onClick={onQueue}>
              Queue album
            </Button>
            <Button onClick={onPlayNow}>Play now</Button>
          </Dialog.Actions>
        </>
      )}
    </Dialog.Root>
  );
}
