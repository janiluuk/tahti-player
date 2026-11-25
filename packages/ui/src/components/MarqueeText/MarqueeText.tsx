import { CSSProperties, FC, useLayoutEffect, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { cn } from '../../utils';

const GAP_PX = 40;
const SPEED_PX_PER_S = 32;
const MIN_DURATION_S = 6;

export type MarqueeTextProps = {
  children: string;
  /** Classes for the clipping box (font, colour, width). */
  className?: string;
  'data-testid'?: string;
};

/**
 * One line of text that scrolls sideways when it does not fit, and shows the
 * plain truncated line when it fits or the viewer prefers reduced motion.
 * The loop is a CSS transform on two copies (the second hidden from
 * assistive tech), paused on hover and while a focused ancestor or
 * descendant holds keyboard focus.
 */
export const MarqueeText: FC<MarqueeTextProps> = ({
  children,
  className,
  'data-testid': testId,
}) => {
  const boxRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflowWidth, setOverflowWidth] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const scrolling = overflowWidth > 0 && !reducedMotion;

  useLayoutEffect(() => {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) {
      return;
    }
    const measure = () => {
      const natural = text.scrollWidth;
      setOverflowWidth(natural > box.clientWidth + 1 ? natural : 0);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(text);
    return () => observer.disconnect();
  }, [children, scrolling]);

  const style = scrolling
    ? ({
        '--tahti-marquee-duration': `${Math.max(
          MIN_DURATION_S,
          (overflowWidth + GAP_PX) / SPEED_PX_PER_S,
        ).toFixed(2)}s`,
      } as CSSProperties)
    : undefined;

  return (
    <span
      ref={boxRef}
      className={cn(
        'tahti-marquee block min-w-0 overflow-hidden whitespace-nowrap',
        className,
      )}
      data-marquee={
        overflowWidth > 0 ? (scrolling ? 'scrolling' : 'static') : 'fits'
      }
      data-testid={testId}
    >
      {scrolling ? (
        <span className="tahti-marquee-track inline-flex w-max" style={style}>
          <span className="shrink-0" style={{ paddingRight: GAP_PX }}>
            <span ref={textRef} className="inline-block">
              {children}
            </span>
          </span>
          <span
            className="shrink-0"
            style={{ paddingRight: GAP_PX }}
            aria-hidden
          >
            {children}
          </span>
        </span>
      ) : (
        <span ref={textRef} className="block truncate">
          {children}
        </span>
      )}
    </span>
  );
};
