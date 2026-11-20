import { useTranslation } from '@tahti-player/i18n';
import { Dialog, InlineLoader, ListeningClock } from '@tahti-player/ui';

import { dateLocaleTag } from '../../../lib/locale';
import { formatDate } from './helpers';
import type { StatsData } from './useStatsData';

export function HourlyDialog({ state }: { state: StatsData }) {
  const { t } = useTranslation('web');
  const { selectedDay, setSelectedDay, hourlyLoading, hourly } = state;

  return (
    <Dialog.Root
      isOpen={Boolean(selectedDay)}
      onClose={() => setSelectedDay(null)}
      className="max-w-2xl"
    >
      <Dialog.Title>
        {selectedDay
          ? t('hourlyDialogBatch32.titleWithDate', {
              date: formatDate(selectedDay),
            })
          : t('hourlyDialogBatch32.title')}
      </Dialog.Title>
      <Dialog.Description>
        {t('hourlyDialog.distributionOfPlaysAcrossThe')}
      </Dialog.Description>
      <div className="mt-4 min-h-48">
        {hourlyLoading ? (
          <InlineLoader label={t('hourlyDialog.loadingHours')} />
        ) : (
          <ListeningClock
            values={hourly}
            labels={{
              busiestHour: t('library.busiestHour'),
              busiestHourValue: t('hourlyDialogBatch32.busiestHourValue'),
            }}
            formatValue={(value) =>
              t('hourlyDialogBatch32.playsValue', {
                count: value,
                formatted: value.toLocaleString(dateLocaleTag()),
              })
            }
            formatHour={(hour) => `${String(hour).padStart(2, '0')}:00`}
          />
        )}
      </div>
      <Dialog.Actions>
        <Dialog.Close>{t('hourlyDialog.close')}</Dialog.Close>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
