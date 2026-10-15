import { useEffect, useState } from 'react';

import type { TahtiNativeLibrary } from '../lib/nativeLibrary';

const AGE_CHECK_MS = 60_000;

/**
 * A number that goes up whenever the desktop library changes, every minute,
 * and when the window is shown again. "Within the last N days" rules move
 * with the clock, so a track can leave a list with no change to the library;
 * the desktop's smart playlist cache answers unchanged results cheaply.
 * Put it in an effect's dependencies to re-run a query.
 */
export function useLibraryChangeTick(library: TahtiNativeLibrary): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!library.onLibraryChanged) {
      return;
    }
    return library.onLibraryChanged(() => setTick((value) => value + 1));
  }, [library]);

  useEffect(() => {
    const bump = () => setTick((value) => value + 1);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        bump();
      }
    };
    const timer = window.setInterval(bump, AGE_CHECK_MS);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return tick;
}
