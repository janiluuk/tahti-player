import { useCallback, useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import { fetchFollowList } from '../api/follows';
import type { FollowListUser } from '../api/types';
import { FollowListRows } from '../components/FollowListDialog';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { useAuthStore } from '../stores/authStore';

export function LibraryFollowingView() {
  const { t } = useTranslation('web');
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
    return <PageEmpty title={t('library.following.signIn')} />;
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
          title={t('library.following.loadError')}
          onRetry={() => void load(users.length)}
        />
      ) : null}
      {!loading && !error && users.length === 0 ? (
        <PageEmpty
          title={t('library.following.emptyTitle')}
          description={t('library.following.emptyDescription')}
        />
      ) : null}
      {!loading && !error && hasMore ? (
        <div className="flex justify-center pt-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void load(users.length)}
          >
            {t('library.following.showMore')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
