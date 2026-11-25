import { useTranslation } from '@tahti-player/i18n';
import { ButtonLink, CardsRow } from '@tahti-player/ui';

import {
  fetchUpcomingEvents,
  type UpcomingEvent,
} from '../../api/upcoming-events';
import { apiResult, useSnapshotFetch } from '../../lib/useSnapshotFetch';
import { EventBrowseRow } from '../events/EventBrowseRow';
import { UpcomingEventCard } from '../events/UpcomingEventCard';
import { UpcomingEventsCarousel } from '../events/UpcomingEventsCarousel';

export const NEXT_EVENTS_LIMIT = 12;

/** The `upcoming-events` Discover widget body: upcoming events as a
 * browsable poster carousel, soonest first, with a way to the Events tab. */
export function UpcomingEventsStrip({ events }: { events: UpcomingEvent[] }) {
  const { t } = useTranslation('web');
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <UpcomingEventsCarousel events={events} />
      <ButtonLink
        to="/discover"
        search={{ tab: 'events' }}
        size="sm"
        variant="secondary"
        className="self-start"
      >
        {t('discoverEvents.seeAll')}
      </ButtonLink>
    </div>
  );
}

type NextEventItem = { id: string; title: string; event: UpcomingEvent };

const NO_EVENTS: UpcomingEvent[] = [];

/** Discover → Events opens with the next events (soonest first) above the
 * filters; hidden when nothing is coming up, the list below says so. */
export function DiscoverNextEvents() {
  const { t } = useTranslation('web');
  const { data } = useSnapshotFetch<UpcomingEvent[]>(
    'discover:next-events',
    async () => apiResult(await fetchUpcomingEvents(NEXT_EVENTS_LIMIT)),
  );
  const events = data ?? NO_EVENTS;
  if (events.length === 0) {
    return null;
  }
  const items: NextEventItem[] = events.map((event) => ({
    id: event.id,
    title: `${event.title} ${event.artistDisplayName} ${event.place}`,
    event,
  }));
  return (
    <EventBrowseRow events={events}>
      <CardsRow
        defaultLayout="cards"
        data-testid="discover-next-events"
        title={t('discoverEvents.nextTitle')}
        items={items}
        labels={{
          filterPlaceholder: t('listen.filterEvents'),
          nothingFound: t('listen.nothingFound'),
        }}
        renderItem={({ event }: NextEventItem) => (
          <UpcomingEventCard event={event} />
        )}
      />
    </EventBrowseRow>
  );
}
