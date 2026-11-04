import { CalendarDaysIcon, MapPinIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

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
          content="Back to Events"
          side="right"
          wrapperClassName={backButtonCornerClassName}
        >
          <BackButtonLink to="/studio/events" aria-label="Back to Events" />
        </Tooltip>
        {event === undefined ? (
          <PageLoading label="Loading…" />
        ) : event === null ? (
          <PageEmpty title="That event could not be found" />
        ) : (
          <ViewShell
            title={event.title}
            classes={{ root: 'px-0 pt-0' }}
            actions={
              <EditIconLink
                to="/studio/events/$eventId/edit"
                params={{ eventId: event.id }}
                label={`Edit ${event.title}`}
              />
            }
          >
            <StudioPanel title="Event details">
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <dt className="sr-only">Start</dt>
                  <CalendarDaysIcon size={16} aria-hidden />
                  <dd>
                    <time dateTime={event.startAt}>
                      {formatScheduleWindow(event.startAt)}
                    </time>
                  </dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt className="sr-only">Place</dt>
                  <MapPinIcon size={16} aria-hidden />
                  <dd>
                    {[event.place, event.location].filter(Boolean).join(', ')}
                  </dd>
                </div>
                {event.description ? (
                  <div>
                    <dt className="sr-only">Description</dt>
                    <dd className="text-foreground-secondary whitespace-pre-wrap">
                      {event.description}
                    </dd>
                  </div>
                ) : null}
                {event.eventUrl ? (
                  <div>
                    <dt className="sr-only">Tickets / event link</dt>
                    <dd>
                      <ExternalLink
                        href={event.eventUrl}
                        className="text-primary-strong"
                      >
                        Tickets / event link
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
