import { useEffect, useRef } from 'react';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
}

/** ← and → step to the previous / next item while `enabled`, unless focus
 * is in a text field or a modifier key is held. */
export function useArrowKeyPager({
  enabled,
  onPrevious,
  onNext,
}: {
  enabled: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  const handlers = useRef({ onPrevious, onNext });
  handlers.current = { onPrevious, onNext };

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        isTypingTarget(event.target)
      ) {
        return;
      }
      const handler =
        event.key === 'ArrowLeft'
          ? handlers.current.onPrevious
          : event.key === 'ArrowRight'
            ? handlers.current.onNext
            : undefined;
      if (handler) {
        event.preventDefault();
        handler();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [enabled]);
}
