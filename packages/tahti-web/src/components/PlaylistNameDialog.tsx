import { LoaderCircleIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, Dialog, Input } from '@tahti-player/ui';

type Props = {
  isOpen: boolean;
  title: string;
  confirmLabel: string;
  initialName?: string;
  onClose: () => void;
  /** Throw to keep the dialog open and show the message. */
  onSubmit: (name: string) => Promise<void>;
};

/** Name entry shared by "New playlist" and "Rename". */
export function PlaylistNameDialog({
  isOpen,
  title,
  confirmLabel,
  initialName = '',
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setError(null);
    }
  }, [isOpen, initialName]);

  const submit = async () => {
    if (!name.trim() || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(name.trim());
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root isOpen={isOpen} onClose={() => (busy ? undefined : onClose())}>
      <Dialog.Title>{title}</Dialog.Title>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Input
          label="Name"
          value={name}
          autoFocus
          error={error ?? undefined}
          onChange={(event) => setName(event.target.value)}
        />
      </form>
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <Button disabled={!name.trim() || busy} onClick={() => void submit()}>
          {busy ? (
            <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
          ) : null}
          {confirmLabel}
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
