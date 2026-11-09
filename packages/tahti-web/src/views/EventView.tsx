import { CalendarPlusIcon, RssIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  backButtonCornerClassName,
  BackButtonLink,
  CopyButton,
  ExternalLink,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  eventsIcsUrl,
  fetchPublicEvent,
  googleCalendarUrl,
  type CalendarEvent,
} from '../api/event-calendar';
import { EventCard } from '../components/events/EventCard';
import { PageEmpty, PageLoading } from '../components/PageStates';

/** Public page for one published or cancelled event (`/events/$eventId`). */
export function EventView({ eventId }: { eventId: string }) {
  const { t } = useTranslation('web');
  const [event, setEvent] = useState<CalendarEvent | null | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;
    setEvent(undefined);
    void fetchPublicEvent(eventId).then((result) => {
      if (!cancelled) {
        setEvent(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const corner = (
    <Tooltip
      content={t('events.backToCalendar')}
      side="right"
      wrapperClassName={backButtonCornerClassName}
    >
      <BackButtonLink
        to="/discover"
        search={{ tab: 'feed', view: 'calendar' }}
        aria-label={t('events.backToCalendar')}
      />
    </Tooltip>
  );

  if (event === undefined) {
    return (
      <ViewShell title={t('events.calendar')} corner={corner}>
        <PageLoading label={t('events.loading')} />
      </ViewShell>
    );
  }
  if (event === null) {
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
      <EventCard
        event={event}
        host={{
          displayName: event.artistDisplayName,
          channelSlug: event.channelSlug,
        }}
        showDescription={false}
      />
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
