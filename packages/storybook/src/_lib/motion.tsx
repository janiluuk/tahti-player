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
