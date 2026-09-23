import { useEffect, useState } from 'react';

import { Button, Dialog, Textarea } from '@tahti-player/ui';

import { type AdminAddon } from '../../../api/admin';

export function RejectDialog({
  addon,
  pending,
  onCancel,
  onConfirm,
}: {
  addon: AdminAddon | null;
  pending: boolean;
  onCancel: () => void;
  onConfirm: (moderationNote: string) => void;
}) {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!addon) {
      setNote('');
    }
  }, [addon]);

  return (
    <Dialog.Root
      isOpen={addon !== null}
      onClose={onCancel}
      className="max-w-md"
    >
      <Dialog.Title>Reject {addon?.name}?</Dialog.Title>
      <Dialog.Description>
        A reason is required — it&apos;s shown to the author.
      </Dialog.Description>
      <Textarea
        value={note}
        rows={3}
        placeholder="Why is this add-on being rejected?"
        onChange={(event) => setNote(event.target.value)}
      />
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <Button
          type="button"
          disabled={pending || !note.trim()}
          onClick={() => onConfirm(note.trim())}
        >
          Reject
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
