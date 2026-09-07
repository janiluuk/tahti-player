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

import { Button, EmptyState, Tabs, Tooltip, ViewShell } from '@tahti-player/ui';

import { deleteEvent, fetchMyEvents, type ArtistEvent } from '../../api/events';
import { PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';

export function StudioEventsView() {
  const [events, setEvents] = useState<ArtistEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    void fetchMyEvents().then((r) => {
      setEvents(r.data);
      setLoading(false);
    });
  };

  useEffect(reload, []);

  const now = Date.now();
  const upcomingEvents = events.filter(
    (event) => new Date(event.startAt).getTime() >= now,
  );
  const pastEvents = events.filter(
    (event) => new Date(event.startAt).getTime() < now,
  );

  const renderEvents = (items: ArtistEvent[]) =>
    items.length === 0 ? (
      <EmptyState size="sm" title="No events listed yet" />
    ) : (
      <ul className="flex flex-col gap-2">
        {items.map((event) => (
          <li
            key={event.id}
            className="border-border bg-background flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-3 text-sm"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="bg-primary/15 text-primary flex size-14 shrink-0 items-center justify-center rounded-md"
                aria-label={`${event.title} thumbnail`}
              >
                <CalendarDaysIcon size={24} aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="font-medium">{event.title}</div>
                <div className="text-foreground-secondary text-xs">
                  {new Date(event.startAt).toLocaleString()} · {event.place},{' '}
                  {event.location}
                </div>
                {event.description && (
                  <p className="text-foreground-secondary mt-1 max-w-md text-xs">
                    {event.description}
                  </p>
                )}
                {event.eventUrl && (
                  <a
                    href={event.eventUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary text-xs hover:underline"
                  >
                    Tickets / event link
                  </a>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="text"
              onClick={() => {
                void deleteEvent(event.id).then((result) => {
                  if (!result.ok) {
                    toast.error(result.error);
                  } else {
                    reload();
                  }
                });
              }}
            >
              <Trash2Icon size={14} aria-hidden className="mr-1.5" />
              Remove
            </Button>
          </li>
        ))}
      </ul>
    );

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-6">
        <StudioNav current="/studio/events" />
        <ViewShell
          title="Events"
          classes={{ root: 'px-0 pt-0' }}
          actions={
            <Tooltip content="Add event" side="top">
              <Link to="/studio/events/new">
                <Button size="icon-sm" aria-label="Add event">
                  <PlusIcon size={16} aria-hidden />
                </Button>
              </Link>
            </Tooltip>
          }
        >
          <Tabs
            listClassName="border-border border-b pb-3"
            panelClassName="pt-2"
            items={[
              {
                id: 'upcoming',
                label: 'Upcoming',
                icon: <CalendarClockIcon size={14} />,
                content: (
                  <StudioPanel
                    title="Upcoming events"
                    description="Festivals, live shows, and public appearances."
                  >
                    {loading ? (
                      <PageLoading label="Loading…" />
                    ) : (
                      renderEvents(upcomingEvents)
                    )}
                  </StudioPanel>
                ),
              },
              {
                id: 'past',
                label: 'Past',
                icon: <HistoryIcon size={14} />,
                content: (
                  <StudioPanel
                    title="Past events"
                    description="Your previous appearances and performances."
                  >
                    {loading ? (
                      <PageLoading label="Loading…" />
                    ) : (
                      renderEvents(pastEvents)
                    )}
                  </StudioPanel>
                ),
              },
            ]}
          />
        </ViewShell>
      </div>
    </StudioGate>
  );
}
