import { ClockIcon } from 'lucide-react';

import { cn } from '../lib/cn';
import { relativeDate } from '../lib/relativeDate';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** A listing date in the one Tahti style: clock icon, then "3 hours ago"
 * inside a week or `d.m.yyyy` after, in a `<time>` whose title is the full
 * local timestamp. A date-only `yyyy-mm-dd` value is that local day.
 * Renders nothing for an unparsable value. */
export function ListingDate({
  value,
  className,
  iconSize = 12,
}: {
  value: string;
  className?: string;
  iconSize?: number;
}) {
  const date = new Date(DATE_ONLY.test(value) ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <ClockIcon size={iconSize} aria-hidden className="shrink-0" />
      <time dateTime={value} title={date.toLocaleString()}>
        {relativeDate(date)}
      </time>
    </span>
  );
}
