import { Link } from '@tanstack/react-router';
import {
  CalendarDaysIcon,
  Clock3Icon,
  ListIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  Button,
  Dialog,
  ImageReveal,
  Input,
  SaveButton,
  Select,
  Toggle,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  cancelScheduledShow,
  createShowSeries,
  fetchShowSchedule,
  fetchShowSeries,
  scheduleShowEpisode,
  updateShowSeriesRecurrence,
  type ScheduledShow,
  type ShowType,
  type StudioShowSeries,
} from '../../api/shows';
import {
  fetchChannelSchedule,
  fetchStatsPlays,
  fetchUpcomingBroadcasts,
  patchChannelSchedule,
  type ChannelSchedule,
  type StatsPlays,
  type UpcomingBroadcast,
} from '../../api/studio-extras';
import {
  BroadcastDetailsFields,
  type BroadcastDetailsValues,
} from '../../components/BroadcastDetailsFields';
import { ChannelRadioPlaylistPanel } from '../../components/ChannelRadioPlaylistPanel';
import { ImageUploadField } from '../../components/ImageUploadField';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_BROADCAST_HOUR = 20;
const DAYS_PER_WEEK = 7;
const FREQUENCY_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type LocalDateTime = {
  date: string;
  time: string;
};

type ScheduleCard = {
  id: string;
  startAt: string;
  endAt?: string | null;
  title: string;
  location?: string | null;
  visibility?: 'PUBLIC' | 'FAN_ONLY';
  description?: string | null;
  tagline?: string | null;
  artworkUrl?: string | null;
  backdropUrl?: string | null;
  showId?: string;
  episodeNumber?: number | null;
};

const pad = (value: number) => value.toString().padStart(2, '0');

function toLocalParts(iso: string | null): LocalDateTime {
  if (!iso) {
    return { date: '', time: '' };
  }
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) {
    return { date: '', time: '' };
  }
  return {
    date: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
    time: `${pad(value.getHours())}:${pad(value.getMinutes())}`,
  };
}

function fromLocalParts(date: string, time: string): string | null {
  if (!date || !time) {
    return null;
  }
  const value = new Date(`${date}T${time}`);
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function endAtFor(startAt: string, durationHours: number | null | undefined) {
  const start = new Date(startAt);
  if (Number.isNaN(start.getTime())) {
    return null;
  }
  const duration = Math.max(1, durationHours ?? 1);
  return new Date(start.getTime() + duration * 60 * 60 * 1000).toISOString();
}

function formatTimeRange(startAt: string, endAt?: string | null): string {
  return `${formatTime(startAt)}${endAt ? `–${formatTime(endAt)}` : ''}`;
}

function nextFriday(): Date {
  const value = new Date();
  const friday = 5;
  const daysUntilFriday =
    (friday - value.getDay() + DAYS_PER_WEEK) % DAYS_PER_WEEK;
  value.setDate(value.getDate() + (daysUntilFriday || DAYS_PER_WEEK));
  value.setHours(DEFAULT_BROADCAST_HOUR, 0, 0, 0);
  return value;
}

function ScheduledTimes({
  items,
  onEdit,
}: {
  items: ScheduleCard[];
  onEdit: () => void;
}) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [selectedShow, setSelectedShow] = useState<ScheduleCard | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  return (
    <section className="border-border bg-background-secondary/40 overflow-hidden rounded-xl border shadow-sm">
      <header className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon size={18} className="text-primary" aria-hidden />
          <h2 className="font-display font-bold">Your next broadcasts</h2>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="border-border flex gap-1 rounded-md border p-0.5"
            role="group"
            aria-label="Schedule view"
          >
            <Tooltip content="Card view" side="top">
              <Button
                size="icon-sm"
                variant="text"
                aria-label="Card view"
                aria-pressed={viewMode === 'cards'}
                className={
                  viewMode === 'cards' ? 'bg-primary/15 text-primary' : ''
                }
                onClick={() => setViewMode('cards')}
              >
                <CalendarDaysIcon size={14} aria-hidden />
              </Button>
            </Tooltip>
            <Tooltip content="List view" side="top">
              <Button
                size="icon-sm"
                variant="text"
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
                className={
                  viewMode === 'list' ? 'bg-primary/15 text-primary' : ''
                }
                onClick={() => setViewMode('list')}
              >
                <ListIcon size={14} aria-hidden />
              </Button>
            </Tooltip>
          </div>
          <span className="text-foreground-secondary text-xs">{timezone}</span>
        </div>
      </header>
      {items.length === 0 ? (
        <div className="px-4 py-5">
          <p className="text-sm font-medium">Nothing scheduled yet</p>
          <p className="text-foreground-secondary mt-1 text-xs">
            Pick a local date and time below to tell listeners when you return.
          </p>
        </div>
      ) : (
        <ol
          className={
            viewMode === 'list'
              ? 'divide-border divide-y'
              : 'bg-border grid gap-px sm:grid-cols-2 lg:grid-cols-3'
          }
        >
          {items
            .slice(0, viewMode === 'list' ? undefined : 3)
            .map((item, index) => (
              <li
                key={item.id}
                className={
                  viewMode === 'list'
                    ? 'bg-background p-3'
                    : 'bg-background p-4'
                }
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-primary text-xs font-bold tracking-wide uppercase">
                    {index === 0 ? 'Next' : `Upcoming ${index + 1}`}
                  </span>
                  <div className="flex items-center gap-2">
                    {item.visibility === 'FAN_ONLY' ? (
                      <span className="text-foreground-secondary text-[10px] uppercase">
                        Fans only
                      </span>
                    ) : null}
                    {index === 0 ? (
                      <Tooltip content="Edit next broadcast" side="top">
                        <Button
                          size="icon-sm"
                          variant="text"
                          aria-label="Edit next broadcast"
                          onClick={onEdit}
                        >
                          <PencilIcon size={14} aria-hidden />
                        </Button>
                      </Tooltip>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  className="text-primary block max-w-full truncate text-left text-sm font-semibold hover:underline"
                  onClick={() => setSelectedShow(item)}
                >
                  {item.title}
                </button>
                <div className="text-foreground-secondary mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDaysIcon size={13} aria-hidden />
                    {formatDate(item.startAt)}
                  </span>
                  <span className="text-foreground inline-flex items-center gap-1 font-medium">
                    <Clock3Icon size={13} aria-hidden />
                    {formatTimeRange(item.startAt, item.endAt)}
                  </span>
                </div>
                {item.location ? (
                  <p className="text-foreground-secondary mt-2 flex items-center gap-1 truncate text-xs">
                    <MapPinIcon size={13} aria-hidden />
                    {item.location}
                  </p>
                ) : null}
              </li>
            ))}
        </ol>
      )}
      <Dialog.Root
        isOpen={selectedShow !== null}
        onClose={() => setSelectedShow(null)}
        className="max-w-xl"
      >
        {selectedShow ? (
          <>
            <div className="border-border bg-background-secondary relative -mx-6 -mt-6 mb-5 h-40 overflow-hidden border-b">
              {selectedShow.backdropUrl || selectedShow.artworkUrl ? (
                <ImageReveal
                  src={
                    selectedShow.backdropUrl ?? selectedShow.artworkUrl ?? ''
                  }
                  alt=""
                  className="h-full w-full"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>
            <Dialog.Title>{selectedShow.title}</Dialog.Title>
            <Dialog.Description>
              {selectedShow.tagline ?? 'Upcoming broadcast'}
              {selectedShow.episodeNumber != null
                ? ` · Episode ${selectedShow.episodeNumber}`
                : ''}
            </Dialog.Description>
            <div className="mt-4 flex flex-col gap-4">
              {selectedShow.artworkUrl ? (
                <ImageReveal
                  src={selectedShow.artworkUrl}
                  alt=""
                  className="size-24 rounded-lg"
                />
              ) : null}
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-foreground-secondary block text-xs uppercase">
                    When
                  </span>
                  {formatDate(selectedShow.startAt)} at{' '}
                  {formatTimeRange(selectedShow.startAt, selectedShow.endAt)}
                </div>
                {selectedShow.location ? (
                  <div>
                    <span className="text-foreground-secondary block text-xs uppercase">
                      Location
                    </span>
                    {selectedShow.location}
                  </div>
                ) : null}
              </div>
              {selectedShow.description ? (
                <p className="text-foreground-secondary text-sm leading-relaxed">
                  {selectedShow.description}
                </p>
              ) : (
                <p className="text-foreground-secondary text-sm">
                  Show details will appear here once the show has a description.
                </p>
              )}
            </div>
            <Dialog.Actions>
              {selectedShow.showId ? (
                <Link
                  to="/studio/shows/$id"
                  params={{ id: selectedShow.showId }}
                  onClick={() => setSelectedShow(null)}
                >
                  <Button variant="secondary">Open show</Button>
                </Link>
              ) : null}
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Actions>
          </>
        ) : null}
      </Dialog.Root>
    </section>
  );
}

function ScheduleAnalytics() {
  const [stats, setStats] = useState<
    Partial<Record<'1' | '7' | '30', StatsPlays>>
  >({});

  useEffect(() => {
    void Promise.all(
      ['1', '7', '30'].map((range) =>
        fetchStatsPlays(range as '1' | '7' | '30'),
      ),
    ).then((results) => {
      setStats({
        '1': results[0]?.data,
        '7': results[1]?.data,
        '30': results[2]?.data,
      });
    });
  }, []);

  return (
    <StudioPanel
      title="Broadcast analytics"
      description="Recent listening activity around your scheduled broadcasts."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {(['1', '7', '30'] as const).map((range) => (
          <div
            key={range}
            className="border-border bg-background-secondary/40 rounded-lg border p-3"
          >
            <p className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
              Last {range} day{range === '1' ? '' : 's'}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {stats[range]?.totalPlays.toLocaleString() ?? '—'}
            </p>
            <p className="text-foreground-secondary text-xs">plays</p>
          </div>
        ))}
      </div>
    </StudioPanel>
  );
}

export function StudioScheduleView() {
  const [schedule, setSchedule] = useState<ChannelSchedule | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingBroadcast[]>([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [shows, setShows] = useState<StudioShowSeries[]>([]);
  const [scheduledShows, setScheduledShows] = useState<ScheduledShow[]>([]);
  const [selectedShowId, setSelectedShowId] = useState('');
  const [showDescription, setShowDescription] = useState('');
  const [showCoverUrl, setShowCoverUrl] = useState('');
  const [showMode, setShowMode] = useState<'SINGLE' | 'SERIES'>('SERIES');
  const [showType, setShowType] = useState<ShowType>('LIVE_SET');
  const [durationHours, setDurationHours] = useState<1 | 2>(1);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [frequencyDays, setFrequencyDays] = useState<number[]>([]);
  const [venue, setVenue] = useState('');
  const [location, setLocation] = useState('');
  const [episodeArtworkUrl, setEpisodeArtworkUrl] = useState('');
  const [showTagline, setShowTagline] = useState('');
  const [showVisibility, setShowVisibility] = useState<'PUBLIC' | 'FAN_ONLY'>(
    'PUBLIC',
  );
  const [autoArchive, setAutoArchive] = useState(true);
  const [episodeNumberEnabled, setEpisodeNumberEnabled] = useState(true);
  const [nextEpisodeNumber, setNextEpisodeNumber] = useState(1);

  useEffect(() => {
    void Promise.all([
      fetchChannelSchedule(),
      fetchUpcomingBroadcasts(),
      fetchShowSchedule(),
    ]).then(([scheduleResult, upcomingResult, showScheduleResult]) => {
      const local = toLocalParts(scheduleResult.data.nextBroadcastAt);
      setSchedule(scheduleResult.data);
      setDate(local.date);
      setTime(local.time);
      setNote(scheduleResult.data.nextBroadcastNote ?? '');
      setShowType(scheduleResult.data.nextBroadcastShowType ?? 'LIVE_SET');
      setShowMode(scheduleResult.data.nextBroadcastMode ?? 'SERIES');
      setShowDescription(scheduleResult.data.nextBroadcastDescription ?? '');
      setShowCoverUrl(scheduleResult.data.nextBroadcastCoverUrl ?? '');
      setDurationHours(scheduleResult.data.nextBroadcastDurationHours ?? 1);
      setUpcoming(upcomingResult.data);
      setShows(showScheduleResult.data.series);
      setScheduledShows(showScheduleResult.data.scheduledShows);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (editorOpen) {
      void fetchShowSeries().then((result) => setShows(result.data));
    }
  }, [editorOpen]);

  const selectShow = (showId: string) => {
    setSelectedShowId(showId);
    const show = shows.find((candidate) => candidate.id === showId);
    if (!show) {
      return;
    }
    setNote(show.title);
    setShowDescription(show.description);
    setShowCoverUrl(show.coverUrl ?? '');
    setShowMode(show.mode ?? 'SERIES');
    setShowType(show.showType);
    setDurationHours(show.intervalHours);
    setShowTagline(show.scheduleNote ?? '');
    setShowVisibility(show.visibility ?? 'PUBLIC');
    setAutoArchive(show.autoArchive ?? true);
    setEpisodeNumberEnabled(show.episodeNumberEnabled ?? true);
    setNextEpisodeNumber(show.nextEpisodeNumber);
    setFrequencyDays(show.recurrenceDays ?? []);
    setDurationMinutes(
      (show.recurrenceDurationMin ?? show.intervalHours * 60) % 60,
    );
  };

  const toggleFrequencyDay = (day: number) => {
    setFrequencyDays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day],
    );
  };

  const saveRecurringSchedule = async () => {
    const selectedShow = shows.find((show) => show.id === selectedShowId);
    if (!selectedShow || !date || !time || frequencyDays.length === 0) {
      setMsg('Choose a show, date, time, and at least one weekday.');
      return;
    }
    setBusy(true);
    const recurrence = await updateShowSeriesRecurrence(selectedShow.id, {
      recurrenceEnabled: true,
      recurrenceDays: frequencyDays,
      recurrenceTimeOfDay: time,
      recurrenceDurationMin: durationHours * 60 + durationMinutes,
      recurrenceTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    setBusy(false);
    if (!recurrence.ok) {
      setMsg(recurrence.error);
      return;
    }
    setShows((current) =>
      current.map((show) =>
        show.id === recurrence.data.id ? recurrence.data : show,
      ),
    );
    setMsg('Recurring schedule saved. Upcoming episodes are being generated.');
  };

  const stopRecurringSchedule = async () => {
    if (!selectedShowId) {
      return;
    }
    setBusy(true);
    const result = await updateShowSeriesRecurrence(selectedShowId, {
      recurrenceEnabled: false,
      recurrenceDays: [],
      recurrenceTimeOfDay: null,
      recurrenceDurationMin: null,
      recurrenceTimezone: null,
    });
    setBusy(false);
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setShows((current) =>
      current.map((show) => (show.id === result.data.id ? result.data : show)),
    );
    setFrequencyDays([]);
    setMsg(
      'Recurring schedule stopped. Existing upcoming episodes remain scheduled.',
    );
  };

  const scheduleEpisode = async () => {
    if (!selectedShowId || !date || !time) {
      setMsg('Choose a show, date, and time.');
      return;
    }
    const startAt = fromLocalParts(date, time);
    if (!startAt) {
      setMsg('Choose a valid date and time.');
      return;
    }
    setBusy(true);
    const result = await scheduleShowEpisode(selectedShowId, {
      startAt,
      title: note.trim() || null,
      venue: venue.trim() || null,
      location: location.trim() || null,
      artworkUrl: episodeArtworkUrl.trim() || null,
    });
    setBusy(false);
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setScheduledShows((current) =>
      [...current, result.data].sort(
        (left, right) =>
          new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
      ),
    );
    setMsg(`${result.data.title} scheduled.`);
    setEditorOpen(false);
  };

  const cancelEpisode = async (id: string) => {
    const result = await cancelScheduledShow(id);
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setScheduledShows((current) => current.filter((show) => show.id !== id));
    setMsg('Scheduled show canceled.');
  };

  const scheduledTimes = useMemo<ScheduleCard[]>(() => {
    const rows: ScheduleCard[] = scheduledShows.map((item) => ({
      id: item.id,
      startAt: item.startAt,
      endAt: endAtFor(
        item.startAt,
        shows.find((show) => show.id === item.seriesId)?.intervalHours,
      ),
      title: item.title,
      location: item.venue ?? item.location,
      visibility: item.visibility,
      description: item.description,
      tagline: item.tagline,
      artworkUrl: item.artworkUrl,
      backdropUrl: shows.find((show) => show.id === item.seriesId)?.backdropUrl,
      showId: item.seriesId,
      episodeNumber: item.episodeNumber,
    }));
    rows.push(
      ...upcoming.map((item) => ({
        id: item.id,
        startAt: item.startAt,
        endAt: endAtFor(
          item.startAt,
          shows.find((show) => show.title === item.title)?.intervalHours,
        ),
        title: item.title,
        location: item.venue ?? item.location,
        visibility: item.visibility,
        description: shows.find((show) => show.title === item.title)
          ?.description,
        artworkUrl: shows.find((show) => show.title === item.title)?.coverUrl,
        backdropUrl: shows.find((show) => show.title === item.title)
          ?.backdropUrl,
        showId: shows.find((show) => show.title === item.title)?.id,
        episodeNumber: item.episodeNumber,
      })),
    );
    if (
      schedule?.nextBroadcastAt &&
      !rows.some(
        (item) =>
          new Date(item.startAt).getTime() ===
          new Date(schedule.nextBroadcastAt!).getTime(),
      )
    ) {
      rows.push({
        id: 'channel-next-broadcast',
        startAt: schedule.nextBroadcastAt,
        endAt: endAtFor(
          schedule.nextBroadcastAt,
          schedule.nextBroadcastDurationHours,
        ),
        title: schedule.nextBroadcastNote ?? 'Next live session',
      });
    }
    return rows.sort(
      (left, right) =>
        new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
    );
  }, [schedule, upcoming, scheduledShows, shows]);

  const setQuickDate = (value: Date) => {
    const local = toLocalParts(value.toISOString());
    setDate(local.date);
    setTime(local.time);
  };

  const openEditor = () => {
    if (schedule?.nextBroadcastAt) {
      const local = toLocalParts(schedule.nextBroadcastAt);
      setDate(local.date);
      setTime(local.time);
      setNote(schedule.nextBroadcastNote ?? '');
      setShowType(schedule.nextBroadcastShowType ?? 'LIVE_SET');
      setShowMode(schedule.nextBroadcastMode ?? 'SERIES');
      setShowDescription(schedule.nextBroadcastDescription ?? '');
      setShowCoverUrl(schedule.nextBroadcastCoverUrl ?? '');
      setDurationHours(schedule.nextBroadcastDurationHours ?? 1);
      setSelectedShowId(
        schedule.nextBroadcastShowId ??
          shows.find((show) => show.title === schedule.nextBroadcastNote)?.id ??
          '',
      );
    }
    setMsg(null);
    setEditorOpen(true);
  };

  const saveSchedule = async () => {
    const nextBroadcastAt = fromLocalParts(date, time);
    if ((date || time) && !nextBroadcastAt) {
      setMsg('Choose both a date and time.');
      return;
    }
    setBusy(true);
    setMsg(null);
    let selectedShow = shows.find((show) => show.id === selectedShowId);
    if (!selectedShow) {
      if (!note.trim()) {
        setBusy(false);
        setMsg('Enter a show name to create a new show.');
        return;
      }
      const created = await createShowSeries({
        title: note.trim(),
        description: showDescription.trim(),
        coverUrl: showCoverUrl.trim() || null,
        mode: showMode,
        showType,
        intervalHours: durationHours,
        scheduleNote: showTagline.trim() || null,
        visibility: showVisibility,
        autoArchive,
        episodeNumberEnabled,
        nextEpisodeNumber,
      });
      if (!created.ok) {
        setBusy(false);
        setMsg(created.error);
        return;
      }
      selectedShow = created.data;
      setShows((current) => [created.data, ...current]);
    }
    const result = await patchChannelSchedule({
      nextBroadcastAt,
      nextBroadcastNote: selectedShow.title,
      nextBroadcastShowId: selectedShow.id,
      nextBroadcastShowType: selectedShow.showType,
      nextBroadcastMode: selectedShow.mode ?? showMode,
      nextBroadcastDescription: showDescription.trim() || null,
      nextBroadcastCoverUrl: showCoverUrl.trim() || null,
      nextBroadcastDurationHours: durationHours,
    });
    setBusy(false);
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setSchedule(result.data);
    setMsg('Next broadcast saved.');
    setSelectedShowId(selectedShow.id);
    setEditorOpen(false);
  };

  const tomorrow = new Date(Date.now() + MILLISECONDS_PER_DAY);
  tomorrow.setHours(DEFAULT_BROADCAST_HOUR, 0, 0, 0);
  const minimumDate = toLocalParts(new Date().toISOString()).date;

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/schedule" />
        <ViewShell
          title="Broadcast"
          subtitle="Live shows and between-broadcast play."
          classes={{ root: 'px-0 pt-0' }}
        >
          <div className="mb-4">
            <Tooltip content="Add next broadcast" side="top">
              <Button
                size="icon-sm"
                aria-label="Add next broadcast"
                onClick={() => setEditorOpen(true)}
              >
                <PlusIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
          </div>

          <ScheduledTimes items={scheduledTimes} onEdit={openEditor} />

          {scheduledShows.length > 0 ? (
            <StudioPanel
              title="Scheduled show episodes"
              description="One-off and recurring episodes generated from your shows."
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
                        onClick={() => void cancelEpisode(show.id)}
                      >
                        Cancel
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </StudioPanel>
          ) : null}

          <ScheduleAnalytics />

          <ChannelRadioPlaylistPanel />

          {msg && (
            <p className="text-foreground-secondary text-sm" role="status">
              {msg}
            </p>
          )}

          <Dialog.Root
            isOpen={editorOpen}
            onClose={() => setEditorOpen(false)}
            className="max-w-2xl"
          >
            <Dialog.Title>Next planned broadcast</Dialog.Title>
            <Dialog.Description>
              This is shown on your public channel so listeners know when to
              return.
            </Dialog.Description>
            <div className="mt-4 flex flex-col gap-5">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
                <Input
                  type="date"
                  label="Date"
                  min={minimumDate}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
                <Input
                  type="time"
                  label="Local time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-foreground-secondary text-xs uppercase">
                  Quick pick
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setQuickDate(tomorrow)}
                >
                  Tomorrow at {pad(DEFAULT_BROADCAST_HOUR)}:00
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setQuickDate(nextFriday())}
                >
                  Next Friday
                </Button>
                {(date || time) && (
                  <Tooltip content="Clear planned time" side="top">
                    <Button
                      size="icon-sm"
                      variant="text"
                      aria-label="Clear planned time"
                      onClick={() => {
                        setDate('');
                        setTime('');
                      }}
                    >
                      <XIcon size={15} aria-hidden />
                    </Button>
                  </Tooltip>
                )}
              </div>

              <BroadcastDetailsFields
                values={
                  {
                    title: note,
                    description: showDescription,
                    coverUrl: showCoverUrl,
                    mode: showMode,
                    showType,
                    durationHours,
                  } satisfies BroadcastDetailsValues
                }
                shows={shows}
                selectedShowId={selectedShowId}
                episodeNumber={
                  shows.find((show) => show.id === selectedShowId)
                    ?.nextEpisodeNumber ?? 1
                }
                onShowChange={selectShow}
                onChange={(values) => {
                  setNote(values.title);
                  setShowDescription(values.description);
                  setShowCoverUrl(values.coverUrl);
                  setShowMode(values.mode);
                  setShowType(values.showType);
                  setDurationHours(values.durationHours);
                }}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Show tagline"
                  value={showTagline}
                  onChange={(event) => setShowTagline(event.target.value)}
                  placeholder="Optional subtitle"
                />
                <Select
                  label="Visibility"
                  value={showVisibility}
                  onValueChange={(value) =>
                    setShowVisibility(value as 'PUBLIC' | 'FAN_ONLY')
                  }
                  options={[
                    { id: 'PUBLIC', label: 'Public' },
                    { id: 'FAN_ONLY', label: 'Fans only' },
                  ]}
                />
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-foreground-secondary">
                    Publish recordings automatically
                  </span>
                  <Toggle
                    label="Publish recordings automatically"
                    checked={autoArchive}
                    onChange={setAutoArchive}
                  />
                </div>
                {showMode === 'SERIES' ? (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-foreground-secondary">
                      Number episodes automatically
                    </span>
                    <Toggle
                      label="Number episodes automatically"
                      checked={episodeNumberEnabled}
                      onChange={setEpisodeNumberEnabled}
                    />
                  </div>
                ) : null}
                {showMode === 'SERIES' && episodeNumberEnabled ? (
                  <Input
                    type="number"
                    variant="number"
                    label="Start episode"
                    min={1}
                    value={nextEpisodeNumber}
                    onChange={(event) =>
                      setNextEpisodeNumber(
                        Math.max(1, Number(event.target.value)),
                      )
                    }
                    className="w-24"
                  />
                ) : null}
              </div>

              <div className="border-border flex flex-col gap-2 border-t pt-3">
                <span className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
                  Weekly recurrence
                </span>
                <div className="flex flex-wrap gap-1">
                  {FREQUENCY_DAY_ORDER.map((day) => (
                    <Button
                      key={day}
                      type="button"
                      size="sm"
                      variant={frequencyDays.includes(day) ? undefined : 'text'}
                      aria-pressed={frequencyDays.includes(day)}
                      onClick={() => toggleFrequencyDay(day)}
                    >
                      Every {WEEKDAY_LABELS[day]}
                    </Button>
                  ))}
                </div>
                <p className="text-foreground-secondary text-xs">
                  Select days to generate episodes automatically; leave empty
                  for a one-off show.
                </p>
                {shows.find((show) => show.id === selectedShowId)
                  ?.recurrenceEnabled ? (
                  <Button
                    size="sm"
                    variant="text"
                    disabled={busy}
                    onClick={() => void stopRecurringSchedule()}
                  >
                    Stop recurring schedule
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="text"
                  disabled={
                    busy ||
                    !selectedShowId ||
                    !date ||
                    !time ||
                    frequencyDays.length === 0
                  }
                  onClick={() => void saveRecurringSchedule()}
                >
                  Save weekly schedule
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Venue"
                  value={venue}
                  onChange={(event) => setVenue(event.target.value)}
                  placeholder="Optional venue"
                />
                <Input
                  label="Location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="City, country, or online"
                />
                <div className="sm:col-span-2">
                  <ImageUploadField
                    label="Episode artwork"
                    description="JPEG, PNG, WebP, or GIF"
                    value={episodeArtworkUrl}
                    onChange={setEpisodeArtworkUrl}
                  />
                </div>
              </div>

              <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <p className="text-foreground-secondary text-xs">
                  {date && time
                    ? `${formatDate(fromLocalParts(date, time)!)} at ${formatTime(fromLocalParts(date, time)!)}`
                    : 'No next broadcast selected'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Select
                    id="episode-duration"
                    label="Minutes"
                    value={String(durationMinutes)}
                    options={[0, 15, 30, 45].map((minutes) => ({
                      id: String(minutes),
                      label: String(minutes),
                    }))}
                    onValueChange={(value) => setDurationMinutes(Number(value))}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy || !selectedShowId || !date || !time}
                    onClick={() => void scheduleEpisode()}
                  >
                    Schedule episode
                  </Button>
                  <SaveButton
                    disabled={loading || !date || !time}
                    saving={busy}
                    label="Save next broadcast"
                    onClick={() => void saveSchedule()}
                  />
                </div>
              </div>
            </div>
            <Dialog.Actions>
              <Dialog.Close>Cancel</Dialog.Close>
            </Dialog.Actions>
          </Dialog.Root>
        </ViewShell>
      </div>
    </StudioGate>
  );
}
