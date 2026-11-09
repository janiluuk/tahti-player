import { i18n } from '@tahti-player/i18n';

import { relativeDate } from './relativeDate';

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;
const YEAR_MS = 365 * DAY_MS;

/** Feed and story dates stay humanized at any age ("2 weeks ago",
 * "4 months ago"), unlike listings, which switch to `d.m.yyyy` after a
 * week (see `relativeDate`). */
export function storyDate(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const elapsed = now.getTime() - date.getTime();
  if (elapsed < WEEK_MS) {
    return elapsed < 0 ? i18n.t('web:date.justNow') : relativeDate(date, now);
  }
  if (elapsed < MONTH_MS) {
    return i18n.t('web:date.weeksAgo', {
      count: Math.floor(elapsed / WEEK_MS),
    });
  }
  if (elapsed < YEAR_MS) {
    return i18n.t('web:date.monthsAgo', {
      count: Math.floor(elapsed / MONTH_MS),
    });
  }
  return i18n.t('web:date.yearsAgo', { count: Math.floor(elapsed / YEAR_MS) });
}

/** Full local date and time for a `<time>` tooltip. */
export function storyDateTitle(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString(i18n.language.replace('_', '-'), {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
}
