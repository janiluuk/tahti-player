import { Link } from '@tanstack/react-router';

import { Button, Dialog, MediaArtwork } from '@tahti-player/ui';

import type { FollowListUser } from '../api/types';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { PageEmpty, PageError, PageLoading } from './PageStates';

export type FollowListDialogProps = {
  isOpen: boolean;
  title: string;
  users: FollowListUser[];
  loading: boolean;
  error: boolean;
  hasMore: boolean;
  emptyMessage: string;
  onLoadMore: () => void;
  onClose: () => void;
};

export function FollowListDialog({
  isOpen,
  title,
  users,
  loading,
  error,
  hasMore,
  emptyMessage,
  onLoadMore,
  onClose,
}: FollowListDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      actions={<Dialog.Close>Close</Dialog.Close>}
    >
      <div className="max-h-[60vh] overflow-y-auto" data-testid="follow-list">
        {users.length > 0 ? (
          <ul className="divide-border divide-y-(length:--border-width)">
            {users.map((user) => (
              <li key={user.username}>
                <Link
                  to="/u/$username"
                  params={{ username: user.username }}
                  onClick={onClose}
                  className="hover:bg-background-secondary flex items-center gap-3 py-2 pr-2"
                >
                  <MediaArtwork
                    size="sm"
                    src={user.avatarUrl ?? placeholderArtworkUrl(user.username)}
                    alt=""
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold">
                      {user.displayName}
                    </span>
                    <span className="text-foreground-secondary truncate text-xs">
                      @{user.username}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        {loading ? <PageLoading /> : null}
        {!loading && error ? (
          <PageError
            title={`Couldn't load ${title.toLowerCase()}`}
            onRetry={onLoadMore}
          />
        ) : null}
        {!loading && !error && users.length === 0 ? (
          <PageEmpty title={emptyMessage} />
        ) : null}
        {!loading && !error && hasMore ? (
          <div className="flex justify-center pt-3">
            <Button variant="secondary" size="sm" onClick={onLoadMore}>
              Show more
            </Button>
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}
