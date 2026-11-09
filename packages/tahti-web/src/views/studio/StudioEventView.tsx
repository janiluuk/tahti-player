import { CalendarDaysIcon, MapPinIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  backButtonCornerClassName,
  BackButtonLink,
  EditIconLink,
  ExternalLink,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import { fetchMyEvents, type ArtistEvent } from '../../api/events';
import { PageEmpty, PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { formatScheduleWindow } from '../../lib/scheduleTime';

export function StudioEventView({ eventId }: { eventId: string }) {
  const { t } = useTranslation('web');
  const [event, setEvent] = useState<ArtistEvent | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void fetchMyEvents().then((result) => {
      if (!cancelled) {
        setEvent(result.data.find((item) => item.id === eventId) ?? null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return (
    <StudioGate>
      <div className="studio-page-layout relative mx-auto flex max-w-3xl flex-col gap-6">
        <Tooltip
          content={t('studioEventView.backToEvents')}
          side="right"
          wrapperClassName={backButtonCornerClassName}
        >
          <BackButtonLink
            to="/studio/events"
            aria-label={t('studioEventView.backToEvents')}
          />
        </Tooltip>
        {event === undefined ? (
          <PageLoading label={t('loading.loading')} />
        ) : event === null ? (
          <PageEmpty title={t('empties.eventNotFound')} />
        ) : (
          <ViewShell
            title={event.title}
            classes={{ root: 'px-0 pt-0' }}
            actions={
              <EditIconLink
                to="/studio/events/$eventId/edit"
                params={{ eventId: event.id }}
                label={t('studioEventViewLabels.editTitle', {
                  title: event.title,
                })}
              />
            }
          >
            <StudioPanel title={t('studioEventView.eventDetails')}>
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <dt className="sr-only">{t('studioEventView.start')}</dt>
                  <CalendarDaysIcon size={16} aria-hidden />
                  <dd>
                    <time dateTime={event.startAt}>
                      {formatScheduleWindow(event.startAt)}
                    </time>
                  </dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt className="sr-only">{t('studioEventView.place')}</dt>
                  <MapPinIcon size={16} aria-hidden />
                  <dd>
                    {[event.place, event.location].filter(Boolean).join(', ')}
                  </dd>
                </div>
                {event.description ? (
                  <div>
                    <dt className="sr-only">
                      {t('studioEventView.description')}
                    </dt>
                    <dd className="text-foreground-secondary whitespace-pre-wrap">
                      {event.description}
                    </dd>
                  </div>
                ) : null}
                {event.eventUrl ? (
                  <div>
                    <dt className="sr-only">
                      {t('studioEventView.ticketsEventLink')}
                    </dt>
                    <dd>
                      <ExternalLink
                        href={event.eventUrl}
                        className="text-primary-strong"
                      >
                        {t('studioEventView.ticketsEventLink')}
                      </ExternalLink>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </StudioPanel>
          </ViewShell>
        )}
      </div>
    </StudioGate>
  );
}
