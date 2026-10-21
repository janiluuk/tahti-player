import { ComponentProps, FC } from 'react';

import { cn } from '../../utils';

type MeterProps = Omit<ComponentProps<'div'>, 'children'> & {
  /** Current value, in the same unit as `max`. */
  value: number;
  /** @default 100 */
  max?: number;
  trackClassName?: string;
  barClassName?: string;
};

export const Meter: FC<MeterProps> = ({
  value,
  max = 100,
  className,
  trackClassName,
  barClassName,
  ...props
}) => {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn(
        'bg-background-secondary h-1.5 overflow-hidden rounded-full',
        trackClassName,
        className,
      )}
      {...props}
    >
      <div
        className={cn('bg-primary h-full rounded-full', barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};
