import { useEffect, useState } from 'react';

// Assumptions behind this hook are documented in
// docs/todo/mobile-player-hide-nav-swipe-reveal.md.

const BOTTOM_EDGE_ZONE_PX = 40;
const SWIPE_REVEAL_DISTANCE_PX = 24;

export function useAutoHideNavWhilePlaying(
  isMobile: boolean,
  isPlaying: boolean,
): boolean {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!isPlaying) {
      setRevealed(false);
    }
  }, [isPlaying]);

  const navHidden = isMobile && isPlaying && !revealed;

  useEffect(() => {
    if (!navHidden || typeof window === 'undefined') {
      return;
    }

    let startY: number | null = null;

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) {
        startY = null;
        return;
      }
      const nearBottomEdge =
        touch.clientY >= window.innerHeight - BOTTOM_EDGE_ZONE_PX;
      startY = nearBottomEdge ? touch.clientY : null;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (startY === null) {
        return;
      }
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      if (startY - touch.clientY >= SWIPE_REVEAL_DISTANCE_PX) {
        setRevealed(true);
        startY = null;
      }
    };

    const onTouchEnd = () => {
      startY = null;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [navHidden]);

  return navHidden;
}
