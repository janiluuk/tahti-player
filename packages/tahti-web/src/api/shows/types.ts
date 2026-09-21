export const SHOW_SLOT_MAX_HOURS = 2;

export type ShowType = 'LIVE_SET' | 'TALK';
export type ShowMode = 'SINGLE' | 'SERIES';

/** Parent show series — Nuclear studio model (local + mock; slots use live API). */
export type StudioShowSeries = {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  backdropUrl?: string | null;
  mode?: ShowMode;
  showType: ShowType;
  /** Next sequential episode number to assign (1-based). */
  nextEpisodeNumber: number;
  /** Preferred slot length in hours (1–2). */
  intervalHours: 1 | 2;
  /** Optional recurring note / weekday hint for booking. */
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

export type ScheduledShow = {
  id: string;
  seriesId: string;
  startAt: string;
  episodeNumber: number | null;
  title: string;
  description: string | null;
  tagline: string | null;
  venue: string | null;
  location: string | null;
  artworkUrl: string | null;
  showType: ShowType;
  visibility: 'PUBLIC' | 'FAN_ONLY';
  autoPublish: boolean;
};

export type EpisodeSource = 'upload' | 'broadcast';
export type EpisodeStatus =
  'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SCHEDULED' | 'LIVE';

export type StudioEpisode = {
  id: string;
  showId: string;
  /** Sequential episode # on the parent show (not a track/catalog number). */
  episodeNumber: number;
  title: string;
  description: string;
  coverUrl: string | null;
  status: EpisodeStatus;
  source: EpisodeSource;
  soundId: string | null;
  slotStartAt: string | null;
  slotEndAt: string | null;
  bookingId: string | null;
  createdAt: string;
};

export type StudioShowBooking = {
  id: string;
  startAt: string;
  endAt: string;
  note: string | null;
  showType: ShowType;
  channelSlug: string;
  /** Artist's account username — what the green-room guest route
   * (`/u/:username/green-room`) and other `/u/:username` links need; can
   * differ from `channelSlug`. */
  username: string;
  displayName: string;
  isMine: boolean;
  showId?: string | null;
  showTitle?: string | null;
  showDescription?: string | null;
  coverUrl?: string | null;
  episodeNumber?: number | null;
};

export type PublicRadioShowEpisode = {
  id: string;
  startAt: string;
  endAt: string;
  note: string | null;
  showType: ShowType;
  title?: string | null;
  description?: string | null;
  coverUrl?: string | null;
  recording?: {
    soundId: string;
    title: string;
    channelItemUrl: string;
  } | null;
};

export type PublicRadioShow = {
  artist: {
    displayName: string;
    username: string;
    avatarUrl: string | null;
    channelSlug: string;
    bio: string | null;
    coverUrl?: string | null;
  };
  pastEpisodes: PublicRadioShowEpisode[];
  upcomingEpisodes: PublicRadioShowEpisode[];
  nextShowAt: string | null;
  lastShowAt: string | null;
};
