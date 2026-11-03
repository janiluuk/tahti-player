import type { StudioSoundsState } from './useStudioSoundsState';

function formatDuration(totalSec: number): string {
  if (totalSec <= 0) {
    return '0 min';
  }
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.round((totalSec % 3600) / 60);
  if (hours <= 0) {
    return `${minutes} min`;
  }
  return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
}

/** Totals for the current Sounds filter (from GET /api/me/sound/stats). */
export function SoundsStatsStrip({ state }: { state: StudioSoundsState }) {
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

  return (
    <p className="text-foreground-secondary mb-3 text-sm" aria-live="polite">
      {row.total === 1 ? '1 sound' : `${row.total} sounds`}
      {row.durationSec > 0 ? ` · ${formatDuration(row.durationSec)}` : ''}
      {row.publicCount > 0 || row.privateCount > 0
        ? ` · ${row.publicCount} public · ${row.privateCount} private`
        : ''}
      {row.processingCount > 0 ? ` · ${row.processingCount} processing` : ''}
      {row.errorCount > 0 ? ` · ${row.errorCount} failed` : ''}
    </p>
  );
}
