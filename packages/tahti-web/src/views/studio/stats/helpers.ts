import type { StatsPlaysDay } from '../../../api/studio-extras';

export const formatDate = (value: string) =>
  new Date(`${value}T12:00:00Z`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

export const todayUtc = () => new Date().toISOString().slice(0, 10);

export function playsCsv(daily: StatsPlaysDay[]): string {
  const rows = daily.map((day) =>
    [day.date, day.plays, day.downloads ?? '', day.smartLinkClicks ?? ''].join(
      ',',
    ),
  );
  return ['date,plays,downloads,smart_link_clicks', ...rows].join('\r\n');
}

export function downloadPlaysCsv(daily: StatsPlaysDay[]): void {
  const blob = new Blob([playsCsv(daily)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const first = daily[0]?.date ?? todayUtc();
  const last = daily.at(-1)?.date ?? first;
  link.href = url;
  link.download = `tahti-plays-${first}-to-${last}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
