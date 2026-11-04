import { Link } from '@tanstack/react-router';
import {
  CalendarDaysIcon,
  CalendarIcon,
  DiscIcon,
  MicIcon,
  PartyPopperIcon,
  RadioIcon,
  RadioTowerIcon,
  RepeatIcon,
  Settings2Icon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Badge,
  ButtonLink,
  FilterChips,
  HubCards,
  ViewShell,
  type HubCardItem,
} from '@tahti-player/ui';

import { fetchMyEvents } from '../../api/events';
import { fetchMyListeningParties } from '../../api/listening-parties';
import { fetchShowSchedule } from '../../api/shows/series';
import { renderHubLink } from '../../components/HubLink';
import { PageEmpty, PageLoading } from '../../components/PageStates';
import { StreamManagerPanel } from '../../components/StreamManagerPanel';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import {
  buildBroadcastAgenda,
  type AgendaItem,
  type AgendaKind,
} from '../../lib/broadcastAgenda';
import { formatScheduleWindow } from '../../lib/scheduleTime';
import { useAuthStore } from '../../stores/authStore';

export const STUDIO_BROADCAST_ITEMS: HubCardItem[] = [
  {
    id: 'schedule',
    href: '/studio/schedule',
    icon: CalendarDaysIcon,
    title: 'Schedule',
    description: 'Your channel’s week: shows, slots and what plays when.',
  },
  {
    id: 'shows',
    href: '/studio/shows',
    icon: MicIcon,
    title: 'Shows',
    description: 'Recurring shows, their episodes and artwork.',
  },
  {
    id: 'events',
    href: '/studio/events',
    icon: CalendarIcon,
    title: 'Events',
    description: 'Gigs and happenings on your channel page.',
  },
  {
    id: 'parties',
    href: '/studio/listening-parties',
    icon: PartyPopperIcon,
    title: 'Listening parties',
    description: 'Premiere a release with your fans in chat.',
  },
  {
    id: 'radio',
    href: '/studio/channel?tab=radio',
    icon: RepeatIcon,
    title: '24/7 radio',
    description: 'What your channel plays when you are not live.',
  },
  {
    id: 'recordings',
    href: '/library/recordings',
    icon: DiscIcon,
    title: 'Recordings',
    description: 'Past broadcasts, ready to publish or trim.',
  },
  {
    id: 'tahti-radio',
    href: '/studio/channel?tab=tahti-radio',
    icon: RadioIcon,
    title: 'Tahti Radio',
    description: 'Book a slot on the shared member relay.',
  },
  {
    id: 'channel',
    href: '/studio/channel',
    icon: Settings2Icon,
    title: 'Channel',
    description: 'Green room, radio tabs and channel settings.',
  },
];

const KIND_LABELS: Record<AgendaKind, string> = {
  show: 'Show',
  event: 'Event',
  party: 'Party',
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'show', label: 'Shows' },
  { id: 'event', label: 'Events' },
  { id: 'party', label: 'Parties' },
];

const formatStart = (iso: string) => formatScheduleWindow(iso);

function AgendaRow({ item }: { item: AgendaItem }) {
  return (
    <li>
      <Link
        to={item.to}
        params={item.params as never}
        className="hover:bg-background-secondary flex min-w-0 items-center gap-3 rounded-lg px-2 py-2"
        data-testid="broadcast-agenda-row"
      >
        <Badge variant="pill" color={item.live ? 'red' : 'secondary'}>
          {item.live ? 'Live' : KIND_LABELS[item.kind]}
        </Badge>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold">{item.title}</span>
          {item.place ? (
            <span className="text-foreground-secondary truncate text-xs">
              {item.place}
            </span>
          ) : null}
        </span>
        <time
          dateTime={item.startAt}
          className="text-foreground-secondary shrink-0 text-xs tabular-nums"
        >
          {formatStart(item.startAt)}
        </time>
      </Link>
    </li>
  );
}

export function StudioBroadcastView() {
  const channel = useAuthStore((state) => state.user?.channel);
  const live = channel?.state === 'LIVE';
  const [agenda, setAgenda] = useState<AgendaItem[] | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      fetchShowSchedule(),
      fetchMyEvents(),
      fetchMyListeningParties(),
    ]).then(([shows, events, parties]) => {
      if (!cancelled) {
        setAgenda(
          buildBroadcastAgenda({
            shows: shows.data.scheduledShows,
            events: events.data,
            parties: parties.data,
          }),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const shown =
    agenda?.filter((item) => filter === 'all' || item.kind === filter) ?? [];

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-4xl flex-col gap-4 px-1 py-2">
        <ViewShell
          title="Broadcast"
          classes={{ root: 'px-0 pt-0', content: 'gap-5' }}
        >
          <div
            data-testid="broadcast-air-banner"
            data-live={live || undefined}
            className="border-border bg-background-secondary/50 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
          >
            <span className="flex items-center gap-3">
              <span
                aria-hidden
                className={
                  live
                    ? 'bg-accent-red size-3 animate-pulse rounded-full'
                    : 'bg-foreground-secondary/40 size-3 rounded-full'
                }
              />
              <span className="flex flex-col">
                <span className="text-base font-bold">
                  {live ? 'On air' : 'Off air'}
                </span>
                <span className="text-foreground-secondary text-xs">
                  {live
                    ? 'You are live on your channel.'
                    : 'Your 24/7 radio plays while you are off air.'}
                </span>
              </span>
            </span>
            <ButtonLink to="/studio/go-live" className="gap-1.5">
              <RadioTowerIcon size={16} aria-hidden />
              {live ? 'Open the green room' : 'Go live'}
            </ButtonLink>
          </div>
          {channel?.slug ? (
            <section
              aria-labelledby="broadcast-channel-manager-title"
              data-testid="broadcast-channel-manager"
              className="flex flex-col gap-3"
            >
              <div>
                <h2
                  id="broadcast-channel-manager-title"
                  className="font-display text-lg font-bold tracking-tight"
                >
                  Channel manager
                </h2>
                <p className="text-foreground-secondary mt-1 text-sm">
                  Live status, rotation and stream controls for your channel.
                </p>
              </div>
              <StreamManagerPanel
                slug={channel.slug}
                channelState={channel.state ?? 'OFFLINE'}
              />
            </section>
          ) : null}
          <StudioPanel
            title="Coming up"
            description="Shows, events and listening parties, soonest first."
          >
            <div className="flex flex-col gap-3">
              <FilterChips
                aria-label="Agenda filter"
                items={FILTERS}
                selected={filter}
                onChange={setFilter}
              />
              {agenda === null ? (
                <PageLoading />
              ) : shown.length === 0 ? (
                <PageEmpty
                  title="Nothing coming up"
                  description="Schedule a show, add an event or plan a listening party."
                />
              ) : (
                <ul aria-label="Coming up" className="flex flex-col">
                  {shown.slice(0, 12).map((item) => (
                    <AgendaRow key={item.id} item={item} />
                  ))}
                </ul>
              )}
            </div>
          </StudioPanel>
          <HubCards
            aria-label="Broadcast tools"
            items={STUDIO_BROADCAST_ITEMS}
            renderLink={renderHubLink}
          />
        </ViewShell>
      </div>
    </StudioGate>
  );
}
