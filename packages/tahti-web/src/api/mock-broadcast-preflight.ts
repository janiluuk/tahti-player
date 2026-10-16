import type { BroadcastPreflight } from './broadcast';
import { seedSeries } from './shows/mock';

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
