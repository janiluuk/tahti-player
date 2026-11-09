import { CalendarIcon, RssIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { ExternalLink } from '@tahti-player/ui';

import { eventsIcsUrl } from '../../api/event-calendar';
import { fetchChannelEvents, type ArtistEvent } from '../../api/events';
import { EventCard } from '../events/EventCard';
import { PageError } from '../PageStates';
import { Eyebrow } from '../tahti/Eyebrow';

export function ArtistUpcomingEvents({
  channelSlug,
  username,
}: {
  channelSlug: string;
  username?: string;
}) {
  const { t } = useTranslation('web');
  const [events, setEvents] = useState<ArtistEvent[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    void fetchChannelEvents(channelSlug).then((result) => {
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
  }, [channelSlug, reloadKey]);

  if (loadError) {
    return (
      <PageError
        title={t('loadErrors.couldNotLoadUpcomingEvents')}
        description={loadError}
        onRetry={() => setReloadKey((key) => key + 1)}
      />
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <section
      className="flex flex-col gap-3"
      aria-label={t('artistUpcomingEventsText.upcomingEvents')}
    >
      <Eyebrow>
        <span className="inline-flex items-center gap-1.5">
          <CalendarIcon size={13} aria-hidden />
          {t('artistUpcomingEventsText.upcomingEvents')}
        </span>
      </Eyebrow>
      <ul className="flex flex-col gap-3">
        {events.map((event) => (
          <li key={event.id}>
            <EventCard event={event} linkToPage showDescription={false} />
          </li>
        ))}
      </ul>
      {username ? (
        <ExternalLink
          href={eventsIcsUrl(username)}
          className="text-primary-strong inline-flex items-center gap-1.5 self-start text-xs"
        >
          <RssIcon size={13} aria-hidden />
          {t('events.subscribeArtist')}
        </ExternalLink>
      ) : null}
    </section>
  );
}
