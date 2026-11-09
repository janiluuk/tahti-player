import { RefObject, useEffect, useState } from 'react';

export type HorizontalScrollState = {
  overflowing: boolean;
  canScrollLeft: boolean;
  canScrollRight: boolean;
};

export function useHorizontalScrollState(
  ref: RefObject<HTMLElement | null>,
  remeasureKey?: unknown,
): HorizontalScrollState {
  const [state, setState] = useState<HorizontalScrollState>({
    overflowing: false,
    canScrollLeft: false,
    canScrollRight: false,
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const measure = () => {
      const maxScroll = element.scrollWidth - element.clientWidth;
      const next = {
        overflowing: maxScroll > 1,
        canScrollLeft: element.scrollLeft > 1,
        canScrollRight: element.scrollLeft < maxScroll - 1,
      };
      setState((current) =>
        current.overflowing === next.overflowing &&
        current.canScrollLeft === next.canScrollLeft &&
        current.canScrollRight === next.canScrollRight
          ? current
          : next,
      );
    };
    measure();
    element.addEventListener('scroll', measure, { passive: true });
    if (typeof ResizeObserver === 'undefined') {
      return () => element.removeEventListener('scroll', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    for (const child of Array.from(element.children)) {
      observer.observe(child);
    }
    return () => {
      element.removeEventListener('scroll', measure);
      observer.disconnect();
    };
  }, [ref, remeasureKey]);

  return state;
}
