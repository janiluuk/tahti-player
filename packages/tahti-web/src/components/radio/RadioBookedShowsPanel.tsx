import { Link } from '@tanstack/react-router';
import {
  CalendarDaysIcon,
  CalendarPlusIcon,
  MessageCircleIcon,
  MicIcon,
} from 'lucide-react';

import { Button, ButtonLink } from '@tahti-player/ui';

import type { StudioShowBooking } from '../../api/shows';
import { PageEmpty, PageError, PageErrorBanner } from '../PageStates';

const LIST_CLASS =
  'border-border divide-border divide-y overflow-hidden rounded-lg border';

const HEADING_CLASS =
  'text-foreground-secondary text-xs font-semibold tracking-wide uppercase';

const MS_PER_DAY = 86_400_000;

type BookingDay = { key: string; label: string; bookings: StudioShowBooking[] };

function startOfLocalDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

function dayLabel(start: Date, now: Date): string {
  const dayDiff = Math.round(
    (startOfLocalDay(start) - startOfLocalDay(now)) / MS_PER_DAY,
  );
  if (dayDiff === 0) {
    return 'Today';
  }
  if (dayDiff === 1) {
    return 'Tomorrow';
  }
  return start.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Bookings grouped by the local day they start on, in start order. */
export function groupBookingsByDay(
  bookings: readonly StudioShowBooking[],
  now: Date,
): BookingDay[] {
  const days = new Map<string, BookingDay>();
  for (const booking of [...bookings].sort((a, b) =>
    a.startAt.localeCompare(b.startAt),
  )) {
    const start = new Date(booking.startAt);
    const key = String(startOfLocalDay(start));
    const day = days.get(key) ?? {
      key,
      label: dayLabel(start, now),
      bookings: [],
    };
    day.bookings.push(booking);
    days.set(key, day);
  }
  return [...days.values()];
}

/** Radio → Shows: the booked live shows coming up on Tahti Radio, day by
 * day, with the way into the full schedule and (signed in) booking a slot. */
export function RadioBookedShowsPanel({
  bookings,
  error,
  onRetry,
  onBook,
}: {
  bookings: StudioShowBooking[];
  error?: string;
  onRetry: () => void;
  onBook?: () => void;
}) {
  const days = groupBookingsByDay(bookings, new Date());
  return (
    <section
      className="flex flex-col gap-4"
      data-testid="radio-booked-shows"
      aria-label="Booked shows"
    >
      <div className="flex flex-wrap items-center gap-2">
        {onBook ? (
          <Button size="sm" variant="secondary" onClick={onBook}>
            <CalendarPlusIcon size={15} className="mr-1.5" aria-hidden />
            Book a slot
          </Button>
        ) : null}
        <ButtonLink to="/schedule" size="sm" variant="secondary">
          <CalendarDaysIcon size={15} className="mr-1.5" aria-hidden />
          Full schedule
        </ButtonLink>
      </div>
      {error && bookings.length > 0 ? (
        <PageErrorBanner
          title="Could not refresh the schedule"
          description={error}
          onRetry={onRetry}
        />
      ) : null}
      {error && bookings.length === 0 ? (
        <PageError
          title="Could not load the schedule"
          description={error}
          onRetry={onRetry}
        />
      ) : days.length === 0 ? (
        <PageEmpty title="Nothing booked yet. Fair rotation plays when nobody is." />
      ) : (
        days.map((day) => (
          <div key={day.key} className="flex flex-col gap-2">
            <h3 className={HEADING_CLASS}>{day.label}</h3>
            <ul className={LIST_CLASS}>
              {day.bookings.map((booking) => (
                <li
                  key={booking.id}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  {booking.showType === 'TALK' ? (
                    <MessageCircleIcon
                      size={16}
                      aria-hidden
                      className="text-foreground-secondary shrink-0"
                    />
                  ) : (
                    <MicIcon
                      size={16}
                      aria-hidden
                      className="text-foreground-secondary shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/radio/show/$channelSlug"
                      params={{ channelSlug: booking.channelSlug }}
                      className="block truncate text-sm leading-6 font-medium underline-offset-2 hover:underline"
                    >
                      {booking.note ?? booking.displayName}
                    </Link>
                    <div className="text-foreground-secondary truncate text-xs">
                      {booking.displayName}
                      {booking.isMine ? ' (you)' : ''}
                    </div>
                  </div>
                  <span className="text-foreground-secondary shrink-0 text-xs tabular-nums">
                    {formatTime(booking.startAt)}-{formatTime(booking.endAt)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
