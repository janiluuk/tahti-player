import type { BroadcastPreflight } from './broadcast';
import { createEpisode, patchEpisode } from './shows/episodes';
import { seedSeries } from './shows/mock';

let liveEpisodeId: string | null = null;

export function applyMockPreflightPatch(
  current: BroadcastPreflight,
  patch: Partial<BroadcastPreflight> & { seriesId?: string },
): { data: BroadcastPreflight } | { error: string } {
  const { seriesId, ...fields } = patch;
  const next: BroadcastPreflight = { ...current, ...fields };
  if (!seriesId) {
    return { data: next };
  }
  const series = seedSeries().find((item) => item.id === seriesId);
  if (!series) {
    return { error: 'Show not found' };
  }
  const episodeNumber =
    current.plannedLiveShow?.seriesId === seriesId
      ? (current.plannedLiveShow.episodeNumber ?? series.nextEpisodeNumber)
      : series.nextEpisodeNumber;
  return {
    data: {
      ...next,
      title: next.title ?? `${series.title} — Episode ${episodeNumber}`,
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
  return { ...preflight, plannedLiveShow: null, episodeNumber: null };
}
