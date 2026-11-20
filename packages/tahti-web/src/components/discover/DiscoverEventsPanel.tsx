import { Link } from '@tanstack/react-router';
import { CalendarDaysIcon, MapPinIcon, PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, ButtonLink, MediaArtwork } from '@tahti-player/ui';

import {
  fetchUpcomingEvents,
  type UpcomingEvent,
} from '../../api/upcoming-events';
import { formatScheduleWindow } from '../../lib/scheduleTime';
import { useAuthModalStore } from '../../stores/authModalStore';
import { useAuthStore } from '../../stores/authStore';
import { PageEmpty, PageError, PageLoading } from '../PageStates';

const UPCOMING_LIMIT = 50;

function eventPlace(event: UpcomingEvent): string {
  const name = event.venue?.name ?? event.place;
  const city = event.venue?.city || event.location;
  return [name, city].filter(Boolean).join(', ');
}

export function DiscoverEventCard({ event }: { event: UpcomingEvent }) {
  const place = eventPlace(event);
  return (
    <article
      data-testid="discover-event-card"
      className="border-border bg-background group relative flex flex-col overflow-hidden rounded-lg border"
    >
      <div className="relative aspect-[3/1] w-full">
        <MediaArtwork
          src={event.imageUrl}
          alt=""
          seed={event.id}
          imageReveal={false}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-1 p-3 text-sm">
        <h3 className="line-clamp-2 text-base font-semibold">
          <Link
            to="/events/$eventId"
            params={{ eventId: event.id }}
            className="after:absolute after:inset-0 hover:underline"
          >
            {event.title}
          </Link>
        </h3>
        <p className="text-foreground-secondary truncate text-xs">
          {event.artistDisplayName}
        </p>
        <p className="text-foreground-secondary flex items-center gap-1.5 text-xs">
          <CalendarDaysIcon size={14} aria-hidden />
          <time dateTime={event.startAt}>
            {formatScheduleWindow(
              event.startAt,
              event.endAt,
              ' · ',
              event.timezone,
            )}
          </time>
        </p>
        {place ? (
          <p className="text-foreground-secondary flex min-w-0 items-center gap-1.5 text-xs">
            <MapPinIcon size={14} aria-hidden className="shrink-0" />
            <span className="truncate">{place}</span>
          </p>
        ) : null}
      </div>
    </article>
  );
}

/** Discover → Events: upcoming public events from every host, soonest
 * first, and the way in to posting one. */
export function DiscoverEventsPanel() {
  const { t } = useTranslation('web');
  const user = useAuthStore((state) => state.user);
  const openAuth = useAuthModalStore((state) => state.open);
  const [reloadKey, setReloadKey] = useState(0);
  const [events, setEvents] = useState<UpcomingEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setEvents(null);
    void fetchUpcomingEvents(UPCOMING_LIMIT).then((result) => {
      if (cancelled) {
        return;
      }
      setEvents(result.data);
      setError(
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <div className="flex flex-col gap-4" data-testid="discover-events">
      <header className="flex flex-wrap items-center gap-2">
        {user ? (
          <ButtonLink to="/events/new" size="sm" className="gap-1.5">
            <PlusIcon size={15} aria-hidden />
            {t('discoverEvents.post')}
          </ButtonLink>
        ) : (
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => openAuth('login')}
          >
            <PlusIcon size={15} aria-hidden />
            {t('discoverEvents.post')}
          </Button>
        )}
        {user ? null : (
          <p className="text-foreground-secondary text-xs">
            {t('discoverEvents.signInToPost')}
          </p>
        )}
      </header>
      {events === null ? (
        <PageLoading label={t('discoverEvents.loading')} />
      ) : error && events.length === 0 ? (
        <PageError
          title={t('discoverEvents.loadFailed')}
          description={error}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : events.length === 0 ? (
        <PageEmpty
          title={t('discoverEvents.emptyTitle')}
          description={t('discoverEvents.emptyDescription')}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <li key={event.id} className="min-w-0">
              <DiscoverEventCard event={event} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
