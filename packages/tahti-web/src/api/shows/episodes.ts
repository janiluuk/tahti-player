import type { FetchMeta } from '.././client';
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
} from '.././mode';
import { requestJson } from '.././request-json';
import {
  EPISODES_KEY,
  seedEpisodes,
  seedSeries,
  SERIES_KEY,
  writeJson,
} from './mock';
import { fetchEpisodesForShow, fetchShowSeries } from './series';
import { type EpisodeSource, type StudioEpisode } from './types';
import { episodeFromWire, type WireLiveShowEpisode } from './wire';

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
