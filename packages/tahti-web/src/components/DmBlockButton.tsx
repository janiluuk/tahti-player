import { BanIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@tahti-player/ui';

import { blockUser, unblockUser } from '../api/blocks';
import { ConfirmDialog } from './ConfirmDialog';

/** Block or unblock the other person in a direct-message thread. Blocking
 * asks first; while blocked, neither side can message the other. */
export function DmBlockButton({
  username,
  displayName,
  blocked,
  onChange,
}: {
  username: string;
  displayName: string;
  blocked: boolean;
  onChange: (blocked: boolean) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const unblock = () => {
    setBusy(true);
    void unblockUser(username).then((result) => {
      setBusy(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onChange(false);
      toast.success(`Unblocked ${displayName}.`);
    });
  };

  const block = () => {
    setConfirming(false);
    setBusy(true);
    void blockUser(username).then((result) => {
      setBusy(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onChange(true);
      toast.success(`Blocked ${displayName}.`);
    });
  };

  return (
    <>
      <Button
        size="sm"
        variant="text"
        disabled={busy}
        onClick={blocked ? unblock : () => setConfirming(true)}
      >
        <BanIcon size={14} aria-hidden />
        {blocked ? 'Unblock' : 'Block'}
      </Button>
      <ConfirmDialog
        isOpen={confirming}
        title={`Block ${displayName}?`}
        description="You won't be able to message each other until you unblock them. They aren't told you blocked them."
        confirmLabel="Block"
        onCancel={() => setConfirming(false)}
        onConfirm={block}
      />
    </>
  );
}
