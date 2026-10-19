import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Card, CardsRow } from '@tahti-player/ui';

import {
  fetchUpcomingEvents,
  type UpcomingEvent,
} from '../../api/upcoming-events';
import { placeholderArtworkUrl } from '../../lib/placeholderArt';

const ROW_LABELS = {
  filterPlaceholder: 'Filter events…',
  nothingFound: 'Nothing matches that filter.',
};

const dateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

type EventRowItem = { id: string; title: string; event: UpcomingEvent };

function EventCard({ event }: { event: UpcomingEvent }) {
  const navigate = useNavigate();
  const open = () => {
    if (event.channelSlug) {
      void navigate({
        to: '/channel/$slug',
        params: { slug: event.channelSlug },
      });
    } else if (event.eventUrl) {
      window.open(event.eventUrl, '_blank', 'noopener,noreferrer');
    }
  };
  return (
    <Card
      surface="neutral"
      src={
        event.avatarUrl ??
        placeholderArtworkUrl(event.channelSlug ?? event.artistUsername)
      }
      title={event.title}
      subtitle={
        <span className="flex flex-col">
          <span className="font-semibold">
            {dateFormat.format(new Date(event.startAt))}
          </span>
          <span>
            {event.artistDisplayName} · {event.place}
            {event.location ? `, ${event.location}` : ''}
          </span>
        </span>
      }
      onClick={open}
    />
  );
}

/** Artists' upcoming shows on the front page. Renders nothing when there
 * are none, or when the API doesn't serve the list yet. */
export function HomeComingUp() {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  useEffect(() => {
    let cancelled = false;
    void fetchUpcomingEvents().then(({ data }) => {
      if (!cancelled) {
        setEvents(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  if (events.length === 0) {
    return null;
  }
  const items: EventRowItem[] = events.map((event) => ({
    id: event.id,
    title: `${event.title} ${event.artistDisplayName} ${event.place}`,
    event,
  }));
  return (
    <CardsRow
      data-testid="listen-coming-up"
      title="Coming up"
      badge="Events"
      badgeColor="cyan"
      items={items}
      labels={ROW_LABELS}
      renderItem={({ event }: EventRowItem) => <EventCard event={event} />}
    />
  );
}
