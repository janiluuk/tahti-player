import { Link } from '@tanstack/react-router';
import {
  CalendarPlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  PencilIcon,
  RssIcon,
} from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import {
  backButtonCornerClassName,
  BackButtonLink,
  Button,
  ButtonLink,
  CopyButton,
  ExternalLink,
  MediaArtwork,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  eventsIcsUrl,
  fetchPublicEvent,
  googleCalendarUrl,
  type CalendarEvent,
} from '../api/event-calendar';
import { EventComments } from '../components/EventComments';
import { EventBannerBackdrop } from '../components/events/EventBannerBackdrop';
import { EventCard } from '../components/events/EventCard';
import { EventGallery } from '../components/events/EventGallery';
import { useEventBrowse } from '../components/events/useEventBrowse';
import {
  PageEmpty,
  PageErrorBanner,
  PageLoading,
} from '../components/PageStates';
import { cn } from '../lib/cn';
import { apiResult, useSnapshotFetch } from '../lib/useSnapshotFetch';
import { useAuthStore } from '../stores/authStore';
import {
  useEventBrowseStore,
  type EventNeighbours,
} from '../stores/eventBrowseStore';

function EventBrowseNav({
  neighbours,
  onGo,
}: {
  neighbours: EventNeighbours;
  onGo: (direction: 'next' | 'previous') => void;
}) {
  const { t } = useTranslation('web');
  const { previous, next } = neighbours;
  const previousLabel = previous
    ? t('eventPage.previousEvent', { title: previous.title })
    : t('eventPage.noPreviousEvent');
  const nextLabel = next
    ? t('eventPage.nextEvent', { title: next.title })
    : t('eventPage.noNextEvent');
  return (
    <nav
      aria-label={t('eventPage.browse')}
      data-testid="event-browse"
      className="flex items-center gap-1"
    >
      <Tooltip content={previousLabel} side="bottom">
        <Button
          size="icon-sm"
          variant="secondary"
          aria-label={previousLabel}
          disabled={!previous}
          data-testid="event-previous"
          onClick={() => onGo('previous')}
        >
          <ChevronLeftIcon size={18} aria-hidden />
        </Button>
      </Tooltip>
      <span
        data-testid="event-browse-position"
        className="text-foreground-secondary min-w-12 text-center text-xs tabular-nums"
      >
        {t('eventPage.position', {
          position: neighbours.position,
          total: neighbours.total,
        })}
      </span>
      <Tooltip content={nextLabel} side="bottom">
        <Button
          size="icon-sm"
          variant="secondary"
          aria-label={nextLabel}
          disabled={!next}
          data-testid="event-next"
          onClick={() => onGo('next')}
        >
          <ChevronRightIcon size={18} aria-hidden />
        </Button>
      </Tooltip>
    </nav>
  );
}

/** Public page for one published or cancelled event (`/events/$eventId`). */
export function EventView({ eventId }: { eventId: string }) {
  const { t } = useTranslation('web');
  const viewer = useAuthStore((state) => state.user);
  const {
    data: event,
    loading,
    error,
    retry,
  } = useSnapshotFetch<CalendarEvent | null>(`event:${eventId}`, async () =>
    apiResult(await fetchPublicEvent(eventId)),
  );
  const { neighbours, go, swipeHandlers } = useEventBrowse(eventId);
  const arrival = useEventBrowseStore((state) =>
    state.arrival?.eventId === eventId ? state.arrival.direction : null,
  );
  const actions = neighbours ? (
    <EventBrowseNav neighbours={neighbours} onGo={go} />
  ) : undefined;

  const corner = (
    <Tooltip
      content={t('eventPage.backToEvents')}
      side="right"
      wrapperClassName={backButtonCornerClassName}
    >
      <BackButtonLink
        to="/discover"
        search={{ tab: 'events' }}
        aria-label={t('eventPage.backToEvents')}
      />
    </Tooltip>
  );

  if (loading) {
    return (
      <ViewShell title={t('events.calendar')} corner={corner} actions={actions}>
        <PageLoading label={t('events.loading')} />
      </ViewShell>
    );
  }
  if (!event) {
    return (
      <ViewShell title={t('events.calendar')} corner={corner} actions={actions}>
        <PageEmpty
          title={t('events.notFound')}
          description={t('events.notFoundDescription')}
        />
      </ViewShell>
    );
  }

  return (
    <ViewShell
      title={event.title}
      subtitle={event.artistDisplayName}
      corner={corner}
      actions={actions}
      data-testid="event-page"
      classes={{ content: 'mx-auto w-full max-w-2xl lg:max-w-5xl' }}
    >
      <div
        key={event.id}
        data-testid="event-browse-surface"
        data-arrival={arrival ?? undefined}
        className={cn(
          'flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6',
          arrival === 'next' && 'tahti-poster-enter-next',
          arrival === 'previous' && 'tahti-poster-enter-previous',
        )}
        {...swipeHandlers}
      >
        <div
          data-testid="event-main"
          className="flex min-w-0 flex-1 flex-col gap-4"
        >
          {error ? (
            <PageErrorBanner
              title={t('pageStates.refreshFailed')}
              description={error}
              onRetry={retry}
            />
          ) : null}
          <section
            data-testid="event-hero"
            className="relative isolate overflow-hidden rounded-xl p-3 sm:p-5"
          >
            <EventBannerBackdrop src={event.imageUrl} seed={event.id} />
            <div className="relative aspect-[3/1] w-full overflow-hidden rounded-lg shadow-lg">
              <MediaArtwork
                src={event.imageUrl}
                alt={t('eventPage.bannerAlt', { title: event.title })}
                seed={event.id}
                imageReveal={false}
              />
            </div>
          </section>
          {viewer && viewer.username === event.artistUsername ? (
            <div className="flex justify-end">
              <ButtonLink
                to="/events/$eventId/edit"
                params={{ eventId: event.id }}
                size="sm"
                variant="secondary"
                className="gap-1.5"
              >
                <PencilIcon size={14} aria-hidden />
                {t('eventPage.edit')}
              </ButtonLink>
            </div>
          ) : null}
          <EventCard
            event={event}
            host={{
              displayName: event.artistDisplayName,
              channelSlug: event.channelSlug,
            }}
            showDescription={false}
          />
          {event.venue ? (
            <section
              data-testid="event-venue"
              className="border-border bg-background flex items-start gap-3 rounded-lg border p-3 text-sm"
            >
              <MapPinIcon
                size={18}
                aria-hidden
                className="text-foreground-secondary mt-0.5 shrink-0"
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <h2 className="text-foreground-secondary text-xs font-medium">
                  {t('eventPage.venue')}
                </h2>
                <Link
                  to="/v/$slug"
                  params={{ slug: event.venue.slug }}
                  className="font-semibold hover:underline"
                >
                  {event.venue.name}
                </Link>
                {event.venue.city ? (
                  <p className="text-foreground-secondary text-xs">
                    {event.venue.city}
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}
          {event.description ? (
            <p className="text-sm whitespace-pre-wrap">{event.description}</p>
          ) : null}
          <EventGallery
            images={event.gallery}
            title={event.title}
            seed={event.id}
          />
        </div>
        <aside
          aria-label={t('eventPage.sidePanel')}
          data-testid="event-side-panel"
          className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-0 lg:w-80 lg:shrink-0"
        >
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {event.status !== 'CANCELLED' ? (
              <ExternalLink
                href={googleCalendarUrl(event)}
                className="text-primary-strong inline-flex items-center gap-1.5"
              >
                <CalendarPlusIcon size={15} aria-hidden />
                {t('events.addToCalendar')}
              </ExternalLink>
            ) : null}
            <ExternalLink
              href={eventsIcsUrl(event.artistUsername)}
              className="text-primary-strong inline-flex items-center gap-1.5"
            >
              <RssIcon size={15} aria-hidden />
              {t('events.downloadIcs')}
            </ExternalLink>
            <CopyButton text={window.location.href} label={t('events.share')} />
          </div>
          {event.status !== 'CANCELLED' ? (
            <EventComments
              eventId={event.id}
              isHost={Boolean(
                viewer && viewer.username === event.artistUsername,
              )}
            />
          ) : null}
        </aside>
      </div>
    </ViewShell>
  );
}
