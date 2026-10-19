import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { usePlayerStore } from '../stores/playerStore';

/** Says so when playback fails, once per failure: a stream that won't load
 * otherwise only flips the play button back. */
export function usePlaybackErrorToast(title: string | undefined) {
  const status = usePlayerStore((s) => s.status);
  const isLive = usePlayerStore((s) => s.isLive);
  const currentId = usePlayerStore((s) => s.currentId);
  const announced = useRef<string | null>(null);

  useEffect(() => {
    if (status !== 'error') {
      if (status === 'playing') {
        announced.current = null;
      }
      return;
    }
    const key = currentId ?? '';
    if (announced.current === key) {
      return;
    }
    announced.current = key;
    const name = title ? `“${title}”` : 'this';
    toast.error(
      isLive
        ? `Can’t reach ${name} right now. The stream may be off air — try again in a moment.`
        : `Can’t play ${name} right now. Try again, or pick another track.`,
      { id: 'playback-error' },
    );
  }, [status, isLive, currentId, title]);
}
