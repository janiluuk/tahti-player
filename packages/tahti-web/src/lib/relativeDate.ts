import { i18n } from '@tahti-player/i18n';

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

/** `d.m.yyyy`, e.g. `3.11.2026`, the one absolute date style in Tahti. */
export function numericDate(date: Date): string {
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}

/** The one date style for listings: humanized in the app language inside a
 * week ("just now",
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
    return i18n.t('web:date.justNow');
  }
  if (elapsed < HOUR_MS) {
    return i18n.t('web:date.minutesAgo', {
      count: Math.floor(elapsed / MINUTE_MS),
    });
  }
  if (elapsed < DAY_MS) {
    return i18n.t('web:date.hoursAgo', {
      count: Math.floor(elapsed / HOUR_MS),
    });
  }
  return i18n.t('web:date.daysAgo', { count: Math.floor(elapsed / DAY_MS) });
}
