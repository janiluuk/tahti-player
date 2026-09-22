import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

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
} from '../../../api/shows';
import {
  fetchChannelSchedule,
  fetchUpcomingBroadcasts,
  patchChannelSchedule,
  type ChannelSchedule,
  type UpcomingBroadcast,
} from '../../../api/studio-extras';
import {
  endAtFor,
  fromLocalParts,
  toLocalParts,
  type ScheduleCard,
} from './schedule-helpers';

/** All state and actions behind the Schedule view's broadcast/episode editor. */
export function useScheduleForm() {
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
    // Built once, not scanned per field per item.
    const showsById = new Map(shows.map((show) => [show.id, show]));
    const rows: ScheduleCard[] = scheduledShows.map((item) => ({
      id: item.id,
      startAt: item.startAt,
      endAt: endAtFor(
        item.startAt,
        showsById.get(item.seriesId)?.intervalHours,
      ),
      title: item.title,
      location: item.venue ?? item.location,
      visibility: item.visibility,
      description: item.description,
      tagline: item.tagline,
      artworkUrl: item.artworkUrl,
      backdropUrl: showsById.get(item.seriesId)?.backdropUrl,
      showId: item.seriesId,
      episodeNumber: item.episodeNumber,
    }));
    rows.push(
      ...upcoming.map((item) => ({
        id: item.id,
        startAt: item.startAt,
        endAt: endAtFor(
          item.startAt,
          showsById.get(item.showId)?.intervalHours,
        ),
        title: item.title,
        location: item.venue ?? item.location,
        visibility: item.visibility,
        description: showsById.get(item.showId)?.description,
        artworkUrl: showsById.get(item.showId)?.coverUrl,
        backdropUrl: showsById.get(item.showId)?.backdropUrl,
        showId: showsById.get(item.showId)?.id ?? item.showId,
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

  return {
    schedule,
    date,
    setDate,
    time,
    setTime,
    note,
    msg,
    busy,
    loading,
    editorOpen,
    setEditorOpen,
    shows,
    scheduledShows,
    selectedShowId,
    showDescription,
    showCoverUrl,
    showMode,
    showType,
    durationHours,
    durationMinutes,
    setDurationMinutes,
    frequencyDays,
    setFrequencyDays,
    venue,
    setVenue,
    location,
    setLocation,
    episodeArtworkUrl,
    setEpisodeArtworkUrl,
    showTagline,
    setShowTagline,
    showVisibility,
    setShowVisibility,
    autoPublish,
    setAutoPublish,
    pendingCancel,
    setPendingCancel,
    episodeNumberEnabled,
    setEpisodeNumberEnabled,
    nextEpisodeNumber,
    setNextEpisodeNumber,
    selectShow,
    saveRecurringSchedule,
    stopRecurringSchedule,
    scheduleEpisode,
    cancelEpisode,
    scheduledTimes,
    setQuickDate,
    openEditor,
    saveSchedule,
    onBroadcastFieldsChange: (values: {
      title: string;
      description: string;
      coverUrl: string;
      mode: 'SINGLE' | 'SERIES';
      showType: ShowType;
      durationHours: 1 | 2;
    }) => {
      setNote(values.title);
      setShowDescription(values.description);
      setShowCoverUrl(values.coverUrl);
      setShowMode(values.mode);
      setShowType(values.showType);
      setDurationHours(values.durationHours);
    },
  };
}

export type ScheduleForm = ReturnType<typeof useScheduleForm>;
