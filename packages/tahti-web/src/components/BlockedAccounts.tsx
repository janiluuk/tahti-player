import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, MediaArtwork } from '@tahti-player/ui';

import {
  fetchBlockedUsers,
  unblockUser,
  type BlockedUser,
} from '../api/blocks';
import { placeholderArtworkUrl } from '../lib/placeholderArt';

/** The accounts you blocked from messaging you, each with an Unblock
 * button. Blocking itself happens from a direct-message thread. */
export function BlockedAccounts() {
  const [blocked, setBlocked] = useState<BlockedUser[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchBlockedUsers().then((list) => {
      if (!cancelled) {
        setBlocked(list);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const unblock = (user: BlockedUser) => {
    setBusy(user.username);
    void unblockUser(user.username).then((result) => {
      setBusy(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setBlocked((current) =>
        (current ?? []).filter((b) => b.username !== user.username),
      );
      toast.success(`Unblocked ${user.displayName}.`);
    });
  };

  return (
    <section
      aria-labelledby="blocked-accounts-title"
      className="flex flex-col gap-2"
    >
      <h2 id="blocked-accounts-title" className="font-semibold">
        Blocked accounts
      </h2>
      <p className="text-foreground-secondary text-sm">
        People you blocked can&apos;t send you direct messages, and you
        can&apos;t message them. Block someone from a conversation in Messages.
      </p>
      {blocked === null ? (
        <p className="text-foreground-secondary text-sm">Loading…</p>
      ) : blocked.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          You haven&apos;t blocked anyone.
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {blocked.map((user) => (
            <li
              key={user.username}
              className="flex items-center justify-between gap-3 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <MediaArtwork
                  src={user.avatarUrl ?? placeholderArtworkUrl(user.username)}
                  alt=""
                  size="sm"
                  className="rounded-full"
                />
                <span className="min-w-0 truncate">
                  {user.displayName}{' '}
                  <span className="text-foreground-secondary">
                    @{user.username}
                  </span>
                </span>
              </span>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy === user.username}
                aria-label={`Unblock ${user.displayName}`}
                onClick={() => unblock(user)}
              >
                Unblock
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
