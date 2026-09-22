import type { FetchMeta } from '.././client';
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
} from '.././mode';
import { requestJson } from '.././request-json';
import { seedEpisodes, seedSeries, SERIES_KEY, writeJson } from './mock';
import {
  type ScheduledShow,
  type ShowMode,
  type ShowType,
  type StudioEpisode,
  type StudioShowSeries,
} from './types';
import {
  episodeFromWire,
  scheduledShowFromWire,
  seriesFromWire,
  type WireLiveShowEpisode,
  type WireLiveShowSeries,
  type WireScheduledShow,
} from './wire';

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
