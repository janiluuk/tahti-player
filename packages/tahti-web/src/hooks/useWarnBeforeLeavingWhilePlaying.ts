import { useEffect } from 'react';

import { usePlayerStore } from '../stores/playerStore';

/** Asks the browser to confirm a refresh or tab close while audio is
 * playing. The listener is only attached while playing, because a permanent
 * `beforeunload` handler keeps the page out of the back/forward cache. The
 * browser shows its own wording; it cannot be customized. */
export function useWarnBeforeLeavingWhilePlaying() {
  const playing = usePlayerStore((s) => s.status === 'playing');

  useEffect(() => {
    if (!playing) {
      return undefined;
    }
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Chrome and Safari only prompt when returnValue is set.
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [playing]);
}
