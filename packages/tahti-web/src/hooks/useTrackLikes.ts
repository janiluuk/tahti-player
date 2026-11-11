import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';

import type { TahtiPlayable } from '../api/types';
import { trackLikeTarget } from '../lib/trackLikeTarget';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { useSoundLikesStore } from '../stores/soundLikesStore';

/** Account likes for track rows, menus and pages: the one way to save a
 * track. Like controls only show for a signed-in listener. */
export function useTrackLikes() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const liked = useSoundLikesStore((s) => s.liked);
  const load = useSoundLikesStore((s) => s.load);
  const setLike = useSoundLikesStore((s) => s.setLike);

  useEffect(() => {
    if (userId) {
      void load(userId);
    }
  }, [userId, load]);

  const canLike = useCallback(
    (playable: Pick<TahtiPlayable, 'id' | 'kind' | 'channelSlug'>) =>
      Boolean(userId && trackLikeTarget(playable)),
    [userId],
  );

  const isLiked = useCallback(
    (playable: Pick<TahtiPlayable, 'id' | 'kind' | 'channelSlug'>) => {
      const target = trackLikeTarget(playable);
      return Boolean(target && liked.has(target.soundId));
    },
    [liked],
  );

  const toggleLike = useCallback(
    (playable: Pick<TahtiPlayable, 'id' | 'kind' | 'channelSlug'>) => {
      const target = trackLikeTarget(playable);
      if (!target) {
        return;
      }
      if (!userId) {
        useAuthModalStore.getState().open('login');
        return;
      }
      void setLike(
        target.soundId,
        !liked.has(target.soundId),
        target.channelSlug,
      ).then((error) => {
        if (error) {
          toast.error(error);
        }
      });
    },
    [liked, setLike, userId],
  );

  return { signedIn: Boolean(userId), canLike, isLiked, toggleLike };
}
