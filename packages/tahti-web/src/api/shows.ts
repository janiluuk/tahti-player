import type { FetchMeta } from './client';
import { apiBase } from './http';
import { allowMockFallback, apiErrorMeta, failMeta, isForceMock } from './mode';

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; status: number }> {
  const { headers: initHeaders, ...rest } = init ?? {};
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...initHeaders,
    },
  });
  if (!res.ok) {
    let detail = `${path} → ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      if (body.error || body.message) {
        detail = body.error ?? body.message ?? detail;
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  if (res.status === 204) {
    return { data: undefined as T, status: res.status };
  }
  return { data: (await res.json()) as T, status: res.status };
}

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
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'LIVE';

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

const SERIES_KEY = 'tahti-studio-show-series-v1';
const EPISODES_KEY = 'tahti-studio-episodes-v1';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota
  }
}

function seedSeries(): StudioShowSeries[] {
  const existing = readJson<StudioShowSeries[]>(SERIES_KEY, []);
  if (existing.length > 0) {
    return existing;
  }
  const seeded: StudioShowSeries[] = [
    {
      id: 'show-series-demo',
      title: 'Friday Frequency',
      description: 'Weekly deep electronic set — live on Tahti Radio.',
      coverUrl: null,
      showType: 'LIVE_SET',
      nextEpisodeNumber: 4,
      intervalHours: 2,
      scheduleNote: 'Fridays',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'show-series-cartography',
      title: 'Route 550 Live',
      description:
        'Weekly late-night dub session recorded riding the actual bus route — mixed live from a portable rig, broadcast the same night.',
      coverUrl: null,
      showType: 'LIVE_SET',
      nextEpisodeNumber: 3,
      intervalHours: 1,
      scheduleNote: 'Thursdays, after midnight',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'show-series-cypher',
      title: 'Kaiku Cypher Sessions',
      description:
        'Rotating slot for the six Kaiku Collective producers — one new beat and a closing freestyle every week.',
      coverUrl: null,
      showType: 'LIVE_SET',
      nextEpisodeNumber: 2,
      intervalHours: 1,
      scheduleNote: 'Sundays',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'show-series-studio-talk',
      title: 'Boathouse Talk',
      description:
        'Monthly interview show — a working artist joins for an unscripted conversation about process, gear, and the Finnish scene.',
      coverUrl: null,
      showType: 'TALK',
      nextEpisodeNumber: 2,
      intervalHours: 1,
      scheduleNote: 'First Tuesday of the month',
      createdAt: new Date().toISOString(),
    },
  ];
  writeJson(SERIES_KEY, seeded);
  return seeded;
}

function seedEpisodes(): StudioEpisode[] {
  const existing = readJson<StudioEpisode[]>(EPISODES_KEY, []);
  if (existing.length > 0) {
    return existing;
  }
  const seeded: StudioEpisode[] = [
    {
      id: 'ep-demo-1',
      showId: 'show-series-demo',
      episodeNumber: 1,
      title: 'Friday Frequency — Episode 1',
      description: 'Weekly deep electronic set — live on Tahti Radio.',
      coverUrl: null,
      status: 'APPROVED',
      source: 'upload',
      soundId: 'arch-mock-1',
      slotStartAt: null,
      slotEndAt: null,
      bookingId: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ep-demo-2',
      showId: 'show-series-demo',
      episodeNumber: 2,
      title: 'Friday Frequency — Episode 2',
      description: 'Weekly deep electronic set — live on Tahti Radio.',
      coverUrl: null,
      status: 'PENDING_APPROVAL',
      source: 'broadcast',
      soundId: 'arch-mock-1',
      slotStartAt: null,
      slotEndAt: null,
      bookingId: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ep-demo-3',
      showId: 'show-series-demo',
      episodeNumber: 3,
      title: 'Friday Frequency — Episode 3',
      description: 'Weekly deep electronic set — live on Tahti Radio.',
      coverUrl: null,
      status: 'APPROVED',
      source: 'upload',
      soundId: 'arch-mock-2',
      slotStartAt: null,
      slotEndAt: null,
      bookingId: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ep-cartography-1',
      showId: 'show-series-cartography',
      episodeNumber: 1,
      title: 'Route 550 Live — Episode 1',
      description:
        'First edition — Kamppi to Tapiola, recorded live on a Thursday night run.',
      coverUrl: null,
      status: 'APPROVED',
      source: 'broadcast',
      soundId: 'arch-mock-3',
      slotStartAt: null,
      slotEndAt: null,
      bookingId: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ep-cartography-2',
      showId: 'show-series-cartography',
      episodeNumber: 2,
      title: 'Route 550 Live — Episode 2',
      description: 'Ring Rail loop special — full 68-minute circuit, unedited.',
      coverUrl: null,
      status: 'PENDING_APPROVAL',
      source: 'broadcast',
      soundId: null,
      slotStartAt: null,
      slotEndAt: null,
      bookingId: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ep-cypher-1',
      showId: 'show-series-cypher',
      episodeNumber: 1,
      title: 'Kaiku Cypher Sessions — Episode 1',
      description:
        'Season opener — all six producers, closing group freestyle.',
      coverUrl: null,
      status: 'APPROVED',
      source: 'upload',
      soundId: 'arch-mock-4',
      slotStartAt: null,
      slotEndAt: null,
      bookingId: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ep-studio-talk-1',
      showId: 'show-series-studio-talk',
      episodeNumber: 1,
      title: 'Boathouse Talk — Episode 1: Saimaa Sessions',
      description:
        'First guest: the Saimaa Sessions trio on recording live over lake thaws and never repeating a set.',
      coverUrl: null,
      status: 'APPROVED',
      source: 'upload',
      soundId: 'arch-mock-5',
      slotStartAt: null,
      slotEndAt: null,
      bookingId: null,
      createdAt: new Date().toISOString(),
    },
  ];
  writeJson(EPISODES_KEY, seeded);
  return seeded;
}

let mockBookings: StudioShowBooking[] = [
  {
    id: 'booking-mock-1',
    startAt: new Date(Date.now() + 26 * 3600_000).toISOString(),
    endAt: new Date(Date.now() + 28 * 3600_000).toISOString(),
    note: 'Friday Frequency',
    showType: 'LIVE_SET',
    channelSlug: 'demo',
    username: 'demo',
    displayName: 'Demo Artist',
    isMine: true,
  },
  {
    id: 'booking-mock-2',
    // Starts soon — exercises the "green room open now" banner in
    // RadioScheduleView without needing to fiddle the system clock.
    startAt: new Date(Date.now() + 8 * 60_000).toISOString(),
    endAt: new Date(Date.now() + 68 * 60_000).toISOString(),
    note: 'Route 550 Live',
    showType: 'LIVE_SET',
    channelSlug: 'midnight-cartography',
    username: 'midnight-cartography',
    displayName: 'Midnight Cartography',
    isMine: false,
  },
  {
    id: 'booking-mock-3',
    startAt: new Date(Date.now() + 74 * 3600_000).toISOString(),
    endAt: new Date(Date.now() + 75 * 3600_000).toISOString(),
    note: 'Kaiku Cypher Sessions',
    showType: 'LIVE_SET',
    channelSlug: 'kaiku-collective',
    username: 'kaiku-collective',
    displayName: 'Kaiku Collective',
    isMine: false,
  },
  {
    id: 'booking-mock-4',
    startAt: new Date(Date.now() + 122 * 3600_000).toISOString(),
    endAt: new Date(Date.now() + 123 * 3600_000).toISOString(),
    note: 'Boathouse Talk',
    showType: 'TALK',
    channelSlug: 'saimaa-sessions',
    username: 'saimaa-sessions',
    displayName: 'Saimaa Sessions',
    isMine: false,
  },
];

type WireLiveShowSeries = {
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

type WireScheduledShow = Omit<ScheduledShow, 'showType'> & {
  showType: ShowType;
};

type WireLiveShowEpisode = {
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

function seriesFromWire(w: WireLiveShowSeries): StudioShowSeries {
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

function scheduledShowFromWire(w: WireScheduledShow): ScheduledShow {
  return w;
}

function episodeFromWire(w: WireLiveShowEpisode): StudioEpisode {
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

export async function fetchShowSeries(): Promise<{
  data: StudioShowSeries[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: seedSeries(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ series: WireLiveShowSeries[] }>(
      '/api/me/channel/show-series',
    );
    return { data: data.series.map(seriesFromWire), meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: seedSeries(), meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function fetchShowSchedule(): Promise<{
  data: { series: StudioShowSeries[]; scheduledShows: ScheduledShow[] };
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: { series: seedSeries(), scheduledShows: [] },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{
      series: WireLiveShowSeries[];
      scheduledShows: WireScheduledShow[];
    }>('/api/me/channel/show-series');
    return {
      data: {
        series: data.series.map(seriesFromWire),
        scheduledShows: data.scheduledShows.map(scheduledShowFromWire),
      },
      meta: { source: 'api' },
    };
  } catch (err) {
    if (allowMockFallback()) {
      return {
        data: { series: seedSeries(), scheduledShows: [] },
        meta: failMeta(err),
      };
    }
    return {
      data: { series: [], scheduledShows: [] },
      meta: apiErrorMeta(err),
    };
  }
}

export async function createShowSeries(input: {
  title: string;
  description?: string;
  coverUrl?: string | null;
  backdropUrl?: string | null;
  mode?: ShowMode;
  showType?: ShowType;
  intervalHours?: 1 | 2;
  scheduleNote?: string | null;
  visibility?: 'PUBLIC' | 'FAN_ONLY';
  autoPublish?: boolean;
  episodeNumberEnabled?: boolean;
  nextEpisodeNumber?: number;
  recurrenceEnabled?: boolean;
  recurrenceDays?: number[];
  recurrenceTimeOfDay?: string | null;
  recurrenceDurationMin?: number | null;
  recurrenceTimezone?: string | null;
  recurrenceHorizonDays?: number;
}): Promise<
  { ok: true; data: StudioShowSeries } | { ok: false; error: string }
> {
  const title = input.title.trim();
  if (!title) {
    return { ok: false, error: 'Title is required' };
  }
  if (isForceMock()) {
    const list = seedSeries();
    const series: StudioShowSeries = {
      id: `show-${Date.now()}`,
      title,
      description: input.description?.trim() || '',
      coverUrl: input.coverUrl ?? null,
      backdropUrl: input.backdropUrl ?? null,
      mode: input.mode ?? 'SERIES',
      showType: input.showType ?? 'LIVE_SET',
      nextEpisodeNumber: 1,
      intervalHours: input.intervalHours ?? 1,
      scheduleNote: input.scheduleNote?.trim() || null,
      visibility: input.visibility ?? 'PUBLIC',
      autoPublish: input.autoPublish ?? true,
      episodeNumberEnabled: input.episodeNumberEnabled ?? true,
      recurrenceEnabled: input.recurrenceEnabled ?? false,
      recurrenceDays: input.recurrenceDays ?? [],
      recurrenceTimeOfDay: input.recurrenceTimeOfDay ?? null,
      recurrenceDurationMin: input.recurrenceDurationMin ?? null,
      recurrenceTimezone: input.recurrenceTimezone ?? null,
      recurrenceHorizonDays: input.recurrenceHorizonDays ?? 28,
      createdAt: new Date().toISOString(),
    };
    writeJson(SERIES_KEY, [series, ...list]);
    return { ok: true, data: series };
  }
  try {
    const { data } = await requestJson<WireLiveShowSeries>(
      '/api/me/channel/show-series',
      {
        method: 'POST',
        body: JSON.stringify({
          name: title,
          description: input.description,
          artworkUrl: input.coverUrl,
          backdropUrl: input.backdropUrl,
          mode: input.mode,
          showType: input.showType,
          intervalHours: input.intervalHours,
          scheduleNote: input.scheduleNote,
          visibility: input.visibility,
          autoPublish: input.autoPublish,
          episodeNumberEnabled: input.episodeNumberEnabled,
          nextEpisodeNumber: input.nextEpisodeNumber,
          recurrenceEnabled: input.recurrenceEnabled,
          recurrenceDays: input.recurrenceDays,
          recurrenceTimeOfDay: input.recurrenceTimeOfDay,
          recurrenceDurationMin: input.recurrenceDurationMin,
          recurrenceTimezone: input.recurrenceTimezone,
          recurrenceHorizonDays: input.recurrenceHorizonDays,
        }),
      },
    );
    return { ok: true, data: seriesFromWire(data) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to create show',
    };
  }
}

export async function updateShowSeriesRecurrence(
  id: string,
  patch: {
    recurrenceEnabled: boolean;
    recurrenceDays: number[];
    recurrenceTimeOfDay: string | null;
    recurrenceDurationMin: number | null;
    recurrenceTimezone: string | null;
    recurrenceHorizonDays?: number;
  },
): Promise<
  { ok: true; data: StudioShowSeries } | { ok: false; error: string }
> {
  return patchShowSeries(id, patch);
}

export async function scheduleShowEpisode(
  seriesId: string,
  input: {
    startAt: string;
    title?: string | null;
    venue?: string | null;
    location?: string | null;
    artworkUrl?: string | null;
  },
): Promise<{ ok: true; data: ScheduledShow } | { ok: false; error: string }> {
  if (isForceMock()) {
    const show = seedSeries().find((item) => item.id === seriesId);
    if (!show) {
      return { ok: false, error: 'Show not found' };
    }
    return {
      ok: true,
      data: {
        id: `scheduled-${Date.now()}`,
        seriesId,
        startAt: input.startAt,
        episodeNumber: show.nextEpisodeNumber,
        title:
          input.title?.trim() || `${show.title} #${show.nextEpisodeNumber}`,
        description: show.description,
        tagline: null,
        venue: input.venue ?? null,
        location: input.location ?? null,
        artworkUrl: input.artworkUrl ?? show.coverUrl,
        showType: show.showType,
        visibility: show.visibility ?? 'PUBLIC',
        autoPublish: show.autoPublish ?? true,
      },
    };
  }
  try {
    const { data } = await requestJson<WireScheduledShow>(
      `/api/me/channel/show-series/${encodeURIComponent(seriesId)}/episodes`,
      { method: 'POST', body: JSON.stringify(input) },
    );
    return { ok: true, data: scheduledShowFromWire(data) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not schedule show',
    };
  }
}

export async function cancelScheduledShow(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/me/channel/scheduled-shows/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not cancel show',
    };
  }
}

export async function patchShowSeries(
  id: string,
  patch: Partial<
    Pick<
      StudioShowSeries,
      | 'title'
      | 'description'
      | 'coverUrl'
      | 'backdropUrl'
      | 'mode'
      | 'showType'
      | 'intervalHours'
      | 'scheduleNote'
      | 'nextEpisodeNumber'
      | 'visibility'
      | 'autoPublish'
      | 'episodeNumberEnabled'
      | 'recurrenceEnabled'
      | 'recurrenceDays'
      | 'recurrenceTimeOfDay'
      | 'recurrenceDurationMin'
      | 'recurrenceTimezone'
      | 'recurrenceHorizonDays'
    >
  >,
): Promise<
  { ok: true; data: StudioShowSeries } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const list = seedSeries();
    const idx = list.findIndex((s) => s.id === id);
    if (idx < 0) {
      return { ok: false, error: 'Show not found' };
    }
    list[idx] = { ...list[idx]!, ...patch };
    writeJson(SERIES_KEY, list);
    return { ok: true, data: list[idx]! };
  }
  try {
    const body: Record<string, unknown> = {};
    if ('title' in patch) {
      body.name = patch.title;
    }
    if ('description' in patch) {
      body.description = patch.description;
    }
    if ('coverUrl' in patch) {
      body.artworkUrl = patch.coverUrl;
    }
    if ('backdropUrl' in patch) {
      body.backdropUrl = patch.backdropUrl;
    }
    if ('mode' in patch) {
      body.mode = patch.mode;
    }
    if ('showType' in patch) {
      body.showType = patch.showType;
    }
    if ('intervalHours' in patch) {
      body.intervalHours = patch.intervalHours;
    }
    if ('scheduleNote' in patch) {
      body.scheduleNote = patch.scheduleNote;
    }
    if ('nextEpisodeNumber' in patch) {
      body.nextEpisodeNumber = patch.nextEpisodeNumber;
    }
    if ('visibility' in patch) {
      body.visibility = patch.visibility;
    }
    if ('autoPublish' in patch) {
      body.autoPublish = patch.autoPublish;
    }
    if ('episodeNumberEnabled' in patch) {
      body.episodeNumberEnabled = patch.episodeNumberEnabled;
    }
    if ('recurrenceEnabled' in patch) {
      body.recurrenceEnabled = patch.recurrenceEnabled;
    }
    if ('recurrenceDays' in patch) {
      body.recurrenceDays = patch.recurrenceDays;
    }
    if ('recurrenceTimeOfDay' in patch) {
      body.recurrenceTimeOfDay = patch.recurrenceTimeOfDay;
    }
    if ('recurrenceDurationMin' in patch) {
      body.recurrenceDurationMin = patch.recurrenceDurationMin;
    }
    if ('recurrenceTimezone' in patch) {
      body.recurrenceTimezone = patch.recurrenceTimezone;
    }
    if ('recurrenceHorizonDays' in patch) {
      body.recurrenceHorizonDays = patch.recurrenceHorizonDays;
    }
    const { data } = await requestJson<WireLiveShowSeries>(
      `/api/me/channel/show-series/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    );
    return { ok: true, data: seriesFromWire(data) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to update show',
    };
  }
}

export async function fetchShowSeriesById(
  id: string,
): Promise<{ data: StudioShowSeries | null; meta: FetchMeta }> {
  const { data, meta } = await fetchShowSeries();
  return { data: data.find((s) => s.id === id) ?? null, meta };
}

export async function fetchEpisodesForShow(
  showId: string,
): Promise<{ data: StudioEpisode[]; meta: FetchMeta }> {
  if (isForceMock()) {
    const all = seedEpisodes();
    return {
      data: all
        .filter((e) => e.showId === showId)
        .sort((a, b) => b.episodeNumber - a.episodeNumber),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ episodes: WireLiveShowEpisode[] }>(
      `/api/me/channel/show-series/${encodeURIComponent(showId)}/live-show-episodes`,
    );
    return {
      data: data.episodes.map(episodeFromWire),
      meta: { source: 'api' },
    };
  } catch (err) {
    if (allowMockFallback()) {
      const all = seedEpisodes();
      return {
        data: all
          .filter((e) => e.showId === showId)
          .sort((a, b) => b.episodeNumber - a.episodeNumber),
        meta: failMeta(err),
      };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

/** A recording/archive item's real, stable reference to the show it
 * belongs to — resolved by joining every show series' episodes
 * (StudioEpisode.soundId) against the archive item id. There is no
 * single "all episodes" endpoint, so this fetches every series' episodes
 * and merges them; callers needing "which show made this recording"
 * (e.g. StudioRecordingsView) should use this instead of matching on
 * title text, which drifts as soon as two shows share a name. */
export type ShowRefBySoundItemId = Map<
  string,
  { showId: string; title: string }
>;

export async function fetchShowRefBySoundItemId(): Promise<{
  data: ShowRefBySoundItemId;
  meta: FetchMeta;
}> {
  const { data: series, meta } = await fetchShowSeries();
  const episodeLists = await Promise.all(
    series.map((show) => fetchEpisodesForShow(show.id)),
  );
  const map: ShowRefBySoundItemId = new Map();
  series.forEach((show, index) => {
    for (const episode of episodeLists[index].data) {
      if (episode.soundId) {
        map.set(episode.soundId, { showId: show.id, title: show.title });
      }
    }
  });
  return { data: map, meta };
}

export async function fetchEpisode(
  id: string,
): Promise<{ data: StudioEpisode | null; meta: FetchMeta }> {
  if (isForceMock()) {
    const all = seedEpisodes();
    return {
      data: all.find((e) => e.id === id) ?? null,
      meta: { source: 'mock' },
    };
  }
  try {
    const { data } = await requestJson<WireLiveShowEpisode>(
      `/api/me/channel/live-show-episodes/${encodeURIComponent(id)}`,
    );
    return { data: episodeFromWire(data), meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      const all = seedEpisodes();
      return {
        data: all.find((e) => e.id === id) ?? null,
        meta: failMeta(err),
      };
    }
    return { data: null, meta: apiErrorMeta(err) };
  }
}

/** Create episode with parent defaults — sequential episode number is assigned here. */
export async function createEpisode(input: {
  showId: string;
  source: EpisodeSource;
  soundId?: string | null;
  slotStartAt?: string | null;
  slotEndAt?: string | null;
  bookingId?: string | null;
  /** Override title; defaults to "{show} — Episode {n}". */
  title?: string;
}): Promise<{ ok: true; data: StudioEpisode } | { ok: false; error: string }> {
  if (isForceMock()) {
    const seriesList = seedSeries();
    const show = seriesList.find((s) => s.id === input.showId);
    if (!show) {
      return { ok: false, error: 'Show not found' };
    }

    const episodeNumber = show.nextEpisodeNumber;
    const episode: StudioEpisode = {
      id: `ep-${Date.now()}`,
      showId: show.id,
      episodeNumber,
      title: input.title?.trim() || `${show.title} — Episode ${episodeNumber}`,
      description: show.description,
      coverUrl: show.coverUrl,
      status: input.source === 'broadcast' ? 'PENDING_APPROVAL' : 'DRAFT',
      source: input.source,
      soundId: input.soundId ?? null,
      slotStartAt: input.slotStartAt ?? null,
      slotEndAt: input.slotEndAt ?? null,
      bookingId: input.bookingId ?? null,
      createdAt: new Date().toISOString(),
    };

    const episodes = seedEpisodes();
    writeJson(EPISODES_KEY, [episode, ...episodes]);
    show.nextEpisodeNumber = episodeNumber + 1;
    writeJson(SERIES_KEY, seriesList);

    return { ok: true, data: episode };
  }
  try {
    const { data } = await requestJson<WireLiveShowEpisode>(
      `/api/me/channel/show-series/${encodeURIComponent(input.showId)}/live-show-episodes`,
      {
        method: 'POST',
        body: JSON.stringify({
          source: input.source === 'broadcast' ? 'BROADCAST' : 'UPLOAD',
          title: input.title,
          soundId: input.soundId,
          radioSlotBookingId: input.bookingId,
        }),
      },
    );
    return { ok: true, data: episodeFromWire(data) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to create episode',
    };
  }
}

export async function patchEpisode(
  id: string,
  patch: Partial<
    Pick<
      StudioEpisode,
      | 'title'
      | 'description'
      | 'coverUrl'
      | 'status'
      | 'soundId'
      | 'slotStartAt'
      | 'slotEndAt'
      | 'bookingId'
    >
  >,
): Promise<{ ok: true; data: StudioEpisode } | { ok: false; error: string }> {
  if (isForceMock()) {
    const list = seedEpisodes();
    const idx = list.findIndex((e) => e.id === id);
    if (idx < 0) {
      return { ok: false, error: 'Episode not found' };
    }
    list[idx] = { ...list[idx]!, ...patch };
    writeJson(EPISODES_KEY, list);
    return { ok: true, data: list[idx]! };
  }
  try {
    const body: Record<string, unknown> = {};
    if ('title' in patch) {
      body.title = patch.title;
    }
    if ('description' in patch) {
      body.description = patch.description;
    }
    if ('coverUrl' in patch) {
      body.artworkUrl = patch.coverUrl;
    }
    if ('status' in patch) {
      body.status = patch.status;
    }
    if ('soundId' in patch) {
      body.soundId = patch.soundId;
    }
    if ('bookingId' in patch) {
      body.radioSlotBookingId = patch.bookingId;
    }
    const { data } = await requestJson<WireLiveShowEpisode>(
      `/api/me/channel/live-show-episodes/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    );
    return { ok: true, data: episodeFromWire(data) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to update episode',
    };
  }
}

/** Approve a recorded episode so it can go live / be scheduled. */
export async function approveEpisode(
  id: string,
): Promise<{ ok: true; data: StudioEpisode } | { ok: false; error: string }> {
  const ep = (await fetchEpisode(id)).data;
  if (!ep) {
    return { ok: false, error: 'Episode not found' };
  }
  if (
    ep.source === 'broadcast' &&
    ep.status === 'PENDING_APPROVAL' &&
    !ep.soundId
  ) {
    return { ok: false, error: 'Attach audio before approving' };
  }
  return patchEpisode(id, { status: 'APPROVED' });
}

export async function fetchShowBookings(
  from: string,
  to: string,
): Promise<{ data: StudioShowBooking[]; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: mockBookings.filter((b) => {
        const s = new Date(b.startAt).getTime();
        const e = new Date(b.endAt).getTime();
        return s < new Date(to).getTime() && e > new Date(from).getTime();
      }),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<StudioShowBooking[]>(
      `/api/me/radio-slot-bookings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockBookings, meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function fetchPublicRadioShow(
  channelSlug: string,
): Promise<{ data: PublicRadioShow | null; meta: FetchMeta }> {
  if (isForceMock()) {
    const now = Date.now();
    const matchingBookings = mockBookings.filter(
      (booking) => booking.channelSlug === channelSlug,
    );
    const episodes = seedEpisodes();
    const mapBooking = (booking: StudioShowBooking): PublicRadioShowEpisode => {
      const episode = episodes.find(
        (candidate) => candidate.bookingId === booking.id,
      );
      return {
        id: booking.id,
        startAt: booking.startAt,
        endAt: booking.endAt,
        note: booking.note,
        showType: booking.showType,
        title: episode?.title,
        description: episode?.description,
        coverUrl: episode?.coverUrl,
        recording: episode?.soundId
          ? {
              soundId: episode.soundId,
              title: episode.title,
              channelItemUrl: `/channel/${booking.channelSlug}#archive-item-${episode.soundId}`,
            }
          : null,
      };
    };
    const upcoming = matchingBookings
      .filter((booking) => new Date(booking.endAt).getTime() > now)
      .map(mapBooking);
    const past = matchingBookings
      .filter((booking) => new Date(booking.endAt).getTime() <= now)
      .map(mapBooking);
    const first = matchingBookings[0];
    return {
      data: {
        artist: {
          displayName: first?.displayName ?? 'Demo Artist',
          username: channelSlug,
          avatarUrl: null,
          channelSlug,
          bio: null,
        },
        pastEpisodes: past,
        upcomingEpisodes: upcoming,
        nextShowAt: upcoming[0]?.startAt ?? null,
        lastShowAt: past[0]?.startAt ?? null,
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<PublicRadioShow>(
      `/api/v1/radio/show/${encodeURIComponent(channelSlug)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: apiErrorMeta(err) };
  }
}

export async function createShowBooking(input: {
  startAt: string;
  endAt: string;
  note?: string;
  showType?: ShowType;
}): Promise<
  { ok: true; data: StudioShowBooking } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const booking: StudioShowBooking = {
      id: `booking-${Date.now()}`,
      startAt: input.startAt,
      endAt: input.endAt,
      note: input.note?.trim() || null,
      showType: input.showType ?? 'LIVE_SET',
      channelSlug: 'demo',
      username: 'demo',
      displayName: 'Demo Artist',
      isMine: true,
    };
    mockBookings = [...mockBookings, booking];
    return { ok: true, data: booking };
  }
  try {
    const { data } = await requestJson<StudioShowBooking>(
      '/api/me/radio-slot-bookings',
      {
        method: 'POST',
        body: JSON.stringify({
          startAt: input.startAt,
          endAt: input.endAt,
          note: input.note,
          showType: input.showType ?? 'LIVE_SET',
        }),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Booking failed',
    };
  }
}

export async function updateShowBooking(
  id: string,
  patch: { note?: string | null; showType?: ShowType },
): Promise<
  { ok: true; data: StudioShowBooking } | { ok: false; error: string }
> {
  if (isForceMock()) {
    let updated: StudioShowBooking | undefined;
    mockBookings = mockBookings.map((b) => {
      if (b.id !== id) {
        return b;
      }
      updated = {
        ...b,
        ...(patch.note !== undefined ? { note: patch.note } : {}),
        ...(patch.showType !== undefined ? { showType: patch.showType } : {}),
      };
      return updated;
    });
    if (!updated) {
      return { ok: false, error: 'Booking not found' };
    }
    return { ok: true, data: updated };
  }
  try {
    const { data } = await requestJson<StudioShowBooking>(
      `/api/me/radio-slot-bookings/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Update failed',
    };
  }
}

export async function cancelShowBooking(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockBookings = mockBookings.filter((b) => b.id !== id);
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/radio-slot-bookings/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Cancel failed',
    };
  }
}
