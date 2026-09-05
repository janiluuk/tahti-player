import { ComponentProps } from 'react';

export type HistoryDayGroupClasses = {
  root?: string;
  marker?: string;
};

export type HistoryDayGroupProps = ComponentProps<'section'> & {
  marker: string;
};