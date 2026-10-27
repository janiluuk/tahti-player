import type { ComponentProps } from 'react';

/** Prefer `number[]`; kept as a 7-tuple alias for history day-of-week callers. */
export type DayOfWeekValues = [
  monday: number,
  tuesday: number,
  wednesday: number,
  thursday: number,
  friday: number,
  saturday: number,
  sunday: number,
];

export type DayOfWeekChartLabels = {
  weekdays: string[];
};

export type DayOfWeekChartProps = Omit<ComponentProps<'div'>, 'children'> & {
  values: number[];
  labels: DayOfWeekChartLabels;
  formatValue: (value: number) => string;
  onBarClick?: (index: number) => void;
  /** A second series drawn on top of `values`; the tooltip shows the sum. */
  stackValues?: number[];
};
