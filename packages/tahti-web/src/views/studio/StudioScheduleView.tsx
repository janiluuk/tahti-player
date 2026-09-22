import { PlusIcon, XIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  FilterChips,
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
  fetchUpcomingBroadcasts,
  patchChannelSchedule,
  type ChannelSchedule,
  type UpcomingBroadcast,
} from '../../api/studio-extras';
import {
  BroadcastDetailsFields,
  type BroadcastDetailsValues,
} from '../../components/BroadcastDetailsFields';
import { ChannelRadioPlaylistPanel } from '../../components/ChannelRadioPlaylistPanel';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ImageUploadField } from '../../components/ImageUploadField';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import {
  DEFAULT_BROADCAST_HOUR,
  endAtFor,
  formatDate,
  formatTime,
  formatTimeRange,
  FREQUENCY_DAY_ORDER,
  fromLocalParts,
  MILLISECONDS_PER_DAY,
  nextFriday,
  pad,
  ScheduleCard,
  toLocalParts,
  WEEKDAY_LABELS,
} from './schedule/schedule-helpers';
import { ScheduleAnalytics } from './schedule/ScheduleAnalytics';
import { ScheduledTimes } from './schedule/ScheduledTimes';

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
  const [autoPublish, setAutoPublish] = useState(true);
  const [pendingCancel, setPendingCancel] = useState<ScheduledShow | null>(
    null,
  );
  const [episodeNumberEnabled, setEpisodeNumberEnabled] = useState(true);
  const [nextEpisodeNumber, setNextEpisodeNumber] = useState(1);

  useEffect(() => {
    Promise.all([
      fetchChannelSchedule(),
      fetchUpcomingBroadcasts(),
      fetchShowSchedule(),
    ])
      .then(([scheduleResult, upcomingResult, showScheduleResult]) => {
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
      })
      .catch(() => toast.error('Could not load your schedule.'))
      .finally(() => setLoading(false));
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
    setAutoPublish(show.autoPublish ?? true);
    setEpisodeNumberEnabled(show.episodeNumberEnabled ?? true);
    setNextEpisodeNumber(show.nextEpisodeNumber);
    setFrequencyDays(show.recurrenceDays ?? []);
    setDurationMinutes(
      (show.recurrenceDurationMin ?? show.intervalHours * 60) % 60,
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
    try {
      const result = await cancelScheduledShow(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setScheduledShows((current) => current.filter((show) => show.id !== id));
      toast.success('Scheduled show canceled.');
    } catch {
      toast.error('Could not cancel the scheduled show.');
    }
  };

  const scheduledTimes = useMemo<ScheduleCard[]>(() => {
    // Upcoming broadcasts carry no show id from the API, so link them to a
    // show by title (built once, not scanned per field per item).
    const showByTitle = new Map(shows.map((show) => [show.title, show]));
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
          showByTitle.get(item.title)?.intervalHours,
        ),
        title: item.title,
        location: item.venue ?? item.location,
        visibility: item.visibility,
        description: showByTitle.get(item.title)?.description,
        artworkUrl: showByTitle.get(item.title)?.coverUrl,
        backdropUrl: showByTitle.get(item.title)?.backdropUrl,
        showId: showByTitle.get(item.title)?.id,
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
    if (!schedule?.nextBroadcastAt) {
      setDate('');
      setTime('');
      setNote('');
      setShowDescription('');
      setShowCoverUrl('');
      setSelectedShowId('');
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
        autoPublish,
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
        <ViewShell
          title="Schedule"
          classes={{ root: 'px-0 pt-0' }}
          actions={
            <Tooltip content="Add next broadcast" side="top">
              <Button
                size="icon-sm"
                aria-label="Add next broadcast"
                onClick={() => setEditorOpen(true)}
              >
                <PlusIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
          }
        >
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
                        onClick={() => setPendingCancel(show)}
                      >
                        Cancel
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </StudioPanel>
          ) : null}

          <ConfirmDialog
            isOpen={pendingCancel !== null}
            title={`Cancel "${pendingCancel?.title ?? 'this show'}"?`}
            description="The scheduled episode is removed from your schedule and the public channel."
            confirmLabel="Cancel episode"
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
                {selectedShowId ? (
                  <p className="text-foreground-secondary text-xs sm:col-span-2">
                    Tagline, visibility, recording and numbering are the
                    show&apos;s own settings — change them on its show page.
                    They apply here only when you create a new show.
                  </p>
                ) : null}
                <Input
                  label="Show tagline"
                  disabled={Boolean(selectedShowId)}
                  value={showTagline}
                  onChange={(event) => setShowTagline(event.target.value)}
                  placeholder="Optional subtitle"
                />
                <Select
                  label="Visibility"
                  disabled={Boolean(selectedShowId)}
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
                    disabled={Boolean(selectedShowId)}
                    checked={autoPublish}
                    onChange={setAutoPublish}
                  />
                </div>
                {showMode === 'SERIES' ? (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-foreground-secondary">
                      Number episodes automatically
                    </span>
                    <Toggle
                      label="Number episodes automatically"
                      disabled={Boolean(selectedShowId)}
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
                    disabled={Boolean(selectedShowId)}
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
                <FilterChips
                  multiple
                  items={FREQUENCY_DAY_ORDER.map((day) => ({
                    id: String(day),
                    label: `Every ${WEEKDAY_LABELS[day]}`,
                  }))}
                  selected={frequencyDays.map(String)}
                  onChange={(ids) => setFrequencyDays(ids.map(Number))}
                  aria-label="Weekly recurrence"
                />
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
                    <XIcon size={14} aria-hidden className="mr-1.5" />
                    Stop recurring schedule
                  </Button>
                ) : null}
                <Select
                  id="episode-duration"
                  label="Duration: extra minutes"
                  value={String(durationMinutes)}
                  options={[0, 15, 30, 45].map((minutes) => ({
                    id: String(minutes),
                    label: String(minutes),
                  }))}
                  onValueChange={(value) => setDurationMinutes(Number(value))}
                />
                <SaveButton
                  disabled={
                    !selectedShowId ||
                    !date ||
                    !time ||
                    frequencyDays.length === 0
                  }
                  saving={busy}
                  label="Save weekly schedule"
                  onClick={() => void saveRecurringSchedule()}
                />
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
