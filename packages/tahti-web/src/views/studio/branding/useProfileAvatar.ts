import type { Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';

import { i18n } from '@tahti-player/i18n';

import { removeProfileAvatar } from '../../../api/artist-settings';
import type { ProfileFields } from '../../../api/studio-extras';
import { useAuthStore } from '../../../stores/authStore';

/** Applies a stored profile picture to local profile state, or clears it
 * on the server when `url` is empty, and refreshes the signed-in user so
 * chrome avatars follow. */
export function useProfileAvatar(
  setProfile: Dispatch<SetStateAction<ProfileFields | null>>,
) {
  const refreshAuth = useAuthStore((state) => state.refresh);

  const removeAvatar = async () => {
    const result = await removeProfileAvatar();
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    setProfile((current) =>
      current ? { ...current, avatarUrl: null } : current,
    );
    await refreshAuth();
    toast.success(i18n.t('web:toasts.profilePictureRemoved'));
    return true;
  };

  const handleAvatarChange = (url: string) => {
    if (!url) {
      void removeAvatar();
      return;
    }
    setProfile((current) =>
      current ? { ...current, avatarUrl: url } : current,
    );
    void refreshAuth();
  };

  return { handleAvatarChange, removeAvatar };
}
