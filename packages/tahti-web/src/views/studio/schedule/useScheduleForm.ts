import { useEffect, useMemo, useReducer } from 'react';
import { toast } from 'sonner';

import {
  cancelScheduledShow,
  createShowSeries,
  fetchShowSchedule,
  fetchShowSeries,
  scheduleShowEpisode,
  updateShowSeriesRecurrence,
} from '../../../api/shows';
import {
  fetchChannelSchedule,
  fetchUpcomingBroadcasts,
  patchChannelSchedule,
} from '../../../api/studio-extras';
import {
  endAtFor,
  fromLocalParts,
  type ScheduleCard,
} from './schedule-helpers';
import {
  initialScheduleFormState,
  scheduleFormReducer,
  type BroadcastFields,
  type ScheduleFormAction,
  type ScheduleFormState,
} from './scheduleFormReducer';

/** All state and actions behind the Schedule view's broadcast/episode editor. */
export function useScheduleForm() {
  const [state, dispatch] = useReducer(
    scheduleFormReducer,
    initialScheduleFormState,
  );
  const {
    schedule,
    upcoming,
    shows,
    scheduledShows,
    editorOpen,
    selectedShowId,
    date,
    time,
    note,
    venue,
    location,
    episodeArtworkUrl,
    frequencyDays,
    durationHours,
    durationMinutes,
    showDescription,
    showCoverUrl,
    showMode,
    showType,
    showTagline,
    showScheduleNote,
    showVisibility,
    autoPublish,
    episodeNumberEnabled,
    nextEpisodeNumber,
  } = state;

  const setters = useMemo(() => {
    const setter =
      <Key extends keyof ScheduleFormState>(key: Key) =>
      (value: ScheduleFormState[Key]) =>
        dispatch({ type: 'set', key, value } as ScheduleFormAction);
    return {
      setDate: setter('date'),
      setTime: setter('time'),
      setBusy: setter('busy'),
      setEditorOpen: setter('editorOpen'),
      setDurationMinutes: setter('durationMinutes'),
      setFrequencyDays: setter('frequencyDays'),
      setVenue: setter('venue'),
      setLocation: setter('location'),
      setEpisodeArtworkUrl: setter('episodeArtworkUrl'),
      setShowTagline: setter('showTagline'),
      setShowScheduleNote: setter('showScheduleNote'),
      setShowVisibility: setter('showVisibility'),
      setAutoPublish: setter('autoPublish'),
      setPendingCancel: setter('pendingCancel'),
      setEpisodeNumberEnabled: setter('episodeNumberEnabled'),
      setNextEpisodeNumber: setter('nextEpisodeNumber'),
    };
  }, []);
  const { setBusy, ...publicSetters } = setters;

  useEffect(() => {
    Promise.all([
      fetchChannelSchedule(),
      fetchUpcomingBroadcasts(),
      fetchShowSchedule(),
    ])
      .then(([scheduleResult, upcomingResult, showScheduleResult]) =>
        dispatch({
          type: 'loaded',
          schedule: scheduleResult.data,
          upcoming: upcomingResult.data,
          shows: showScheduleResult.data.series,
          scheduledShows: showScheduleResult.data.scheduledShows,
        }),
      )
      .catch(() => {
        toast.error('Could not load your schedule.');
        dispatch({ type: 'loadFailed' });
      });
  }, []);

  useEffect(() => {
    if (editorOpen) {
      void fetchShowSeries().then((result) =>
        dispatch({ type: 'showsFetched', shows: result.data }),
      );
    }
  }, [editorOpen]);

  const selectShow = (showId: string) =>
    dispatch({ type: 'showPicked', showId });

  const saveRecurringSchedule = async () => {
    const selectedShow = shows.find((show) => show.id === selectedShowId);
    if (!selectedShow || !date || !time || frequencyDays.length === 0) {
      toast.error('Choose a show, date, time, and at least one weekday.');
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
      toast.error(recurrence.error);
      return;
    }
    dispatch({ type: 'showUpdated', show: recurrence.data });
    toast.success(
      'Recurring schedule saved. Upcoming episodes are being generated.',
    );
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
      toast.error(result.error);
      return;
    }
    dispatch({ type: 'recurrenceStopped', show: result.data });
    toast.success(
      'Recurring schedule stopped. Existing upcoming episodes remain scheduled.',
    );
  };

  const scheduleEpisode = async () => {
    if (!selectedShowId || !date || !time) {
      toast.error('Choose a show, date, and time.');
      return;
    }
    const startAt = fromLocalParts(date, time);
    if (!startAt) {
      toast.error('Choose a valid date and time.');
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
      toast.error(result.error);
      return;
    }
    dispatch({ type: 'episodeScheduled', episode: result.data });
    toast.success(`${result.data.title} scheduled.`);
  };

  const cancelEpisode = async (id: string) => {
    try {
      const result = await cancelScheduledShow(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      dispatch({ type: 'episodeCanceled', id });
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

  const setQuickDate = (value: Date) =>
    dispatch({ type: 'quickDatePicked', at: value });

  const openEditor = () => dispatch({ type: 'editorOpened' });

  const saveSchedule = async () => {
    const nextBroadcastAt = fromLocalParts(date, time);
    if ((date || time) && !nextBroadcastAt) {
      toast.error('Choose both a date and time.');
      return;
    }
    setBusy(true);
    let selectedShow = shows.find((show) => show.id === selectedShowId);
    if (!selectedShow) {
      if (!note.trim()) {
        setBusy(false);
        toast.error('Enter a show name to create a new show.');
        return;
      }
      const created = await createShowSeries({
        title: note.trim(),
        description: showDescription.trim(),
        coverUrl: showCoverUrl.trim() || null,
        mode: showMode,
        showType,
        intervalHours: durationHours,
        tagline: showTagline.trim() || null,
        scheduleNote: showScheduleNote.trim() || null,
        visibility: showVisibility,
        autoPublish,
        episodeNumberEnabled,
        nextEpisodeNumber,
      });
      if (!created.ok) {
        setBusy(false);
        toast.error(created.error);
        return;
      }
      selectedShow = created.data;
      dispatch({ type: 'showCreated', show: created.data });
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
      toast.error(result.error);
      return;
    }
    toast.success('Next broadcast saved.');
    dispatch({
      type: 'scheduleSaved',
      schedule: result.data,
      showId: selectedShow.id,
    });
  };

  return {
    ...state,
    ...publicSetters,
    selectShow,
    saveRecurringSchedule,
    stopRecurringSchedule,
    scheduleEpisode,
    cancelEpisode,
    scheduledTimes,
    setQuickDate,
    openEditor,
    saveSchedule,
    onBroadcastFieldsChange: (values: BroadcastFields) =>
      dispatch({ type: 'broadcastFieldsChanged', values }),
  };
}

export type ScheduleForm = ReturnType<typeof useScheduleForm>;
