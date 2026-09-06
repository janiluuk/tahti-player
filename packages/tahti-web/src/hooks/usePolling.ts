import { useEffect, useRef } from 'react';

/**
 * Runs `callback` every `ms` milliseconds, pausing automatically when the
 * browser tab is hidden (via `document.visibilitychange`). Cleans up on
 * unmount. The callback is **not** called while the document is hidden —
 * the interval resumes when the tab becomes visible again.
 */
export function usePolling(callback: () => void, ms: number, enabled = true) {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    if (!enabled || ms <= 0) {
      return;
    }

    let timer: number | null = null;

    const start = () => {
      stop();
      timer = window.setInterval(() => {
        if (document.visibilityState === 'visible') {
          savedCallback.current();
        }
      }, ms);
    };

    const stop = () => {
      if (timer != null) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        start();
      } else {
        stop();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    start();

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ms, enabled]);
}
