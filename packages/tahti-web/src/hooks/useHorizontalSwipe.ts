import {
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';

export const SWIPE_THRESHOLD_PX = 60;

type Options = {
  onPrev: () => void;
  onNext: () => void;
  threshold?: number;
};

export type HorizontalSwipeHandlers = {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: () => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
};

/** Left/right swipes and arrow keys on one element: swiping left (or
 * ArrowRight) means next, swiping right (or ArrowLeft) means previous.
 * Mouse drags are ignored so desktop text selection and seek bars keep
 * working; a move that is mostly vertical is a scroll, not a swipe. Arrow
 * keys count only while the element itself has focus, so a focused slider
 * or input inside it keeps its own arrow keys. Pair with `touch-pan-y` so
 * the browser leaves horizontal touch moves to these handlers. */
export function useHorizontalSwipe({
  onPrev,
  onNext,
  threshold = SWIPE_THRESHOLD_PX,
}: Options): HorizontalSwipeHandlers {
  const start = useRef<{ x: number; y: number; id: number } | null>(null);

  return {
    onPointerDown: (event) => {
      if (event.pointerType === 'mouse' || !event.isPrimary) {
        return;
      }
      start.current = {
        x: event.clientX,
        y: event.clientY,
        id: event.pointerId,
      };
    },
    onPointerUp: (event) => {
      const from = start.current;
      start.current = null;
      if (!from || from.id !== event.pointerId) {
        return;
      }
      const dx = event.clientX - from.x;
      const dy = event.clientY - from.y;
      if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy)) {
        return;
      }
      if (dx < 0) {
        onNext();
      } else {
        onPrev();
      }
    },
    onPointerCancel: () => {
      start.current = null;
    },
    onKeyDown: (event) => {
      if (event.target !== event.currentTarget) {
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onPrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        onNext();
      }
    },
  };
}
