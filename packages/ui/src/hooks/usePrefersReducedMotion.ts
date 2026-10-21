import { useSyncExternalStore } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function reducedMotionQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return null;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY);
}

function subscribe(onChange: () => void): () => void {
  const mql = reducedMotionQuery();
  if (!mql) {
    return () => undefined;
  }
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

const prefersReducedMotion = () => reducedMotionQuery()?.matches ?? false;

/** Live `prefers-reduced-motion: reduce`. Reads matchMedia directly rather
 * than motion's `useReducedMotion`, which the ui test setup pins to true. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
