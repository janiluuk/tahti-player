import { ComponentProps, FC, ReactNode } from 'react';

import { cn } from '../../utils';

export type DonutChartSegment = {
  id: string;
  /** Raw value — segments are sized proportionally to the sum of all values. */
  value: number;
  /** CSS color (hex, oklch, var(--...), etc). */
  color: string;
};

type DonutChartProps = Omit<ComponentProps<'div'>, 'children'> & {
  segments: readonly DonutChartSegment[];
  /** Outer diameter in px. @default 176 */
  size?: number;
  /** Ring thickness in px (also the center hole's inset). @default 28 */
  thickness?: number;
  centerLabel?: ReactNode;
  centerValue?: ReactNode;
  'aria-label'?: string;
};

export const DonutChart: FC<DonutChartProps> = ({
  segments,
  size = 176,
  thickness = 28,
  centerLabel,
  centerValue,
  className,
  style,
  ...props
}) => {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  let accumulated = 0;
  const stops = segments.map((segment) => {
    const start = accumulated;
    accumulated += total > 0 ? (segment.value / total) * 100 : 0;
    return `${segment.color} ${start}% ${accumulated}%`;
  });

  return (
    <div
      role="img"
      className={cn('relative shrink-0 rounded-full', className)}
      style={{
        width: size,
        height: size,
        background:
          total > 0 ? `conic-gradient(${stops.join(', ')})` : undefined,
        ...style,
      }}
      {...props}
    >
      {(centerLabel || centerValue) && (
        <div
          className="bg-background absolute flex flex-col items-center justify-center rounded-full text-center"
          style={{ inset: thickness }}
        >
          {centerLabel && (
            <span className="text-foreground-secondary text-[10px] uppercase">
              {centerLabel}
            </span>
          )}
          {centerValue && (
            <span className="text-lg font-bold">{centerValue}</span>
          )}
        </div>
      )}
    </div>
  );
};
