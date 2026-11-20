import { useTranslation } from '@tahti-player/i18n';

import type { FollowListDirection } from '../../api/follows';
import { FollowListDialog } from '../../components/FollowListDialog';
import { useFollowList } from '../../lib/useFollowList';

export function ArtistFollowListDialog({
  username,
  artistName,
  direction,
  onClose,
}: {
  username: string;
  artistName: string;
  direction: FollowListDirection | null;
  onClose: () => void;
}) {
  const { t } = useTranslation('web');
  const list = useFollowList(username, direction);
  return (
    <FollowListDialog
      isOpen={direction !== null}
      title={
        direction === 'following'
          ? t('artistProfilePageBatch30.following')
          : t('artistProfilePageBatch30.followers')
      }
      emptyMessage={
        direction === 'following'
          ? t('artistProfilePageBatch30.followsNoOne', { name: artistName })
          : t('artistProfilePageBatch30.noFollowers', { name: artistName })
      }
      users={list.users}
      loading={list.loading}
      error={list.error}
      hasMore={list.hasMore}
      onLoadMore={list.loadMore}
      onClose={onClose}
    />
  );
}
