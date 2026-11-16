import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, ButtonLink } from '@tahti-player/ui';

import { fetchFollowList } from '../api/follows';
import type { FollowListUser } from '../api/types';
import { FollowListRows } from '../components/FollowListDialog';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from '../components/PageStates';
import { useSnapshotFetch } from '../lib/useSnapshotFetch';
import { useAuthStore } from '../stores/authStore';

type FollowingPage = { users: FollowListUser[]; hasMore: boolean };

export function LibraryFollowingView() {
  const { t } = useTranslation('web');
  const username = useAuthStore((state) => state.user?.username ?? null);
  const { data, loading, error, retry, mutate } =
    useSnapshotFetch<FollowingPage>(
      `library-following:${username ?? ''}`,
      async () => {
        if (!username) {
          return { users: [], hasMore: false };
        }
        const page = await fetchFollowList(username, 'following', 0);
        if (!page) {
          throw new Error(t('library.following.loadError'));
        }
        return { users: page.users, hasMore: page.hasMore };
      },
    );
  const [moreLoading, setMoreLoading] = useState(false);
  const [moreFailed, setMoreFailed] = useState(false);
  const users = data?.users ?? [];

  const loadMore = async () => {
    if (!username) {
      return;
    }
    setMoreLoading(true);
    setMoreFailed(false);
    const page = await fetchFollowList(username, 'following', users.length);
    setMoreLoading(false);
    if (!page) {
      setMoreFailed(true);
      return;
    }
    mutate((current) => ({
      users: [...(current?.users ?? []), ...page.users],
      hasMore: page.hasMore,
    }));
  };

  if (!username) {
    return <PageEmpty title={t('library.following.signIn')} />;
  }

  const busy = loading || moreLoading;
  const failed = (error !== null && data === null) || moreFailed;

  return (
    <div
      className="flex max-w-2xl flex-col gap-2"
      data-testid="library-following"
    >
      {error && data ? (
        <PageErrorBanner
          title={t('pageStates.refreshFailed')}
          description={error}
          onRetry={retry}
        />
      ) : null}
      <FollowListRows users={users} />
      {busy ? <PageLoading /> : null}
      {!busy && failed ? (
        <PageError
          title={t('library.following.loadError')}
          onRetry={moreFailed ? () => void loadMore() : retry}
        />
      ) : null}
      {!busy && !failed && data && users.length === 0 ? (
        <PageEmpty
          title={t('library.following.emptyTitle')}
          description={t('library.following.emptyDescription')}
          action={
            <ButtonLink to="/discover" size="sm">
              {t('nav.discover')}
            </ButtonLink>
          }
        />
      ) : null}
      {!busy && !failed && data?.hasMore ? (
        <div className="flex justify-center pt-1">
          <Button variant="secondary" size="sm" onClick={() => void loadMore()}>
            {t('library.following.showMore')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
