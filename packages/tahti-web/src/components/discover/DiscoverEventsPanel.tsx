import { Link } from '@tanstack/react-router';
import { CalendarDaysIcon, MapPinIcon, PlusIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, Button, ButtonLink, MediaArtwork } from '@tahti-player/ui';

import type { UpcomingEvent } from '../../api/upcoming-events';
import { cn } from '../../lib/cn';
import { formatScheduleWindow } from '../../lib/scheduleTime';
import { useAuthModalStore } from '../../stores/authModalStore';
import { useAuthStore } from '../../stores/authStore';
import { EventCalendar } from '../events/EventCalendar';
import { PageEmpty, PageError, PageLoading } from '../PageStates';
import { DiscoverEventsFilterBar } from './DiscoverEventsFilterBar';
import type { EventsFilters } from './eventFilters';
import { useDiscoverEvents } from './useDiscoverEvents';

function eventPlace(event: UpcomingEvent): string {
  const name = event.venue?.name ?? event.place;
  const city = event.venue?.city || event.location;
  return [name, city].filter(Boolean).join(', ');
}

export function DiscoverEventCard({
  event,
  past = false,
}: {
  event: UpcomingEvent;
  past?: boolean;
}) {
  const { t } = useTranslation('web');
  const place = eventPlace(event);
  return (
    <article
      data-testid="discover-event-card"
      data-past={past || undefined}
      className={cn(
        'border-border bg-background group relative flex flex-col overflow-hidden rounded-lg border',
        past && 'opacity-75 grayscale-[40%]',
      )}
    >
      <div className="relative aspect-[3/1] w-full">
        <MediaArtwork
          src={event.imageUrl}
          alt=""
          seed={event.id}
          imageReveal={false}
        />
        {past ? (
          <Badge
            variant="pill"
            color="secondary"
            className="absolute top-2 left-2"
          >
            {t('discoverEventsFilters.pastBadge')}
          </Badge>
        ) : null}
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

/** Discover → Events: public events from every host (calendar endpoint,
 * so range, past and filters need no extra API), as cards or a calendar,
 * and the way in to posting one. Pass `filters` + `onFiltersChange` to keep
 * the state in the URL; without them it keeps its own. */
export function DiscoverEventsPanel({
  filters,
  onFiltersChange,
}: {
  filters?: EventsFilters;
  onFiltersChange?: (
    next: EventsFilters,
    options?: { replace?: boolean },
  ) => void;
} = {}) {
  const { t } = useTranslation('web');
  const user = useAuthStore((state) => state.user);
  const openAuth = useAuthModalStore((state) => state.open);
  const state = useDiscoverEvents(filters, onFiltersChange);
  const { current, loaded, visible, error, filtered } = state;

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
      <DiscoverEventsFilterBar state={state} />
      {loaded === null ? (
        <PageLoading label={t('discoverEvents.loading')} />
      ) : error && loaded.length === 0 ? (
        <PageError
          title={t('discoverEvents.loadFailed')}
          description={error}
          onRetry={state.retry}
        />
      ) : visible.length === 0 && filtered ? (
        <PageEmpty
          title={t('discoverEventsFilters.noMatchTitle')}
          description={t('discoverEventsFilters.noMatchDescription')}
          action={
            <Button size="sm" variant="secondary" onClick={state.clear}>
              {t('discoverEventsFilters.clear')}
            </Button>
          }
        />
      ) : current.view === 'calendar' ? (
        <EventCalendar events={visible} />
      ) : visible.length === 0 ? (
        current.past ? (
          <PageEmpty
            title={t('discoverEventsFilters.pastEmptyTitle')}
            description={t('discoverEventsFilters.pastEmptyDescription')}
          />
        ) : (
          <PageEmpty
            title={t('discoverEvents.emptyTitle')}
            description={t('discoverEvents.emptyDescription')}
          />
        )
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((event) => (
            <li key={event.id} className="min-w-0">
              <DiscoverEventCard event={event} past={current.past} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
