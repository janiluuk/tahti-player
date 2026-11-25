import type { Decorator } from '@storybook/react-vite';
import { useEffect, type ReactNode } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

let realMatchMedia: typeof window.matchMedia | null = null;

function allowMotion() {
  if (realMatchMedia) {
    return;
  }
  const real = window.matchMedia.bind(window);
  realMatchMedia = real;
  window.matchMedia = (query: string) =>
    real(query === REDUCED_MOTION_QUERY ? 'not all' : query);
}

function restoreMotion() {
  if (realMatchMedia) {
    window.matchMedia = realMatchMedia;
    realMatchMedia = null;
  }
}

function MotionAllowed({ children }: { children: ReactNode }) {
  useEffect(() => {
    allowMotion();
    return restoreMotion;
  }, []);
  return children;
}

export const withMotionAllowed: Decorator = (Story) => {
  allowMotion();
  return (
    <MotionAllowed>
      <Story />
    </MotionAllowed>
  );
};

/**
 * Story `beforeEach` that makes `usePrefersReducedMotion` report `reduce`.
 * The Vitest play runner launches Chromium with reduced motion on, so a
 * story that shows motion has to opt out with `reduce: false`. Composes with
 * other `matchMedia` stubs (e.g. `stubPhoneViewport`).
 */
export function stubReducedMotion(reduce: boolean): () => () => void {
  return () => {
    const real = window.matchMedia;
    window.matchMedia = (query: string) =>
      query === REDUCED_MOTION_QUERY
        ? ({
            matches: reduce,
            media: query,
            onchange: null,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
            addListener: () => undefined,
            removeListener: () => undefined,
            dispatchEvent: () => false,
          } as MediaQueryList)
        : real.call(window, query);
    return () => {
      window.matchMedia = real;
    };
  };
}
