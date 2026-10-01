import { CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ExternalLink } from '@tahti-player/ui';

import { fetchChannelEvents, type ArtistEvent } from '../../api/events';
import { Eyebrow } from '../tahti/Eyebrow';

const dateFormat: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

export function ArtistUpcomingEvents({ channelSlug }: { channelSlug: string }) {
  const [events, setEvents] = useState<ArtistEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchChannelEvents(channelSlug).then((result) => {
      if (!cancelled) {
        setEvents(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [channelSlug]);

  if (events.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Upcoming events">
      <Eyebrow>
        <span className="inline-flex items-center gap-1.5">
          <CalendarIcon size={13} aria-hidden />
          Upcoming events
        </span>
      </Eyebrow>
      <ul className="flex flex-col gap-3">
        {events.map((event) => (
          <li
            key={event.id}
            className="border-border flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm"
          >
            <time
              dateTime={event.startAt}
              className="text-foreground-secondary text-xs"
            >
              {new Date(event.startAt).toLocaleString(undefined, dateFormat)}
            </time>
            {event.eventUrl ? (
              <ExternalLink href={event.eventUrl} className="font-medium">
                {event.title}
              </ExternalLink>
            ) : (
              <span className="font-medium">{event.title}</span>
            )}
            <span className="text-foreground-secondary text-xs">
              {event.place}, {event.location}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
