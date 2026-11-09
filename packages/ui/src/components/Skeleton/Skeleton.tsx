import type { ComponentPropsWithoutRef, FC } from 'react';

import { cn } from '../../utils';

export type SkeletonProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children'
> & {
  /** `block` fills its box (size it with className); `line` is a text-height bar. */
  shape?: 'block' | 'line';
  /** For `line`: how many bars to stack. The last one is shorter, like the
   * end of a paragraph. */
  lines?: number;
};

const PULSE = 'bg-background-input animate-pulse motion-reduce:animate-none';

/** Placeholder shape shown while content loads. Hidden from assistive tech:
 * mark the loading region itself with `aria-busy` and a label. */
export const Skeleton: FC<SkeletonProps> = ({
  shape = 'block',
  lines = 1,
  className,
  ...rest
}) => {
  if (shape === 'line' && lines > 1) {
    return (
      <div
        aria-hidden
        data-testid="skeleton"
        data-shape="line"
        className={cn('flex flex-col gap-2', className)}
        {...rest}
      >
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={cn(
              PULSE,
              'h-3 rounded-full',
              index === lines - 1 ? 'w-3/5' : 'w-full',
            )}
          />
        ))}
      </div>
    );
  }
  return (
    <div
      aria-hidden
      data-testid="skeleton"
      data-shape={shape}
      className={cn(
        PULSE,
        shape === 'line' ? 'h-3 w-full rounded-full' : 'rounded-card',
        className,
      )}
      {...rest}
    />
  );
};
