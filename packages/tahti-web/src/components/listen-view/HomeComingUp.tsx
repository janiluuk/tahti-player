import { useTranslation } from '@tahti-player/i18n';
import { CardsRow } from '@tahti-player/ui';

import {
  fetchUpcomingEvents,
  type UpcomingEvent,
} from '../../api/upcoming-events';
import { apiResult, useSnapshotFetch } from '../../lib/useSnapshotFetch';
import { UpcomingEventCard } from '../events/UpcomingEventCard';
import { PageError } from '../PageStates';

type EventRowItem = { id: string; title: string; event: UpcomingEvent };

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
      renderItem={({ event }: EventRowItem) => (
        <UpcomingEventCard event={event} />
      )}
    />
  );
}
