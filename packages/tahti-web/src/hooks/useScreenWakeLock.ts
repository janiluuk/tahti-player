import { useEffect } from 'react';

/** Holds a screen wake lock while `active`. The browser drops the lock
 * whenever the page is hidden, so it is requested again on return. */
export function useScreenWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) {
      return;
    }
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      navigator.wakeLock
        .request('screen')
        .then((lock) => {
          if (cancelled) {
            void lock.release();
          } else {
            sentinel = lock;
          }
        })
        .catch(() => {
          /* denied, e.g. battery saver */
        });
    };
    acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', acquire);
      void sentinel?.release();
    };
  }, [active]);
}
