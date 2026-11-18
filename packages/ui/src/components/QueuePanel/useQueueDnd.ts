import { useEffect, useState } from 'react';

export type QueueDndModule = typeof import('./queueDnd');

let loaded: QueueDndModule | null = null;
let pending: Promise<QueueDndModule> | null = null;

/** Loads the queue's drag-reorder layer (dnd-kit) in its own chunk, so the
 * always-mounted queue panel does not put dnd-kit in the app shell. */
export function preloadQueueDnd(): Promise<QueueDndModule> {
  pending ??= import('./queueDnd').then((module) => {
    loaded = module;
    return module;
  });
  return pending;
}

type IdleWindow = {
  requestIdleCallback?: (callback: () => void) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/** The drag layer once loaded, else null. Loading starts when the browser
 * is idle; until then rows render without drag handles. */
export function useQueueDnd(enabled: boolean): QueueDndModule | null {
  const [module, setModule] = useState<QueueDndModule | null>(loaded);

  useEffect(() => {
    if (!enabled || module) {
      return;
    }
    if (loaded) {
      setModule(loaded);
      return;
    }
    let cancelled = false;
    const start = () => {
      void preloadQueueDnd().then((next) => {
        if (!cancelled) {
          setModule(next);
        }
      });
    };
    const idle = globalThis as IdleWindow;
    if (idle.requestIdleCallback) {
      const handle = idle.requestIdleCallback(start);
      return () => {
        cancelled = true;
        idle.cancelIdleCallback?.(handle);
      };
    }
    const timer = setTimeout(start, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, module]);

  return enabled ? module : null;
}
