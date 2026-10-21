import { useReducedMotion } from 'motion/react';

export const SKIP_ENTER_MOTION_ATTRIBUTE = 'data-skip-enter-motion';

const skipEnterRequested = () =>
  typeof document !== 'undefined' &&
  (document.documentElement.hasAttribute(SKIP_ENTER_MOTION_ATTRIBUTE) ||
    document.getElementById('storybook-root') !== null);

/** Enter fades start at opacity 0 for a frame or more. Skip them for
 * reduced-motion users, and in Storybook, whose plays assert toBeVisible
 * on first paint: the play runner marks `<html>` with
 * `data-skip-enter-motion`, the Storybook UI has `#storybook-root`. */
export function useSkipEnterMotion(): boolean {
  const reducedMotion = useReducedMotion();
  return reducedMotion === true || skipEnterRequested();
}
