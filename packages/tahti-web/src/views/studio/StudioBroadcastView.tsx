import { Link } from '@tanstack/react-router';
import {
  CalendarDaysIcon,
  CalendarIcon,
  CalendarPlusIcon,
  DiscIcon,
  MicIcon,
  PartyPopperIcon,
  RadioIcon,
  RadioTowerIcon,
  RepeatIcon,
  Settings2Icon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
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

export function studioBroadcastItems(t: TFunction<'web'>): HubCardItem[] {
  return [
    {
      id: 'schedule',
      href: '/studio/schedule',
      icon: CalendarDaysIcon,
      title: t('studioBroadcastViewMore.schedule'),
      description: t('studioBroadcastViewMore.yourChannelSWeekShows'),
    },
    {
      id: 'shows',
      href: '/studio/shows',
      icon: MicIcon,
      title: t('studioBroadcastViewMore.shows'),
      description: t('studioBroadcastViewMore.recurringShowsTheirEpisodesAnd'),
    },
    {
      id: 'events',
      href: '/studio/schedule?show=events',
      icon: CalendarIcon,
      title: t('studioBroadcastViewMore.events'),
      description: t('studioBroadcastViewMore.gigsAndHappeningsOnYour'),
    },
    {
      id: 'parties',
      href: '/studio/schedule?show=parties',
      icon: PartyPopperIcon,
      title: t('studioBroadcastViewMore.listeningParties'),
      description: t('studioBroadcastViewMore.premiereAReleaseWithYour'),
    },
    {
      id: 'radio',
      href: '/studio/channel?radio=rotation#radio',
      icon: RepeatIcon,
      title: '24/7 radio',
      description: t('studioBroadcastViewMore.whatYourChannelPlaysWhen'),
    },
    {
      id: 'recordings',
      href: '/library/recordings',
      icon: DiscIcon,
      title: t('studioBroadcastViewMore.recordings'),
      description: t('studioBroadcastViewMore.pastBroadcastsReadyToPublish'),
    },
    {
      id: 'tahti-radio',
      href: '/studio/channel?radio=tahti-radio#radio',
      icon: RadioIcon,
      title: 'Tahti Radio',
      description: t('studioBroadcastViewMore.bookASlotOnThe'),
    },
    {
      id: 'channel',
      href: '/studio/channel',
      icon: Settings2Icon,
      title: t('studioBroadcastViewMore.channel'),
      description: t('studioBroadcastViewMore.greenRoomRadioTabsAnd'),
    },
  ];
}

const KIND_LABELS: Record<AgendaKind, string> = {
  show: 'Show',
  event: 'Event',
  party: 'Party',
};

const EMPTY_CREATE = {
  event: { to: '/studio/events/new', label: 'emptyActions.addEvent' },
  party: {
    to: '/studio/listening-parties/new',
    label: 'emptyActions.scheduleParty',
  },
  all: { to: '/studio/schedule', label: 'emptyActions.addBroadcast' },
} as const;

function filters(t: TFunction<'web'>) {
  return [
    { id: 'all', label: 'All' },
    { id: 'show', label: t('studioBroadcastViewMore.shows') },
    { id: 'event', label: t('studioBroadcastViewMore.events') },
    { id: 'party', label: t('studioBroadcastViewMore.parties') },
  ];
}

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
  const { t } = useTranslation('web');
  const channel = useAuthStore((state) => state.user?.channel);
  const live = channel?.state === 'LIVE';
  const [agenda, setAgenda] = useState<AgendaItem[] | null>(null);
  const [filter, setFilter] = useState('all');
  const emptyCreate =
    filter === 'event' || filter === 'party'
      ? EMPTY_CREATE[filter]
      : EMPTY_CREATE.all;

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
          title={t('studioBroadcastView.broadcast')}
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
                  {live
                    ? t('studioBroadcastViewStates.onAir')
                    : t('studioBroadcastViewStates.offAir')}
                </span>
                <span className="text-foreground-secondary text-xs">
                  {live
                    ? t('studioBroadcastViewStates.youAreLiveOnYour')
                    : t('studioBroadcastViewStates.your247RadioPlays')}
                </span>
              </span>
            </span>
            <ButtonLink to="/studio/go-live" className="gap-1.5">
              <RadioTowerIcon size={16} aria-hidden />
              {live
                ? t('studioBroadcastViewStates.openTheGreenRoom')
                : t('studioBroadcastViewStates.goLive')}
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
                  {t('studioBroadcastView.channelManager')}
                </h2>
                <p className="text-foreground-secondary mt-1 text-sm">
                  {t('studioBroadcastView.liveStatusRotationAndStream')}
                </p>
              </div>
              <StreamManagerPanel
                slug={channel.slug}
                channelState={channel.state ?? 'OFFLINE'}
              />
            </section>
          ) : null}
          <StudioPanel
            title={t('studioBroadcastView.comingUp')}
            description={t(
              'studioBroadcastView.showsEventsAndListeningParties',
            )}
          >
            <div className="flex flex-col gap-3">
              <FilterChips
                aria-label={t('studioBroadcastView.agendaFilter')}
                items={filters(t)}
                selected={filter}
                onChange={setFilter}
              />
              {agenda === null ? (
                <PageLoading />
              ) : shown.length === 0 ? (
                <PageEmpty
                  title={t('empties.nothingComingUp')}
                  description={t('empties.scheduleAShowAddAnEvent')}
                  action={
                    <ButtonLink
                      to={emptyCreate.to}
                      size="sm"
                      variant="secondary"
                    >
                      <CalendarPlusIcon size={16} aria-hidden />
                      {t(emptyCreate.label)}
                    </ButtonLink>
                  }
                />
              ) : (
                <ul
                  aria-label={t('studioBroadcastView.comingUp')}
                  className="flex flex-col"
                >
                  {shown.slice(0, 12).map((item) => (
                    <AgendaRow key={item.id} item={item} />
                  ))}
                </ul>
              )}
            </div>
          </StudioPanel>
          <HubCards
            aria-label={t('studioBroadcastView.broadcastTools')}
            items={studioBroadcastItems(t)}
            renderLink={renderHubLink}
          />
        </ViewShell>
      </div>
    </StudioGate>
  );
}
