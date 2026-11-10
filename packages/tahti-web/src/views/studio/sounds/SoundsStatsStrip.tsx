import { useTranslation, type TFunction } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

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
  const {
    stats,
    total,
    items,
    setVisibilityFilter,
    setStatusFilter,
    setFiltersOpen,
  } = state;
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

  const applyVisibility = (value: 'public' | 'private') => {
    setFiltersOpen(true);
    setVisibilityFilter(value);
  };
  const applyStatus = (value: 'PROCESSING' | 'ERROR' | 'READY') => {
    setFiltersOpen(true);
    setStatusFilter(value);
  };

  return (
    <p
      className="text-foreground-secondary mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
      aria-live="polite"
    >
      <span>{t('library.soundsCount', { count: row.total })}</span>
      {row.durationSec > 0 ? (
        <>
          <span aria-hidden>·</span>
          <span>{formatDuration(row.durationSec, t)}</span>
        </>
      ) : null}
      {row.publicCount > 0 || row.privateCount > 0 ? (
        <>
          <span aria-hidden>·</span>
          <Button
            type="button"
            size="sm"
            variant="text"
            className="h-auto min-h-0 px-0 py-0 text-sm"
            onClick={() => applyVisibility('public')}
          >
            {t('library.soundsStripPublic', { count: row.publicCount })}
          </Button>
          <span aria-hidden>·</span>
          <Button
            type="button"
            size="sm"
            variant="text"
            className="h-auto min-h-0 px-0 py-0 text-sm"
            onClick={() => applyVisibility('private')}
          >
            {t('library.soundsStripPrivate', { count: row.privateCount })}
          </Button>
        </>
      ) : null}
      {row.readyCount > 0 ? (
        <>
          <span aria-hidden>·</span>
          <Button
            type="button"
            size="sm"
            variant="text"
            className="h-auto min-h-0 px-0 py-0 text-sm"
            onClick={() => applyStatus('READY')}
          >
            {t('library.soundsStripReady', { count: row.readyCount })}
          </Button>
        </>
      ) : null}
      {row.processingCount > 0 ? (
        <>
          <span aria-hidden>·</span>
          <Button
            type="button"
            size="sm"
            variant="text"
            className="h-auto min-h-0 px-0 py-0 text-sm"
            onClick={() => applyStatus('PROCESSING')}
          >
            {t('library.soundsStripProcessing', { count: row.processingCount })}
          </Button>
        </>
      ) : null}
      {row.errorCount > 0 ? (
        <>
          <span aria-hidden>·</span>
          <Button
            type="button"
            size="sm"
            variant="text"
            className="h-auto min-h-0 px-0 py-0 text-sm"
            onClick={() => applyStatus('ERROR')}
          >
            {t('library.soundsStripFailed', { count: row.errorCount })}
          </Button>
        </>
      ) : null}
    </p>
  );
}
