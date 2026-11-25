import { useMediaQuery } from '../utils/mediaQuery';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** Live `prefers-reduced-motion: reduce`. Reads matchMedia directly rather
 * than motion's `useReducedMotion`, which the ui test setup pins to true. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery(REDUCED_MOTION_QUERY);
}
