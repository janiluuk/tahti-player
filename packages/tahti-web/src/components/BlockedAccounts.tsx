import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, MediaArtwork } from '@tahti-player/ui';

import {
  fetchBlockedUsersResult,
  unblockUser,
  type BlockedUser,
} from '../api/blocks';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { PageEmpty, PageError, PageLoading } from './PageStates';

/** The accounts you blocked from messaging you, each with an Unblock
 * button. Blocking itself happens from a direct-message thread. */
export function BlockedAccounts() {
  const [blocked, setBlocked] = useState<BlockedUser[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setBlocked(null);
    void fetchBlockedUsersResult().then(({ data, meta }) => {
      if (!cancelled) {
        setBlocked(data);
        setLoadError(meta.source === 'api' ? (meta.reason ?? null) : null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

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
        You and the people you block can&apos;t message each other, comment on,
        love or repost each other&apos;s tracks, @mention each other, or join
        each other&apos;s jams and collaborative playlists, and they can&apos;t
        post or react in your channel&apos;s chat. Following stops both ways.
        They aren&apos;t told. Block someone from their artist page or from a
        conversation in Messages.
      </p>
      {blocked === null ? (
        <PageLoading label="Loading blocked accounts…" />
      ) : loadError && blocked.length === 0 ? (
        <PageError
          title="Could not load blocked accounts"
          description={loadError}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      ) : blocked.length === 0 ? (
        <PageEmpty title="You haven't blocked anyone" />
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
