import { Link } from '@tanstack/react-router';
import {
  CalendarPlusIcon,
  MapPinIcon,
  PencilIcon,
  RssIcon,
} from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import {
  backButtonCornerClassName,
  BackButtonLink,
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
import { EventBannerBackdrop } from '../components/events/EventBannerBackdrop';
import { EventCard } from '../components/events/EventCard';
import {
  PageEmpty,
  PageErrorBanner,
  PageLoading,
} from '../components/PageStates';
import { apiResult, useSnapshotFetch } from '../lib/useSnapshotFetch';
import { useAuthStore } from '../stores/authStore';

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
      <ViewShell title={t('events.calendar')} corner={corner}>
        <PageLoading label={t('events.loading')} />
      </ViewShell>
    );
  }
  if (!event) {
    return (
      <ViewShell title={t('events.calendar')} corner={corner}>
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
      data-testid="event-page"
      classes={{ content: 'mx-auto w-full max-w-2xl gap-4' }}
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
    </ViewShell>
  );
}
