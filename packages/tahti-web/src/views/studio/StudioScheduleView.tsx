import { useLocation, useNavigate, useSearch } from '@tanstack/react-router';
import { PlusIcon } from 'lucide-react';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import {
  Button,
  ButtonLink,
  FilterChips,
  ImageReveal,
  Tabs,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import { ChannelAnnouncementsPanel } from '../../components/ChannelAnnouncementsPanel';
import { ChannelRadioPlaylistPanel } from '../../components/ChannelRadioPlaylistPanel';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ProgrammeToggles } from '../../components/ProgrammeToggles';
import { RestrictionNotice } from '../../components/RestrictionNotice';
import { RotationSourcePicker } from '../../components/RotationSourcePicker';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { useAuthStore } from '../../stores/authStore';
import {
  endAtFor,
  formatDate,
  formatTimeRange,
} from './schedule/schedule-helpers';
import { ScheduleAnalytics } from './schedule/ScheduleAnalytics';
import { ScheduledTimes } from './schedule/ScheduledTimes';
import { ScheduleEditorDialog } from './schedule/ScheduleEditorDialog';
import { useScheduleForm } from './schedule/useScheduleForm';
import { StudioEventsSection } from './StudioEventsSection';
import { StudioListeningPartiesSection } from './StudioListeningPartiesSection';

export type ScheduleShow = 'broadcasts' | 'events' | 'parties';
export type ScheduleTab = 'slots' | 'programme';

export const scheduleShow = (value: unknown): ScheduleShow =>
  value === 'events' || value === 'parties' ? value : 'broadcasts';

/** Programme panels live on the second tab, so links that only carry their
 * anchor (`#channel-programme`, `#channel-clips`) open that tab too. */
export const scheduleTab = (value: unknown, hash = ''): ScheduleTab =>
  value === 'programme' ||
  hash === 'channel-programme' ||
  hash === 'channel-clips'
    ? 'programme'
    : 'slots';

function showFilters(t: TFunction<'web'>) {
  return [
    { id: 'broadcasts', label: t('studioScheduleView.filterBroadcasts') },
    { id: 'events', label: t('studio.events') },
    { id: 'parties', label: t('studio.listeningParties') },
  ];
}

const CREATE_LINKS = {
  events: { to: '/studio/events/new', labelKey: 'studioEvents.addEvent' },
  parties: {
    to: '/studio/listening-parties/new',
    labelKey: 'studioListeningParties.schedule',
  },
} as const;

/** Broadcasts, events and listening parties on one page, one filter at a
 * time (`?show=events|parties`). Broadcasts use `?tab=slots|programme`. */
export function StudioScheduleView() {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as {
    show?: string;
    tab?: string;
  };
  const show = scheduleShow(search.show);
  const hash = useLocation({ select: (location) => location.hash });
  const tab = scheduleTab(search.tab, hash);
  const form = useScheduleForm();

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <ViewShell
          title={t('studioScheduleView.schedule')}
          classes={{ root: 'px-0 pt-0', content: 'gap-5' }}
          actions={
            show === 'broadcasts' ? (
              <Tooltip
                content={t('studioScheduleView.addNextBroadcast')}
                side="top"
              >
                <Button
                  size="icon-sm"
                  aria-label={t('studioScheduleView.addNextBroadcast')}
                  onClick={() => form.setEditorOpen(true)}
                >
                  <PlusIcon size={16} aria-hidden />
                </Button>
              </Tooltip>
            ) : (
              <Tooltip content={t(CREATE_LINKS[show].labelKey)} side="top">
                <ButtonLink
                  to={CREATE_LINKS[show].to}
                  size="icon-sm"
                  aria-label={t(CREATE_LINKS[show].labelKey)}
                >
                  <PlusIcon size={16} aria-hidden />
                </ButtonLink>
              </Tooltip>
            )
          }
        >
          <FilterChips
            aria-label={t('studioScheduleView.filterLabel')}
            data-testid="schedule-show-filter"
            items={showFilters(t)}
            selected={show}
            onChange={(next) =>
              void navigate({
                to: '/studio/schedule',
                search: () => {
                  const value = scheduleShow(next);
                  return value === 'broadcasts' ? {} : { show: value };
                },
                replace: true,
              })
            }
          />
          {show === 'events' ? (
            <StudioEventsSection />
          ) : show === 'parties' ? (
            <StudioListeningPartiesSection />
          ) : (
            <ScheduleBroadcasts form={form} tab={tab} />
          )}
        </ViewShell>
      </div>
    </StudioGate>
  );
}

function ScheduleBroadcasts({
  form,
  tab,
}: {
  form: ReturnType<typeof useScheduleForm>;
  tab: ScheduleTab;
}) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const channelSlug = useAuthStore((state) => state.user?.channel?.slug);
  const {
    shows,
    scheduledShows,
    scheduledTimes,
    pendingCancel,
    setPendingCancel,
    cancelEpisode,
    openEditor,
    setEditorOpen,
  } = form;

  const slots = (
    <>
      <RestrictionNotice type="LIVE_SHOW_BOOKING" />
      <ScheduledTimes
        items={scheduledTimes}
        onEdit={openEditor}
        onAdd={() => setEditorOpen(true)}
      />

      {scheduledShows.length > 0 ? (
        <StudioPanel
          title={t('studioScheduleView.scheduledShowEpisodes')}
          description={t('studioScheduleView.oneOffAndRecurringEpisodes')}
        >
          <ul className="divide-border divide-y">
            {scheduledShows.map((show) => {
              const endAt = endAtFor(
                show.startAt,
                shows.find((series) => series.id === show.seriesId)
                  ?.intervalHours,
              );
              return (
                <li
                  key={show.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {show.artworkUrl ? (
                      <ImageReveal
                        src={show.artworkUrl}
                        alt=""
                        className="size-16 shrink-0 rounded-lg"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {show.title}
                        {show.episodeNumber != null
                          ? ` · Episode ${show.episodeNumber}`
                          : ''}
                      </p>
                      <p className="text-foreground-secondary text-xs">
                        {formatDate(show.startAt)} at{' '}
                        {formatTimeRange(show.startAt, endAt)}
                        {show.venue ? ` · ${show.venue}` : ''}
                        {show.location ? `, ${show.location}` : ''}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="text"
                    onClick={() => setPendingCancel(show)}
                  >
                    {t('studioScheduleView.cancel')}
                  </Button>
                </li>
              );
            })}
          </ul>
        </StudioPanel>
      ) : null}

      <ConfirmDialog
        destructive
        isOpen={pendingCancel !== null}
        title={
          pendingCancel?.title
            ? t('studioSchedule.cancelTitleNamed', {
                title: pendingCancel.title,
              })
            : t('studioSchedule.cancelTitle')
        }
        description={t('studioSchedule.cancelDescription')}
        confirmLabel={t('studioSchedule.cancelConfirm')}
        onCancel={() => setPendingCancel(null)}
        onConfirm={() => {
          const target = pendingCancel;
          setPendingCancel(null);
          if (target) {
            void cancelEpisode(target.id);
          }
        }}
      />

      <ScheduleAnalytics />
      <ScheduleEditorDialog form={form} />
    </>
  );

  const programme = (
    <>
      <StudioPanel
        id="channel-programme"
        title={t('studioScheduleView.channelProgramme')}
        description={t('studioScheduleView.channelProgrammeDescription')}
      >
        <ProgrammeToggles />
      </StudioPanel>

      {channelSlug ? <RotationSourcePicker slug={channelSlug} /> : null}
      <ChannelRadioPlaylistPanel />
      <ChannelAnnouncementsPanel />
    </>
  );

  return (
    <Tabs
      selectedIndex={tab === 'programme' ? 1 : 0}
      onChange={(index) => {
        void navigate({
          to: '/studio/schedule',
          search: index === 1 ? { tab: 'programme' } : {},
          replace: true,
        });
      }}
      listClassName="flex-wrap"
      panelClassName="pt-2"
      items={[
        {
          id: 'slots',
          label: t('studioScheduleView.filterBroadcasts'),
          content: slots,
        },
        {
          id: 'programme',
          label: t('studioScheduleView.channelProgramme'),
          content: programme,
        },
      ]}
    />
  );
}
