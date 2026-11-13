import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';

import { fetchChannel } from '../api/client';
import { usePlayerStore } from '../stores/playerStore';

/** Play / pause the artist's channel stream in the global Tahti player
 * (bottom bar / full-screen), without leaving the current Studio page. */
export function usePlayChannelInPlayer(slug: string | null | undefined) {
  const { t } = useTranslation('web');
  const currentId = usePlayerStore((s) => s.currentId);
  const status = usePlayerStore((s) => s.status);
  const play = usePlayerStore((s) => s.play);
  const setStatus = usePlayerStore((s) => s.setStatus);

  const channelIsCurrent = Boolean(
    slug && (currentId === `live:${slug}` || currentId === `radio:${slug}`),
  );
  const isPlaying =
    channelIsCurrent && (status === 'playing' || status === 'loading');

  const toggle = () => {
    if (!slug) {
      return;
    }
    if (channelIsCurrent) {
      setStatus(isPlaying ? 'paused' : 'playing');
      return;
    }
    void fetchChannel(slug)
      .then(({ playable }) => {
        if (playable) {
          play(playable);
          return;
        }
        toast.error(t('toasts.couldNotStartStream'));
      })
      .catch(() => toast.error(t('toasts.couldNotStartStream')));
  };

  return { isPlaying, toggle };
}
