import { useNavigate } from '@tanstack/react-router';

import { toBcp47 } from '@tahti-player/i18n';
import { Card, MediaArtwork } from '@tahti-player/ui';

import type { UpcomingEvent } from '../../api/upcoming-events';
import { currentLocale } from '../../lib/locale';

function formatEventStart(value: string, timeZone?: string | null): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
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
  const open = () => {
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
        <span className="flex flex-col">
          <time
            dateTime={event.startAt}
            className="truncate font-semibold"
            data-testid="event-card-start"
          >
            {formatEventStart(event.startAt, event.timezone)}
          </time>
          <span className="truncate" title={event.artistDisplayName}>
            {event.artistDisplayName}
          </span>
          {place ? (
            <span
              data-testid="event-card-venue"
              className="line-clamp-2 whitespace-normal"
              title={place}
            >
              {place}
            </span>
          ) : null}
        </span>
      }
      onClick={open}
    />
  );
}
