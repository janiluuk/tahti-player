import { useNavigate } from '@tanstack/react-router';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type TouchEvent,
} from 'react';

import { fetchPublicEvent } from '../../api/event-calendar';
import { fetchUpcomingEvents } from '../../api/upcoming-events';
import { peekSnapshot, saveSnapshot } from '../../lib/useSnapshotFetch';
import {
  resolveEventNeighbours,
  toEventBrowseItems,
  useEventBrowseStore,
  type EventBrowseDirection,
  type EventNeighbours,
} from '../../stores/eventBrowseStore';

export const FALLBACK_BROWSE_LIMIT = 24;
const SWIPE_MIN_PX = 60;

// The route transition keeps the previous event page mounted while it fades
// out, so only the most recently mounted page may act on keys and swipes.
let activeBrowser: object | null = null;

const ARROW_KEY_OWNERS =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="dialog"], [role="slider"], [role="tablist"], [role="radiogroup"], [role="listbox"], [role="menu"], [role="grid"], [aria-roledescription="carousel"]';

const SWIPE_OWNERS =
  'input, textarea, select, [role="dialog"], [role="slider"], [aria-roledescription="carousel"]';

function scrollsSideways(element: Element): boolean {
  const overflowX = getComputedStyle(element).overflowX;
  return (
    (overflowX === 'auto' || overflowX === 'scroll') &&
    element.scrollWidth > element.clientWidth
  );
}

/** True when a touch on `target` belongs to something that already uses a
 * sideways drag (a text field, slider, carousel or a horizontal scroller). */
export function swipeOwnedByChild(
  target: EventTarget | null,
  boundary: Element,
): boolean {
  if (!(target instanceof Element)) {
    return false;
  }
  if (target.closest(SWIPE_OWNERS)) {
    return true;
  }
  for (
    let node: Element | null = target;
    node && node !== boundary;
    node = node.parentElement
  ) {
    if (scrollsSideways(node)) {
      return true;
    }
  }
  return false;
}

/** True when the arrow key press should stay with the focused element. */
export function arrowKeyOwnedByTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(ARROW_KEY_OWNERS));
}

function prefetchEvent(eventId: string) {
  const key = `event:${eventId}`;
  if (peekSnapshot(key) !== null) {
    return;
  }
  void fetchPublicEvent(eventId).then((result) => {
    if (result.data && !(result.meta.source === 'api' && result.meta.reason)) {
      saveSnapshot(key, result.data);
    }
  });
}

/** Previous / next for the event page: steps through the row the event was
 * opened from (or upcoming events when it was opened directly), by button,
 * the ← / → keys or a sideways swipe. */
export function useEventBrowse(eventId: string): {
  neighbours: EventNeighbours | null;
  go: (direction: EventBrowseDirection) => void;
  swipeHandlers: {
    onTouchStart: (event: TouchEvent<HTMLElement>) => void;
    onTouchEnd: (event: TouchEvent<HTMLElement>) => void;
  };
} {
  const navigate = useNavigate();
  const items = useEventBrowseStore((state) => state.items);
  const remember = useEventBrowseStore((state) => state.remember);
  const arrive = useEventBrowseStore((state) => state.arrive);
  const neighbours = resolveEventNeighbours(items, eventId);
  const inRow = neighbours !== null;
  const [self] = useState(() => ({}));

  useEffect(() => {
    activeBrowser = self;
    return () => {
      if (activeBrowser === self) {
        activeBrowser = null;
      }
    };
  }, [self]);

  useEffect(() => {
    if (inRow) {
      return;
    }
    let cancelled = false;
    void fetchUpcomingEvents(FALLBACK_BROWSE_LIMIT).then((result) => {
      if (cancelled) {
        return;
      }
      const upcoming = toEventBrowseItems(result.data);
      if (upcoming.some((item) => item.id === eventId)) {
        remember(upcoming);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [eventId, inRow, remember]);

  const previousId = neighbours?.previous?.id;
  const nextId = neighbours?.next?.id;
  useEffect(() => {
    if (previousId) {
      prefetchEvent(previousId);
    }
    if (nextId) {
      prefetchEvent(nextId);
    }
  }, [previousId, nextId]);

  const go = useCallback(
    (direction: EventBrowseDirection) => {
      const target = direction === 'next' ? nextId : previousId;
      if (!target || activeBrowser !== self) {
        return;
      }
      arrive(target, direction);
      void navigate({
        to: '/events/$eventId',
        params: { eventId: target },
        replace: true,
      });
    },
    [arrive, navigate, nextId, previousId, self],
  );

  useEffect(() => {
    if (!inRow) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') ||
        arrowKeyOwnedByTarget(event.target)
      ) {
        return;
      }
      event.preventDefault();
      go(event.key === 'ArrowRight' ? 'next' : 'previous');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [go, inRow]);

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swipeHandlers = {
    onTouchStart: (event: TouchEvent<HTMLElement>) => {
      const touch = event.touches[0];
      touchStart.current =
        event.touches.length === 1 &&
        touch &&
        !swipeOwnedByChild(event.target, event.currentTarget)
          ? { x: touch.clientX, y: touch.clientY }
          : null;
    },
    onTouchEnd: (event: TouchEvent<HTMLElement>) => {
      const start = touchStart.current;
      touchStart.current = null;
      const touch = event.changedTouches[0];
      if (!start || !touch) {
        return;
      }
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > 2 * Math.abs(dy)) {
        go(dx < 0 ? 'next' : 'previous');
      }
    },
  };

  return { neighbours, go, swipeHandlers };
}
