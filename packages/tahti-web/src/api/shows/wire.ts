import {
  type EpisodeStatus,
  type ScheduledShow,
  type ShowMode,
  type ShowType,
  type StudioEpisode,
  type StudioShowSeries,
} from './types';

export type WireLiveShowSeries = {
  id: string;
  name: string;
  description: string | null;
  artworkUrl: string | null;
  backdropUrl?: string | null;
  mode?: ShowMode;
  showType: ShowType;
  nextEpisodeNumber: number;
  intervalHours: 1 | 2;
  scheduleNote: string | null;
  visibility?: 'PUBLIC' | 'FAN_ONLY';
  autoPublish?: boolean;
  episodeNumberEnabled?: boolean;
  recurrenceEnabled?: boolean;
  recurrenceDays?: number[];
  recurrenceTimeOfDay?: string | null;
  recurrenceDurationMin?: number | null;
  recurrenceTimezone?: string | null;
  recurrenceHorizonDays?: number;
  createdAt: string;
};

export type WireScheduledShow = Omit<ScheduledShow, 'showType'> & {
  showType: ShowType;
};

export type WireLiveShowEpisode = {
  id: string;
  seriesId: string;
  episodeNumber: number | null;
  title: string;
  description: string | null;
  artworkUrl: string | null;
  status: EpisodeStatus;
  source: 'UPLOAD' | 'BROADCAST';
  soundId: string | null;
  radioSlotBookingId: string | null;
  createdAt: string;
};

export function seriesFromWire(w: WireLiveShowSeries): StudioShowSeries {
  return {
    id: w.id,
    title: w.name,
    description: w.description ?? '',
    coverUrl: w.artworkUrl,
    backdropUrl: w.backdropUrl ?? null,
    mode: w.mode ?? 'SERIES',
    showType: w.showType,
    nextEpisodeNumber: w.nextEpisodeNumber,
    intervalHours: w.intervalHours,
    scheduleNote: w.scheduleNote,
    visibility: w.visibility,
    autoPublish: w.autoPublish,
    episodeNumberEnabled: w.episodeNumberEnabled,
    recurrenceEnabled: w.recurrenceEnabled,
    recurrenceDays: w.recurrenceDays,
    recurrenceTimeOfDay: w.recurrenceTimeOfDay,
    recurrenceDurationMin: w.recurrenceDurationMin,
    recurrenceTimezone: w.recurrenceTimezone,
    recurrenceHorizonDays: w.recurrenceHorizonDays,
    createdAt: w.createdAt,
  };
}

export function scheduledShowFromWire(w: WireScheduledShow): ScheduledShow {
  return w;
}

export function episodeFromWire(w: WireLiveShowEpisode): StudioEpisode {
  return {
    id: w.id,
    showId: w.seriesId,
    episodeNumber: w.episodeNumber ?? 0,
    title: w.title,
    description: w.description ?? '',
    coverUrl: w.artworkUrl,
    status: w.status,
    source: w.source === 'BROADCAST' ? 'broadcast' : 'upload',
    soundId: w.soundId,
    slotStartAt: null,
    slotEndAt: null,
    bookingId: w.radioSlotBookingId,
    createdAt: w.createdAt,
  };
}
