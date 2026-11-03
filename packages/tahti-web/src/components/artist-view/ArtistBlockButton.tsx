import { BanIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Tooltip } from '@tahti-player/ui';

import { blockUser, fetchBlockedUsers, unblockUser } from '../../api/blocks';
import { useAuthStore } from '../../stores/authStore';
import { ConfirmDialog } from '../ConfirmDialog';

/** Block or unblock an artist from their page. Signed-in visitors only;
 * blocking asks first and the artist is not told. */
export function useArtistBlock(username: string, displayName: string) {
  const signedIn = useAuthStore((s) => Boolean(s.user));
  const [blocked, setBlocked] = useState<boolean | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!signedIn) {
      return undefined;
    }
    let cancelled = false;
    void fetchBlockedUsers().then((list) => {
      if (!cancelled) {
        setBlocked(list.some((b) => b.username === username));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [signedIn, username]);

  const change = (next: boolean) => {
    setConfirming(false);
    setBusy(true);
    void (next ? blockUser(username) : unblockUser(username)).then((result) => {
      setBusy(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setBlocked(next);
      toast.success(
        next ? `Blocked ${displayName}.` : `Unblocked ${displayName}.`,
      );
    });
  };

  return {
    available: signedIn && blocked !== null,
    blocked: blocked === true,
    busy,
    label: blocked ? `Unblock ${displayName}` : `Block ${displayName}`,
    toggle: () => (blocked ? change(false) : setConfirming(true)),
    dialog: (
      <ConfirmDialog
        destructive
        isOpen={confirming}
        title={`Block ${displayName}?`}
        description="You won't be able to message each other, they can't comment on your tracks or follow you, and you stop following each other. They aren't told you blocked them."
        confirmLabel="Block"
        onCancel={() => setConfirming(false)}
        onConfirm={() => change(true)}
      />
    ),
  };
}

export function ArtistBlockButton({
  username,
  displayName,
}: {
  username: string;
  displayName: string;
}) {
  const block = useArtistBlock(username, displayName);
  if (!block.available) {
    return null;
  }
  return (
    <>
      <Tooltip content={block.blocked ? 'Unblock' : 'Block'} side="top">
        <Button
          size="icon-sm"
          variant="secondary"
          aria-label={block.label}
          aria-pressed={block.blocked}
          disabled={block.busy}
          onClick={block.toggle}
        >
          <BanIcon size={14} aria-hidden />
        </Button>
      </Tooltip>
      {block.dialog}
    </>
  );
}
