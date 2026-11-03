import { useNavigate } from '@tanstack/react-router';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button, cn, Tooltip } from '@tahti-player/ui';

import { useHorizontalSwipe } from '../../hooks/useHorizontalSwipe';
import {
  radioRingNeighbors,
  type RadioRingCurrent,
  type RadioRingStop,
} from '../../lib/radioStationRing';

/** A radio page's stage that changes station like a dial: swipe left or
 * right, press the arrow keys while it has focus, or use the small
 * previous/next buttons in its corner. */
export function RadioStationDial({
  current,
  label,
  className,
  buttonsClassName,
  children,
}: {
  current: RadioRingCurrent;
  /** The station's name, for the stage's accessible label. */
  label: string;
  className?: string;
  buttonsClassName?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const neighbors = radioRingNeighbors(current);
  const go = (stop: RadioRingStop) => {
    if (stop.kind === 'channel') {
      void navigate({ to: '/channel/$slug', params: { slug: stop.slug } });
    } else {
      void navigate({
        to: '/radio/station/$stationId',
        params: { stationId: stop.id },
      });
    }
  };
  const swipe = useHorizontalSwipe({
    onPrev: () => neighbors && go(neighbors.prev),
    onNext: () => neighbors && go(neighbors.next),
  });

  if (!neighbors) {
    return <>{children}</>;
  }

  return (
    <div
      role="group"
      aria-label={`${label}: swipe or use the arrow keys to change station`}
      aria-keyshortcuts="ArrowLeft ArrowRight"
      tabIndex={0}
      className={cn(
        'focus-visible:ring-primary relative touch-pan-y rounded-xl outline-none focus-visible:ring-2',
        className,
      )}
      data-testid="radio-station-dial"
      {...swipe}
    >
      {children}
      <div
        className={cn(
          'absolute top-3 right-4 z-[3] flex items-center gap-1.5',
          buttonsClassName,
        )}
      >
        <Tooltip content={`Previous: ${neighbors.prev.name}`} side="bottom">
          <Button
            size="icon-sm"
            variant="secondary"
            onClick={() => go(neighbors.prev)}
            aria-label={`Previous station: ${neighbors.prev.name}`}
          >
            <ChevronLeftIcon size={16} aria-hidden />
          </Button>
        </Tooltip>
        <Tooltip content={`Next: ${neighbors.next.name}`} side="bottom">
          <Button
            size="icon-sm"
            variant="secondary"
            onClick={() => go(neighbors.next)}
            aria-label={`Next station: ${neighbors.next.name}`}
          >
            <ChevronRightIcon size={16} aria-hidden />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
