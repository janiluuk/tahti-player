import { CalendarIcon, RssIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, ExternalLink } from '@tahti-player/ui';

import { eventsIcsUrl } from '../../api/event-calendar';
import { fetchChannelEvents, type ArtistEvent } from '../../api/events';
import { EventCard } from '../events/EventCard';
import { PageError } from '../PageStates';
import { Eyebrow } from '../tahti/Eyebrow';

const PAST_PREVIEW = 3;

export function ArtistUpcomingEvents({
  channelSlug,
  username,
  includePast = false,
}: {
  channelSlug: string;
  username?: string;
  /** When true, also load past events (newest first, collapsed after a few). */
  includePast?: boolean;
}) {
  const { t } = useTranslation('web');
  const [upcoming, setUpcoming] = useState<ArtistEvent[]>([]);
  const [past, setPast] = useState<ArtistEvent[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [pastExpanded, setPastExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    const upcomingReq = fetchChannelEvents(channelSlug, { scope: 'upcoming' });
    const pastReq = includePast
      ? fetchChannelEvents(channelSlug, { scope: 'past' })
      : null;
    void Promise.all([upcomingReq, pastReq ?? Promise.resolve(null)]).then(
      ([up, pastResult]) => {
        if (cancelled) {
          return;
        }
        const upReason =
          up.meta.source === 'api' ? (up.meta.reason ?? null) : null;
        const pastReason =
          pastResult && pastResult.meta.source === 'api'
            ? (pastResult.meta.reason ?? null)
            : null;
        setLoadError(upReason ?? pastReason);
        setUpcoming(up.data);
        setPast(pastResult?.data ?? []);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [channelSlug, includePast, reloadKey]);

  if (loadError) {
    return (
      <PageError
        title={t('loadErrors.couldNotLoadUpcomingEvents')}
        description={loadError}
        onRetry={() => setReloadKey((key) => key + 1)}
      />
    );
  }

  if (upcoming.length === 0 && past.length === 0) {
    return null;
  }

  const visiblePast = pastExpanded ? past : past.slice(0, PAST_PREVIEW);
  const hiddenPastCount = Math.max(0, past.length - PAST_PREVIEW);

  return (
    <div className="flex flex-col gap-5">
      {upcoming.length > 0 ? (
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
            {upcoming.map((event) => (
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
      ) : null}
      {past.length > 0 ? (
        <section
          className="flex flex-col gap-3"
          aria-label={t('artistUpcomingEventsText.pastEvents')}
        >
          <Eyebrow>
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon size={13} aria-hidden />
              {t('artistUpcomingEventsText.pastEvents')}
            </span>
          </Eyebrow>
          <ul className="flex flex-col gap-3">
            {visiblePast.map((event) => (
              <li key={event.id}>
                <EventCard event={event} linkToPage showDescription={false} />
              </li>
            ))}
          </ul>
          {hiddenPastCount > 0 ? (
            <Button
              variant="text"
              size="sm"
              className="self-start"
              onClick={() => setPastExpanded((open) => !open)}
            >
              {pastExpanded
                ? t('artistUpcomingEventsText.showFewerPast')
                : t('artistUpcomingEventsText.showMorePast', {
                    count: hiddenPastCount,
                  })}
            </Button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
