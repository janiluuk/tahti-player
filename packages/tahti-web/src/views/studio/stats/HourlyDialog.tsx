import { Dialog, ListeningClock } from '@tahti-player/ui';

import { formatDate } from './helpers';
import type { StatsData } from './useStatsData';

export function HourlyDialog({ state }: { state: StatsData }) {
  const { selectedDay, setSelectedDay, hourlyLoading, hourly } = state;

  return (
    <Dialog.Root
      isOpen={Boolean(selectedDay)}
      onClose={() => setSelectedDay(null)}
      className="max-w-2xl"
    >
      <Dialog.Title>
        {selectedDay
          ? `Hourly plays · ${formatDate(selectedDay)}`
          : 'Hourly plays'}
      </Dialog.Title>
      <Dialog.Description>
        Distribution of plays across the day. Click another day on the chart to
        compare.
      </Dialog.Description>
      <div className="mt-4 min-h-48">
        {hourlyLoading ? (
          <p className="text-foreground-secondary text-sm">Loading hours…</p>
        ) : (
          <ListeningClock
            values={hourly}
            labels={{
              busiestHour: 'Busiest hour',
              busiestHourValue: 'Plays in busiest hour',
            }}
            formatValue={(value) => `${value.toLocaleString()} plays`}
            formatHour={(hour) => `${String(hour).padStart(2, '0')}:00`}
          />
        )}
      </div>
      <Dialog.Actions>
        <Dialog.Close>Close</Dialog.Close>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
