import { memo } from 'react';

import { cn } from '../../utils';
import type { HistoryDayGroupProps } from './types';

export const HistoryDayGroup = memo<HistoryDayGroupProps>(({ marker, className }) => (
  <section
    data-testid="history-day-group"
    className={cn(
      'flex w-full flex-col items-start justify-start',
      className,
    )}
  >
    <h2
      data-testid="history-day-marker"
      className={cn(
        'mb-3 flex w-full flex-0 flex-row text-left text-2xl font-bold',
      )}
    >
      {marker}
    </h2>
    <div
      className="border-border w-full border-b"
    >
    </div>
  </section>
));