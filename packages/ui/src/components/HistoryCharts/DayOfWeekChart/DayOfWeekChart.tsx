import { FC } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

import { DayOfWeekTooltip } from './DayOfWeekTooltip';
import type { DayOfWeekChartProps } from './types';

const barTopRadius: [number, number, number, number] = [4, 4, 0, 0];
const noRadius: [number, number, number, number] = [0, 0, 0, 0];

export const DayOfWeekChart: FC<DayOfWeekChartProps> = ({
  values,
  labels,
  formatValue,
  onBarClick,
  stackValues,
  className,
  ...props
}) => {
  const stacked = Boolean(stackValues);
  const data = labels.weekdays.map((weekday, index) => ({
    weekday,
    base: values[index] ?? 0,
    stack: stackValues?.[index] ?? 0,
    value: (values[index] ?? 0) + (stackValues?.[index] ?? 0),
    index,
  }));
  const handleClick = (_: unknown, index: number) => {
    if (typeof index === 'number') {
      onBarClick?.(index);
    }
  };

  const tickInterval = data.length > 14 ? 'equidistantPreserveStart' : 0;

  return (
    <ResponsiveContainer
      data-testid="day-of-week-chart"
      width="100%"
      height="100%"
      className={className}
      {...props}
    >
      <BarChart data={data}>
        <XAxis
          dataKey="weekday"
          tickLine={false}
          axisLine={false}
          interval={tickInterval}
          minTickGap={12}
          padding={data.length > 14 ? { left: 12, right: 12 } : undefined}
          tick={{ className: 'fill-foreground-secondary text-xs' }}
        />
        <Tooltip
          cursor={false}
          content={<DayOfWeekTooltip formatValue={formatValue} />}
        />
        <Bar
          dataKey={stacked ? 'base' : 'value'}
          stackId="day"
          radius={stacked ? noRadius : barTopRadius}
          fill="var(--color-primary)"
          stroke="var(--color-border)"
          className="stroke-(length:--border-width)"
          cursor={onBarClick ? 'pointer' : undefined}
          onClick={handleClick}
        />
        {stacked ? (
          <Bar
            dataKey="stack"
            stackId="day"
            radius={barTopRadius}
            fill="var(--color-accent-yellow)"
            stroke="var(--color-border)"
            className="stroke-(length:--border-width)"
            cursor={onBarClick ? 'pointer' : undefined}
            onClick={handleClick}
          />
        ) : null}
      </BarChart>
    </ResponsiveContainer>
  );
};
