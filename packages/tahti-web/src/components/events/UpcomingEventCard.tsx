import { useNavigate } from '@tanstack/react-router';
import { CalendarDaysIcon, MapPinIcon, UserIcon } from 'lucide-react';

import { toBcp47 } from '@tahti-player/i18n';
import { Card, MediaArtwork } from '@tahti-player/ui';

import type { UpcomingEvent } from '../../api/upcoming-events';
import { currentLocale } from '../../lib/locale';
import { useRememberEventRow } from './EventBrowseRow';

export function formatEventStart(
  value: string,
  timeZone?: string | null,
): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  };
  const locale = toBcp47(currentLocale());
  try {
    return new Intl.DateTimeFormat(locale, {
      ...options,
      timeZone: timeZone ?? undefined,
    }).format(new Date(value));
  } catch {
    return new Intl.DateTimeFormat(locale, options).format(new Date(value));
  }
}

export function upcomingEventPlace(event: UpcomingEvent): string {
  const name = event.venue?.name ?? event.place;
  const city = event.venue?.city || event.location;
  return [name, city].filter(Boolean).join(', ');
}

/** One upcoming event as a `Card`: banner (or host avatar, else the default
 * artwork), title, start time, host and place. Opens the event page. */
export function UpcomingEventCard({ event }: { event: UpcomingEvent }) {
  const navigate = useNavigate();
  const rememberRow = useRememberEventRow();
  const open = () => {
    rememberRow();
    void navigate({ to: '/events/$eventId', params: { eventId: event.id } });
  };
  const place = upcomingEventPlace(event);
  return (
    <Card
      surface="neutral"
      image={
        <MediaArtwork
          size="fill"
          src={event.imageUrl ?? event.avatarUrl ?? undefined}
          alt=""
          seed={event.id}
        />
      }
      itemName={event.title}
      title={
        <span
          data-testid="event-card-title"
          className="line-clamp-2 whitespace-normal"
          title={event.title}
        >
          {event.title}
        </span>
      }
      subtitle={
        <span className="flex flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-1">
            <CalendarDaysIcon size={12} className="shrink-0" aria-hidden />
            <time
              dateTime={event.startAt}
              className="truncate font-semibold"
              data-testid="event-card-start"
            >
              {formatEventStart(event.startAt, event.timezone)}
            </time>
          </span>
          <span className="flex min-w-0 items-center gap-1">
            <UserIcon size={12} className="shrink-0" aria-hidden />
            <span className="truncate" title={event.artistDisplayName}>
              {event.artistDisplayName}
            </span>
          </span>
          {place ? (
            <span className="flex min-w-0 items-start gap-1">
              <MapPinIcon size={12} className="mt-0.5 shrink-0" aria-hidden />
              <span
                data-testid="event-card-venue"
                className="line-clamp-2 whitespace-normal"
                title={place}
              >
                {place}
              </span>
            </span>
          ) : null}
        </span>
      }
      onClick={open}
    />
  );
}
