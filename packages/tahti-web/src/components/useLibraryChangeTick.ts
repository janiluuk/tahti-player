import { useEffect, useState } from 'react';

import type { TahtiNativeLibrary } from '../lib/nativeLibrary';

function msUntilMidnight(now: Date): number {
  const next = new Date(now);
  next.setHours(24, 0, 5, 0);
  return next.getTime() - now.getTime();
}

/**
 * A number that goes up whenever the desktop library changes, and at local
 * midnight (when "within the last N days" rules move without any change).
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
    let timer = 0;
    const arm = () => {
      timer = window.setTimeout(() => {
        setTick((value) => value + 1);
        arm();
      }, msUntilMidnight(new Date()));
    };
    arm();
    return () => window.clearTimeout(timer);
  }, []);

  return tick;
}
