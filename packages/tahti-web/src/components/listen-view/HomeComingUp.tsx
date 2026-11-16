import { useNavigate } from '@tanstack/react-router';

import { toBcp47, useTranslation } from '@tahti-player/i18n';
import { Card, CardsRow } from '@tahti-player/ui';

import {
  fetchUpcomingEvents,
  type UpcomingEvent,
} from '../../api/upcoming-events';
import { currentLocale } from '../../lib/locale';
import { placeholderArtworkUrl } from '../../lib/placeholderArt';
import { apiResult, useSnapshotFetch } from '../../lib/useSnapshotFetch';
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
    void navigate({ to: '/events/$eventId', params: { eventId: event.id } });
  };
  const venue = event.location
    ? `${event.place}, ${event.location}`
    : event.place;
  return (
    <Card
      surface="neutral"
      src={
        event.imageUrl ??
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

const NO_EVENTS: UpcomingEvent[] = [];

export function HomeComingUp() {
  const { t } = useTranslation('web');
  const {
    data,
    error: loadError,
    retry,
  } = useSnapshotFetch<UpcomingEvent[]>('listen:coming-up', async () =>
    apiResult(await fetchUpcomingEvents()),
  );
  const events = data ?? NO_EVENTS;
  if (events.length === 0) {
    if (!loadError) {
      return null;
    }
    return (
      <div data-testid="listen-coming-up-error">
        <PageError
          title={t('listen.couldNotLoadEvents')}
          description={loadError}
          onRetry={retry}
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
