import { useCallback } from 'react';

import { useTranslation } from '@tahti-player/i18n';

import { fetchProfile } from '../../../api/client';
import { reorderPublicTracks } from '../../../api/profile-order';
import { ProfileOrderDialog } from '../../../components/ProfileOrderDialog';
import { useAuthStore } from '../../../stores/authStore';

export function TrackOrderDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation('web');
  const username = useAuthStore((s) => s.user?.username);

  const load = useCallback(async () => {
    if (!username) {
      return { items: [], error: null };
    }
    const { data, meta } = await fetchProfile(username);
    return {
      items: data.tracks.map((track) => ({ id: track.id, title: track.title })),
      error: meta.source === 'api' ? (meta.reason ?? null) : null,
    };
  }, [username]);

  if (!username) {
    return null;
  }

  return (
    <ProfileOrderDialog
      isOpen={isOpen}
      title={t('library.trackOrderTitle')}
      description={t('library.trackOrderDescription')}
      empty={t('library.trackOrderEmpty')}
      load={load}
      save={reorderPublicTracks}
      onClose={onClose}
    />
  );
}
