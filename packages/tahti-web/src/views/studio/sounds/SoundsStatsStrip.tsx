import { useTranslation, type TFunction } from '@tahti-player/i18n';

import type { StudioSoundsState } from './useStudioSoundsState';

function formatDuration(totalSec: number, t: TFunction<'web'>): string {
  if (totalSec <= 0) {
    return t('library.soundsDurationMin', { minutes: 0 });
  }
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.round((totalSec % 3600) / 60);
  if (hours <= 0) {
    return t('library.soundsDurationMin', { minutes });
  }
  return minutes > 0
    ? t('library.soundsDurationHoursMin', { hours, minutes })
    : t('library.soundsDurationHours', { hours });
}

export function SoundsStatsStrip({ state }: { state: StudioSoundsState }) {
  const { t } = useTranslation('web');
  const { stats, total, items } = state;
  if (!stats && total === 0 && items.length === 0) {
    return null;
  }
  const row = stats ?? {
    total,
    durationSec: 0,
    publicCount: 0,
    privateCount: 0,
    processingCount: 0,
    errorCount: 0,
    readyCount: 0,
  };

  const parts = [t('library.soundsCount', { count: row.total })];
  if (row.durationSec > 0) {
    parts.push(formatDuration(row.durationSec, t));
  }
  if (row.publicCount > 0 || row.privateCount > 0) {
    parts.push(t('library.soundsStripPublic', { count: row.publicCount }));
    parts.push(t('library.soundsStripPrivate', { count: row.privateCount }));
  }
  if (row.processingCount > 0) {
    parts.push(
      t('library.soundsStripProcessing', { count: row.processingCount }),
    );
  }
  if (row.errorCount > 0) {
    parts.push(t('library.soundsStripFailed', { count: row.errorCount }));
  }

  return (
    <p className="text-foreground-secondary mb-3 text-sm" aria-live="polite">
      {parts.join(' · ')}
    </p>
  );
}
