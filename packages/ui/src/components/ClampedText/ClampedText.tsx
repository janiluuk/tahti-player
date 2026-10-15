import { FC, ReactNode, useId, useLayoutEffect, useRef, useState } from 'react';

import { cn } from '../../utils';
import { Button } from '../Button';

const CLAMP_CLASSES = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
  5: 'line-clamp-5',
  6: 'line-clamp-6',
} as const;

export type ClampedTextProps = {
  children: ReactNode;
  /** Lines shown before "Show more". Defaults to 2. */
  lines?: keyof typeof CLAMP_CLASSES;
  /** Classes for the text paragraph, e.g. `whitespace-pre-wrap`. */
  className?: string;
  /** Classes for the element wrapping the text and the toggle. */
  wrapperClassName?: string;
  moreLabel?: string;
  lessLabel?: string;
  'data-testid'?: string;
};

export const ClampedText: FC<ClampedTextProps> = ({
  children,
  lines = 2,
  className,
  wrapperClassName,
  moreLabel = 'Show more',
  lessLabel = 'Show less',
  'data-testid': testId,
}) => {
  const id = useId();
  const textRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || expanded) {
      return;
    }
    const measure = () => setOverflowing(el.scrollHeight > el.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [expanded, children, lines]);

  return (
    <div className={wrapperClassName} data-testid={testId}>
      <p
        ref={textRef}
        id={id}
        className={cn(className, !expanded && CLAMP_CLASSES[lines])}
      >
        {children}
      </p>
      {overflowing || expanded ? (
        <Button
          variant="plain"
          size="flexible"
          className="mt-1 text-sm font-semibold text-current underline underline-offset-2"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? lessLabel : moreLabel}
        </Button>
      ) : null}
    </div>
  );
};
