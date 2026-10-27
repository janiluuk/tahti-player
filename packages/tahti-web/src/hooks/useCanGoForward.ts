import { useRouterState } from '@tanstack/react-router';
import { useRef } from 'react';

/** TanStack Router has no built-in "can go forward" the way it has
 * useCanGoBack — ported from the Nuclear desktop player's own top bar, which
 * tracks the highest history index seen so far against the current one. */
export function useCanGoForward(): boolean {
  const maxIndexRef = useRef(0);

  return useRouterState({
    select: (state) => {
      const currentIndex = state.location.state.__TSR_index;

      if (currentIndex >= maxIndexRef.current) {
        maxIndexRef.current = currentIndex;
      }

      return currentIndex < maxIndexRef.current;
    },
  });
}
