import { useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';

const GIVE_UP_AFTER_MS = 3000;

/** Scrolls the element named in the address hash into view once it has
 * rendered, so a link to a section of a page that loads its data still
 * lands on that section. */
export function useScrollToHash() {
  const hash = useLocation({ select: (location) => location.hash });

  useEffect(() => {
    if (!hash) {
      return;
    }
    const startedAt = Date.now();
    let frame = 0;
    const tryScroll = () => {
      const target = document.getElementById(hash);
      if (target) {
        target.scrollIntoView?.({ block: 'start' });
        return;
      }
      if (Date.now() - startedAt < GIVE_UP_AFTER_MS) {
        frame = requestAnimationFrame(tryScroll);
      }
    };
    frame = requestAnimationFrame(tryScroll);
    return () => cancelAnimationFrame(frame);
  }, [hash]);
}
