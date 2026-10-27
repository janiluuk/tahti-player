import type {
  ScheduledShow,
  ShowMode,
  ShowType,
  StudioShowSeries,
} from '../../../api/shows';
import type {
  ChannelSchedule,
  UpcomingBroadcast,
} from '../../../api/studio-extras';
import { toLocalParts } from './schedule-helpers';

export type BroadcastFields = {
  title: string;
  description: string;
  coverUrl: string;
  mode: ShowMode;
  showType: ShowType;
  durationHours: 1 | 2;
};

export type ScheduleFormFields = {
  date: string;
  time: string;
  note: string;
  selectedShowId: string;
  showDescription: string;
  showCoverUrl: string;
  showMode: ShowMode;
  showType: ShowType;
  durationHours: 1 | 2;
  durationMinutes: number;
  frequencyDays: number[];
  venue: string;
  location: string;
  episodeArtworkUrl: string;
  showTagline: string;
  showScheduleNote: string;
  showVisibility: 'PUBLIC' | 'FAN_ONLY';
  autoPublish: boolean;
  episodeNumberEnabled: boolean;
  nextEpisodeNumber: number;
};

export type ScheduleFormState = ScheduleFormFields & {
  schedule: ChannelSchedule | null;
  upcoming: UpcomingBroadcast[];
  shows: StudioShowSeries[];
  scheduledShows: ScheduledShow[];
  busy: boolean;
  loading: boolean;
  editorOpen: boolean;
  pendingCancel: ScheduledShow | null;
};

type SettableKey =
  keyof ScheduleFormFields | 'busy' | 'editorOpen' | 'pendingCancel';

export type ScheduleFormAction =
  | {
      [Key in SettableKey]: {
        type: 'set';
        key: Key;
        value: ScheduleFormState[Key];
      };
    }[SettableKey]
  | {
      type: 'loaded';
      schedule: ChannelSchedule;
      upcoming: UpcomingBroadcast[];
      shows: StudioShowSeries[];
      scheduledShows: ScheduledShow[];
    }
  | { type: 'loadFailed' }
  | { type: 'showsFetched'; shows: StudioShowSeries[] }
  | { type: 'showPicked'; showId: string }
  | { type: 'showCreated'; show: StudioShowSeries }
  | { type: 'showUpdated'; show: StudioShowSeries }
  | { type: 'recurrenceStopped'; show: StudioShowSeries }
  | { type: 'episodeScheduled'; episode: ScheduledShow }
  | { type: 'episodeCanceled'; id: string }
  | { type: 'quickDatePicked'; at: Date }
  | { type: 'editorOpened' }
  | { type: 'scheduleSaved'; schedule: ChannelSchedule; showId: string }
  | { type: 'broadcastFieldsChanged'; values: BroadcastFields };

export const initialScheduleFormState: ScheduleFormState = {
  schedule: null,
  upcoming: [],
  shows: [],
  scheduledShows: [],
  busy: false,
  loading: true,
  editorOpen: false,
  pendingCancel: null,
  date: '',
  time: '',
  note: '',
  selectedShowId: '',
  showDescription: '',
  showCoverUrl: '',
  showMode: 'SERIES',
  showType: 'LIVE_SET',
  durationHours: 1,
  durationMinutes: 0,
  frequencyDays: [],
  venue: '',
  location: '',
  episodeArtworkUrl: '',
  showTagline: '',
  showScheduleNote: '',
  showVisibility: 'PUBLIC',
  autoPublish: true,
  episodeNumberEnabled: true,
  nextEpisodeNumber: 1,
};

const MINUTES_PER_HOUR = 60;

function fieldsFromSchedule(schedule: ChannelSchedule) {
  const local = toLocalParts(schedule.nextBroadcastAt);
  return {
    date: local.date,
    time: local.time,
    note: schedule.nextBroadcastNote ?? '',
    showType: schedule.nextBroadcastShowType ?? 'LIVE_SET',
    showMode: schedule.nextBroadcastMode ?? 'SERIES',
    showDescription: schedule.nextBroadcastDescription ?? '',
    showCoverUrl: schedule.nextBroadcastCoverUrl ?? '',
    durationHours: schedule.nextBroadcastDurationHours ?? 1,
  } satisfies Partial<ScheduleFormFields>;
}

function replaceShow(shows: StudioShowSeries[], next: StudioShowSeries) {
  return shows.map((show) => (show.id === next.id ? next : show));
}

function byStart(left: ScheduledShow, right: ScheduledShow) {
  return new Date(left.startAt).getTime() - new Date(right.startAt).getTime();
}

export function scheduleFormReducer(
  state: ScheduleFormState,
  action: ScheduleFormAction,
): ScheduleFormState {
  switch (action.type) {
    case 'set':
      return { ...state, [action.key]: action.value };
    case 'loaded':
      return {
        ...state,
        ...fieldsFromSchedule(action.schedule),
        schedule: action.schedule,
        upcoming: action.upcoming,
        shows: action.shows,
        scheduledShows: action.scheduledShows,
        loading: false,
      };
    case 'loadFailed':
      return { ...state, loading: false };
    case 'showsFetched':
      return { ...state, shows: action.shows };
    case 'showPicked': {
      const show = state.shows.find(
        (candidate) => candidate.id === action.showId,
      );
      if (!show) {
        return { ...state, selectedShowId: action.showId };
      }
      return {
        ...state,
        selectedShowId: action.showId,
        note: show.title,
        showDescription: show.description,
        showCoverUrl: show.coverUrl ?? '',
        showMode: show.mode ?? 'SERIES',
        showType: show.showType,
        durationHours: show.intervalHours,
        showTagline: show.tagline ?? '',
        showScheduleNote: show.scheduleNote ?? '',
        showVisibility: show.visibility ?? 'PUBLIC',
        autoPublish: show.autoPublish ?? true,
        episodeNumberEnabled: show.episodeNumberEnabled ?? true,
        nextEpisodeNumber: show.nextEpisodeNumber,
        frequencyDays: show.recurrenceDays ?? [],
        durationMinutes:
          (show.recurrenceDurationMin ??
            show.intervalHours * MINUTES_PER_HOUR) % MINUTES_PER_HOUR,
      };
    }
    case 'showCreated':
      return { ...state, shows: [action.show, ...state.shows] };
    case 'showUpdated':
      return { ...state, shows: replaceShow(state.shows, action.show) };
    case 'recurrenceStopped':
      return {
        ...state,
        shows: replaceShow(state.shows, action.show),
        frequencyDays: [],
      };
    case 'episodeScheduled':
      return {
        ...state,
        scheduledShows: [...state.scheduledShows, action.episode].sort(byStart),
        editorOpen: false,
      };
    case 'episodeCanceled':
      return {
        ...state,
        scheduledShows: state.scheduledShows.filter(
          (show) => show.id !== action.id,
        ),
      };
    case 'quickDatePicked': {
      const local = toLocalParts(action.at.toISOString());
      return { ...state, date: local.date, time: local.time };
    }
    case 'editorOpened': {
      const { schedule } = state;
      if (!schedule?.nextBroadcastAt) {
        return {
          ...state,
          date: '',
          time: '',
          note: '',
          showDescription: '',
          showCoverUrl: '',
          selectedShowId: '',
          editorOpen: true,
        };
      }
      return {
        ...state,
        ...fieldsFromSchedule(schedule),
        selectedShowId:
          schedule.nextBroadcastShowId ??
          state.shows.find((show) => show.title === schedule.nextBroadcastNote)
            ?.id ??
          '',
        editorOpen: true,
      };
    }
    case 'scheduleSaved':
      return {
        ...state,
        schedule: action.schedule,
        selectedShowId: action.showId,
        editorOpen: false,
      };
    case 'broadcastFieldsChanged':
      return {
        ...state,
        note: action.values.title,
        showDescription: action.values.description,
        showCoverUrl: action.values.coverUrl,
        showMode: action.values.mode,
        showType: action.values.showType,
        durationHours: action.values.durationHours,
      };
  }
}
