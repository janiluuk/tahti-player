import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { cn } from '@tahti-player/ui';

type PingPongStyle = CSSProperties & {
  '--tahti-ping-pong-distance'?: string;
  '--tahti-ping-pong-duration'?: string;
};

export function OverflowPingPongText({
  as: Root = 'p',
  children,
  className,
  testId,
}: {
  as?: 'h1' | 'p';
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  const viewportRef = useRef<HTMLHeadingElement & HTMLParagraphElement>(null);
  const trackRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) {
      return;
    }
    const measure = () => {
      setOverflow(
        Math.max(0, Math.ceil(track.scrollWidth - viewport.clientWidth)),
      );
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(track);
    return () => observer.disconnect();
  }, [children]);

  const style: PingPongStyle | undefined = overflow
    ? {
        '--tahti-ping-pong-distance': `-${overflow}px`,
        '--tahti-ping-pong-duration': `${Math.min(22, 8 + overflow / 18)}s`,
      }
    : undefined;

  return (
    <Root
      ref={viewportRef}
      className={cn('tahti-ping-pong overflow-hidden', className)}
      data-overflow={overflow ? 'true' : undefined}
      data-testid={testId}
    >
      <span
        ref={trackRef}
        className="tahti-ping-pong-track block w-max min-w-full"
        style={style}
      >
        {children}
      </span>
    </Root>
  );
}
