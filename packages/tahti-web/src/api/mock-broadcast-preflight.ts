import type { BroadcastPreflight, BroadcastPreflightPatch } from './broadcast';
import { createEpisode, patchEpisode } from './shows/episodes';
import { seedSeries } from './shows/mock';

let liveEpisodeId: string | null = null;

const LOCKED_WHILE_LIVE = ['showType', 'visibility', 'seriesId'] as const;

/** Mirrors the API rules: type, visibility and series are fixed once the
 * broadcast is LIVE (sending the current value is fine), and a series
 * cannot be dropped after the encoder connects. */
export function applyMockPreflightPatch(
  current: BroadcastPreflight,
  patch: BroadcastPreflightPatch,
): { data: BroadcastPreflight } | { error: string; status: number } {
  if (current.session === 'LIVE') {
    for (const field of LOCKED_WHILE_LIVE) {
      if (field in patch && patch[field] !== current[field]) {
        return { error: 'Not editable while live', status: 409 };
      }
    }
  }
  if (
    current.session !== 'NONE' &&
    current.seriesId &&
    'seriesId' in patch &&
    patch.seriesId === null
  ) {
    return {
      error: 'The series cannot be removed after the encoder connects',
      status: 409,
    };
  }
  const { seriesId, ...fields } = patch;
  const next: BroadcastPreflight = { ...current, ...fields };
  if ('artworkUrl' in patch) {
    next.coverUrl = patch.artworkUrl ?? null;
  }
  if (seriesId === undefined) {
    return { data: next };
  }
  if (seriesId === null) {
    return {
      data: {
        ...next,
        seriesId: null,
        episodeNumber: null,
        plannedLiveShow: null,
      },
    };
  }
  const series = seedSeries().find((item) => item.id === seriesId);
  if (!series) {
    return { error: 'Show not found', status: 404 };
  }
  const episodeNumber =
    current.plannedLiveShow?.seriesId === seriesId
      ? (current.plannedLiveShow.episodeNumber ?? series.nextEpisodeNumber)
      : series.nextEpisodeNumber;
  return {
    data: {
      ...next,
      title: next.title ?? `${series.title} — Episode ${episodeNumber}`,
      seriesId,
      episodeNumber,
      plannedLiveShow: { seriesId, episodeNumber },
    },
  };
}

export async function startMockLiveEpisode(
  preflight: BroadcastPreflight,
): Promise<void> {
  const planned = preflight.plannedLiveShow;
  if (!planned || liveEpisodeId) {
    return;
  }
  const created = await createEpisode({
    showId: planned.seriesId,
    source: 'broadcast',
    title: preflight.title ?? undefined,
  });
  if (!created.ok) {
    return;
  }
  await patchEpisode(created.data.id, { status: 'LIVE' });
  liveEpisodeId = created.data.id;
}

export async function endMockLiveEpisode(
  preflight: BroadcastPreflight,
): Promise<BroadcastPreflight> {
  if (liveEpisodeId) {
    await patchEpisode(liveEpisodeId, { status: 'PENDING_APPROVAL' });
    liveEpisodeId = null;
  }
  return {
    ...preflight,
    session: 'NONE',
    seriesId: null,
    plannedLiveShow: null,
    episodeNumber: null,
  };
}
