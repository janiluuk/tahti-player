import { Trash2Icon } from 'lucide-react';
import { useState } from 'react';

import { Button, Dialog, Input } from '@tahti-player/ui';

import {
  deleteAdminUserAccount,
  type AdminAccountDeletionResult,
  type AdminUserDetail,
} from '../../api/admin';
import { StudioPanel } from '../StudioPanel';

export function AdminUserDeletePanel({
  user,
  isSelf,
  onDeleted,
}: {
  user: Pick<AdminUserDetail, 'id' | 'username' | 'displayName' | 'isBoard'>;
  isSelf: boolean;
  onDeleted?: (result: AdminAccountDeletionResult) => void;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<AdminAccountDeletionResult | null>(null);

  const blocked = isSelf
    ? 'You can’t delete your own account here.'
    : user.isBoard
      ? 'Remove the board role before deleting a board member.'
      : null;

  const close = () => {
    if (busy) {
      return;
    }
    setOpen(false);
    setTyped('');
    setError(null);
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    const result = await deleteAdminUserAccount(user.id);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setDone(result.data);
    onDeleted?.(result.data);
  };

  return (
    <StudioPanel
      title="Delete account"
      description="GDPR deletion: personal data is anonymized, the membership and fan subscriptions are cancelled and newsletter sign-ups removed. This can’t be undone."
    >
      {done ? (
        <p className="text-sm" role="status">
          Account deleted. {done.fanSubscriptionsCanceled} fan subscriptions
          cancelled, {done.newsletterSubscribersRemoved} newsletter sign-ups
          removed.
        </p>
      ) : (
        <>
          {blocked ? (
            <p className="text-foreground-secondary text-sm">{blocked}</p>
          ) : null}
          <Button
            size="sm"
            intent="danger"
            disabled={Boolean(blocked)}
            onClick={() => setOpen(true)}
          >
            <Trash2Icon size={14} aria-hidden className="mr-1.5" />
            Delete account…
          </Button>
        </>
      )}

      <Dialog.Root isOpen={open} onClose={close}>
        <Dialog.Title>Delete {user.displayName}’s account?</Dialog.Title>
        <Dialog.Description>
          This anonymizes the account and cancels its billing for good. Type
          their username, {user.username}, to confirm.
        </Dialog.Description>
        <Input
          aria-label="Username to confirm"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          placeholder={user.username}
        />
        {error ? (
          <p className="text-accent-red-strong mt-2 text-sm" role="alert">
            {error}
          </p>
        ) : null}
        <Dialog.Actions>
          <Dialog.Close>Cancel</Dialog.Close>
          <Button
            intent="danger"
            disabled={busy || typed.trim() !== user.username}
            onClick={() => void confirm()}
          >
            {busy ? 'Deleting…' : 'Delete account'}
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </StudioPanel>
  );
}
