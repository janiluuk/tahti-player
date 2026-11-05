import { Link } from '@tanstack/react-router';
import {
  CalendarClockIcon,
  CalendarDaysIcon,
  HistoryIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  ButtonLink,
  EditIconLink,
  ExternalLink,
  Tabs,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import { deleteEvent, fetchMyEvents, type ArtistEvent } from '../../api/events';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageEmpty, PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { formatScheduleWindow } from '../../lib/scheduleTime';

export function StudioEventsView() {
  const { t } = useTranslation('web');
  const [events, setEvents] = useState<ArtistEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingRemove, setPendingRemove] = useState<ArtistEvent | null>(null);

  const reload = () => {
    void fetchMyEvents().then((r) => {
      setEvents(r.data);
      setLoading(false);
    });
  };

  useEffect(reload, []);

  useEffect(() => {
    const refresh = () => reload();
    window.addEventListener('tahti-studio-events', refresh);
    return () => window.removeEventListener('tahti-studio-events', refresh);
  }, []);

  const now = Date.now();
  const upcomingEvents = events.filter(
    (event) => new Date(event.startAt).getTime() >= now,
  );
  const pastEvents = events.filter(
    (event) => new Date(event.startAt).getTime() < now,
  );

  const renderEvents = (items: ArtistEvent[]) =>
    items.length === 0 ? (
      <PageEmpty title={t('studioEvents.empty')} />
    ) : (
      <ul className="flex flex-col gap-2">
        {items.map((event) => (
          <li
            key={event.id}
            className="border-border bg-background flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-3 text-sm"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="bg-primary/15 text-primary-strong flex size-14 shrink-0 items-center justify-center rounded-md"
                aria-hidden
              >
                <CalendarDaysIcon size={24} aria-hidden />
              </div>
              <div className="min-w-0">
                <Link
                  to="/studio/events/$eventId"
                  params={{ eventId: event.id }}
                  className="font-medium hover:underline"
                >
                  {event.title}
                </Link>
                <div className="text-foreground-secondary text-xs">
                  {formatScheduleWindow(event.startAt)} · {event.place},{' '}
                  {event.location}
                </div>
                {event.description && (
                  <p className="text-foreground-secondary mt-1 max-w-md text-xs">
                    {event.description}
                  </p>
                )}
                {event.eventUrl && (
                  <ExternalLink
                    href={event.eventUrl}
                    className="text-primary-strong text-xs"
                  >
                    {t('studioEvents.ticketsLink')}
                  </ExternalLink>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              <EditIconLink
                to="/studio/events/$eventId/edit"
                params={{ eventId: event.id }}
                label={t('actions.editNamed', { name: event.title })}
                variant="text"
              />
              <Button
                size="sm"
                variant="text"
                onClick={() => setPendingRemove(event)}
              >
                <Trash2Icon
                  size={14}
                  aria-hidden
                  className="text-accent-red mr-1.5"
                />
                {t('studioEvents.remove')}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    );

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-6">
        <ViewShell
          title={t('studioEvents.title')}
          classes={{ root: 'px-0 pt-0' }}
          actions={
            <Tooltip content={t('studioEvents.addEvent')} side="top">
              <ButtonLink
                to="/studio/events/new"
                size="icon-sm"
                aria-label={t('studioEvents.addEvent')}
              >
                <PlusIcon size={16} aria-hidden />
              </ButtonLink>
            </Tooltip>
          }
        >
          <Tabs
            listClassName="border-border border-b pb-3"
            panelClassName="pt-2"
            items={[
              {
                id: 'upcoming',
                label: t('studioEvents.upcoming'),
                icon: <CalendarClockIcon size={14} />,
                content: (
                  <StudioPanel
                    title={t('studioEvents.upcomingTitle')}
                    description={t('studioEvents.upcomingDescription')}
                  >
                    {loading ? (
                      <PageLoading label={t('studioEvents.loading')} />
                    ) : (
                      renderEvents(upcomingEvents)
                    )}
                  </StudioPanel>
                ),
              },
              {
                id: 'past',
                label: t('studioEvents.past'),
                icon: <HistoryIcon size={14} />,
                content: (
                  <StudioPanel
                    title={t('studioEvents.pastTitle')}
                    description={t('studioEvents.pastDescription')}
                  >
                    {loading ? (
                      <PageLoading label={t('studioEvents.loading')} />
                    ) : (
                      renderEvents(pastEvents)
                    )}
                  </StudioPanel>
                ),
              },
            ]}
          />
        </ViewShell>
        <ConfirmDialog
          isOpen={pendingRemove !== null}
          title={
            pendingRemove
              ? t('studioEvents.removeConfirmTitleNamed', {
                  title: pendingRemove.title,
                })
              : t('studioEvents.removeConfirmTitle')
          }
          description={t('studioEvents.removeConfirmDescription')}
          confirmLabel={t('studioEvents.remove')}
          destructive
          onCancel={() => setPendingRemove(null)}
          onConfirm={() => {
            const event = pendingRemove;
            if (!event) {
              return;
            }
            setPendingRemove(null);
            void deleteEvent(event.id).then((result) => {
              if (!result.ok) {
                toast.error(result.error);
                return;
              }
              toast.success(t('toasts.eventRemoved', { title: event.title }));
              reload();
            });
          }}
        />
      </div>
    </StudioGate>
  );
}
