import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { streamFailureDescription } from '../lib/streamFailure';
import { usePlayerStore } from '../stores/playerStore';

/** Says so when playback fails, once per failure: a stream that won't load
 * otherwise only flips the play button back. Offers Try again to reload the
 * current queue item without touching the rest of the queue. */
export function usePlaybackErrorToast(title: string | undefined) {
  const status = usePlayerStore((s) => s.status);
  const isLive = usePlayerStore((s) => s.isLive);
  const failure = usePlayerStore((s) => s.failure);
  const currentId = usePlayerStore((s) => s.currentId);
  const reloadNonce = usePlayerStore((s) => s.reloadNonce);
  const announced = useRef<string | null>(null);

  useEffect(() => {
    if (status !== 'error') {
      if (status === 'playing') {
        announced.current = null;
      }
      return;
    }
    const key = `${currentId ?? ''}:${reloadNonce}:${failure?.reason ?? ''}:${failure?.status ?? ''}`;
    if (announced.current === key) {
      return;
    }
    announced.current = key;
    const name = title ? `“${title}”` : 'this';
    toast.error(
      isLive
        ? `${title ? `${title} is` : 'This station is'} unavailable. ${
            failure
              ? streamFailureDescription(failure)
              : 'The stream may be off air — try again in a moment.'
          }`
        : `Can’t play ${name} right now. Try again, or pick another track.`,
      {
        id: 'playback-error',
        action: {
          label: 'Try again',
          onClick: () => usePlayerStore.getState().retry(),
        },
      },
    );
  }, [status, isLive, currentId, reloadNonce, title, failure]);
}
