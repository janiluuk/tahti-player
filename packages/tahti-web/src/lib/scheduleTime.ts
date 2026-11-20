import { toBcp47 } from '@tahti-player/i18n';

import { currentLocale } from './locale';

function isKnownTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** An exact show window for schedules and bookings, in the app language:
 * `Mon, Nov 3 · 18:00–19:00`. Schedules keep their time of day, so they
 * never go through `ListingDate`. With `timeZone` (IANA) the day and times
 * are those of that zone; an unknown zone falls back to the viewer's. */
export function formatScheduleWindow(
  startAt: string,
  endAt?: string | null,
  separator = ' · ',
  timeZone?: string | null,
): string {
  const localeTag = toBcp47(currentLocale());
  const start = new Date(startAt);
  const zone = timeZone && isKnownTimeZone(timeZone) ? { timeZone } : {};
  const day = start.toLocaleDateString(localeTag, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...zone,
  });
  const clock = { hour: '2-digit', minute: '2-digit', ...zone } as const;
  const from = start.toLocaleTimeString(localeTag, clock);
  if (!endAt) {
    return `${day}${separator}${from}`;
  }
  const to = new Date(endAt).toLocaleTimeString(localeTag, clock);
  return `${day}${separator}${from}–${to}`;
}
