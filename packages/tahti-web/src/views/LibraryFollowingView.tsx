import { useCallback, useEffect, useState } from 'react';

import { Button } from '@tahti-player/ui';

import { fetchFollowList } from '../api/follows';
import type { FollowListUser } from '../api/types';
import { FollowListRows } from '../components/FollowListDialog';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { useAuthStore } from '../stores/authStore';

export function LibraryFollowingView() {
  const username = useAuthStore((state) => state.user?.username ?? null);
  const [users, setUsers] = useState<FollowListUser[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(
    async (offset: number) => {
      if (!username) {
        return;
      }
      setLoading(true);
      setError(false);
      const page = await fetchFollowList(username, 'following', offset);
      setLoading(false);
      if (!page) {
        setError(true);
        return;
      }
      setUsers((previous) =>
        offset === 0 ? page.users : [...previous, ...page.users],
      );
      setHasMore(page.hasMore);
    },
    [username],
  );

  useEffect(() => {
    void load(0);
  }, [load]);

  if (!username) {
    return <PageEmpty title="Sign in to see who you follow" />;
  }

  return (
    <div
      className="flex max-w-2xl flex-col gap-2"
      data-testid="library-following"
    >
      <FollowListRows users={users} />
      {loading ? <PageLoading /> : null}
      {!loading && error ? (
        <PageError
          title="Couldn't load who you follow"
          onRetry={() => void load(users.length)}
        />
      ) : null}
      {!loading && !error && users.length === 0 ? (
        <PageEmpty
          title="You don't follow anyone yet"
          description="Follow artists and channels from their pages. They show up here and in your feed."
        />
      ) : null}
      {!loading && !error && hasMore ? (
        <div className="flex justify-center pt-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void load(users.length)}
          >
            Show more
          </Button>
        </div>
      ) : null}
    </div>
  );
}
