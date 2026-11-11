import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import {
  CalendarClockIcon,
  CalendarPlusIcon,
  HistoryIcon,
  MailIcon,
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
  MediaArtwork,
  Tabs,
} from '@tahti-player/ui';

import { deleteEvent, fetchMyEvents, type ArtistEvent } from '../../api/events';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EventInvitesPanel } from '../../components/events/EventInvitesPanel';
import { EventStatusBadge } from '../../components/events/EventStatusBadge';
import { PageEmpty, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import { formatScheduleWindow } from '../../lib/scheduleTime';
import { apiResult, useSnapshotFetch } from '../../lib/useSnapshotFetch';

const EVENT_TABS = ['upcoming', 'past', 'invites'];

/** The events filter of Studio → Broadcast → Schedule (`?show=events`). */
export function StudioEventsSection() {
  const { t } = useTranslation('web');
  const [pendingRemove, setPendingRemove] = useState<ArtistEvent | null>(null);
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { tab?: string };
  const tabIndex = Math.max(0, EVENT_TABS.indexOf(search.tab ?? 'upcoming'));

  const snapshot = useSnapshotFetch<ArtistEvent[]>('studio-events', async () =>
    apiResult(await fetchMyEvents()),
  );
  const events = snapshot.data ?? [];
  const { loading, retry: reload } = snapshot;

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

  const renderEvents = (items: ArtistEvent[], withCreate = false) =>
    items.length === 0 ? (
      <PageEmpty
        title={t('studioEvents.empty')}
        action={
          withCreate ? (
            <ButtonLink to="/studio/events/new" size="sm" variant="secondary">
              <CalendarPlusIcon size={16} aria-hidden />
              {t('studioEvents.addEvent')}
            </ButtonLink>
          ) : undefined
        }
      />
    ) : (
      <ul className="flex flex-col gap-2">
        {items.map((event) => (
          <li
            key={event.id}
            className="border-border bg-background flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-3 text-sm"
          >
            <div className="flex min-w-0 items-center gap-3">
              <MediaArtwork
                src={event.imageUrl}
                alt=""
                seed={event.id}
                size="thumb"
                className="size-14 shrink-0 rounded-md"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to="/studio/events/$eventId"
                    params={{ eventId: event.id }}
                    className="font-medium hover:underline"
                  >
                    {event.title}
                  </Link>
                  {event.status ? (
                    <EventStatusBadge status={event.status} />
                  ) : null}
                </div>
                <div className="text-foreground-secondary text-xs">
                  {formatScheduleWindow(event.startAt, event.endAt)} ·{' '}
                  {event.place}, {event.location}
                </div>
                {event.description && (
                  <p className="text-foreground-secondary mt-1 max-w-md text-xs">
                    {event.description}
                  </p>
                )}
                {event.ticketUrl || event.eventUrl ? (
                  <ExternalLink
                    href={event.ticketUrl ?? event.eventUrl ?? ''}
                    className="text-primary-strong text-xs"
                  >
                    {event.ticketUrl
                      ? t('events.tickets')
                      : t('events.eventLink')}
                  </ExternalLink>
                ) : null}
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
                  className="text-accent-red-strong mr-1.5"
                />
                {t('studioEvents.remove')}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    );

  return (
    <>
      <Tabs
        selectedIndex={tabIndex}
        onChange={(index) =>
          void navigate({
            to: '/studio/schedule',
            search:
              index === 0
                ? { show: 'events' }
                : { show: 'events', tab: EVENT_TABS[index] },
            replace: true,
          })
        }
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
                  renderEvents(upcomingEvents, true)
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
          {
            id: 'invites',
            label: t('events.invites'),
            icon: <MailIcon size={14} />,
            content: (
              <StudioPanel
                title={t('events.invitesTitle')}
                description={t('events.invitesDescription')}
              >
                <EventInvitesPanel />
              </StudioPanel>
            ),
          },
        ]}
      />
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
    </>
  );
}
