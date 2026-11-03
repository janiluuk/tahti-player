const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

function ago(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? '' : 's'} ago`;
}

/** `d.m.yyyy`, e.g. `3.11.2026`, the one absolute date style in Tahti. */
export function numericDate(date: Date): string {
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}

/** The one date style for listings: humanized inside a week ("just now",
 * "45 minutes ago", "3 hours ago", "2 days ago"), `d.m.yyyy` after that.
 * A future or unparsable date falls back to `d.m.yyyy` / empty. */
export function relativeDate(
  value: string | number | Date,
  now: Date = new Date(),
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const elapsed = now.getTime() - date.getTime();
  if (elapsed < 0 || elapsed >= WEEK_MS) {
    return numericDate(date);
  }
  if (elapsed < MINUTE_MS) {
    return 'just now';
  }
  if (elapsed < HOUR_MS) {
    return ago(Math.floor(elapsed / MINUTE_MS), 'minute');
  }
  if (elapsed < DAY_MS) {
    return ago(Math.floor(elapsed / HOUR_MS), 'hour');
  }
  return ago(Math.floor(elapsed / DAY_MS), 'day');
}
