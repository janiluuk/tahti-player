import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { toBcp47, useTranslation } from '@tahti-player/i18n';
import { Card, CardsRow } from '@tahti-player/ui';

import {
  fetchUpcomingEvents,
  type UpcomingEvent,
} from '../../api/upcoming-events';
import { currentLocale } from '../../lib/locale';
import { placeholderArtworkUrl } from '../../lib/placeholderArt';
import { PageError } from '../PageStates';

function formatEventStart(value: string): string {
  return new Intl.DateTimeFormat(toBcp47(currentLocale()), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

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
  const venue = event.location
    ? `${event.place}, ${event.location}`
    : event.place;
  return (
    <Card
      surface="neutral"
      src={
        event.avatarUrl ??
        placeholderArtworkUrl(event.channelSlug ?? event.artistUsername)
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
          <span className="truncate font-semibold">
            {formatEventStart(event.startAt)}
          </span>
          <span className="truncate" title={event.artistDisplayName}>
            {event.artistDisplayName}
          </span>
          <span
            data-testid="event-card-venue"
            className="line-clamp-2 whitespace-normal"
            title={venue}
          >
            {venue}
          </span>
        </span>
      }
      onClick={open}
    />
  );
}

export function HomeComingUp() {
  const { t } = useTranslation('web');
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    void fetchUpcomingEvents().then((result) => {
      if (!cancelled) {
        setLoadError(
          result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
        );
        setEvents(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);
  if (events.length === 0) {
    if (!loadError) {
      return null;
    }
    return (
      <div data-testid="listen-coming-up-error">
        <PageError
          title={t('listen.couldNotLoadEvents')}
          description={loadError}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      </div>
    );
  }
  const items: EventRowItem[] = events.map((event) => ({
    id: event.id,
    title: `${event.title} ${event.artistDisplayName} ${event.place}`,
    event,
  }));
  return (
    <CardsRow
      defaultLayout="cards"
      data-testid="listen-coming-up"
      title={t('listen.comingUp')}
      items={items}
      labels={{
        filterPlaceholder: t('listen.filterEvents'),
        nothingFound: t('listen.nothingFound'),
      }}
      renderItem={({ event }: EventRowItem) => <EventCard event={event} />}
    />
  );
}
