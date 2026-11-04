import { toBcp47 } from '@tahti-player/i18n';

import { currentLocale } from './locale';

/** An exact show window for schedules and bookings, in the app language:
 * `Mon, Nov 3 · 18:00–19:00`. Schedules keep their time of day, so they
 * never go through `ListingDate`. */
export function formatScheduleWindow(
  startAt: string,
  endAt?: string | null,
  separator = ' · ',
): string {
  const localeTag = toBcp47(currentLocale());
  const start = new Date(startAt);
  const day = start.toLocaleDateString(localeTag, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const clock = { hour: '2-digit', minute: '2-digit' } as const;
  const from = start.toLocaleTimeString(localeTag, clock);
  if (!endAt) {
    return `${day}${separator}${from}`;
  }
  const to = new Date(endAt).toLocaleTimeString(localeTag, clock);
  return `${day}${separator}${from}–${to}`;
}
