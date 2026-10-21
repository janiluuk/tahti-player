import { FC, ReactNode, useEffect, useRef, useState } from 'react';

import { cn } from '../../utils';

type HorizontalScrollProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export const HorizontalScroll: FC<HorizontalScrollProps> = ({
  label,
  children,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const measure = () =>
      setOverflowing(element.scrollWidth > element.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    for (const child of Array.from(element.children)) {
      observer.observe(child);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        'focus-visible:ring-primary overflow-x-auto rounded-sm outline-none focus-visible:ring-2',
        className,
      )}
      {...(overflowing
        ? { role: 'region', 'aria-label': label, tabIndex: 0 }
        : {})}
    >
      {children}
    </div>
  );
};
