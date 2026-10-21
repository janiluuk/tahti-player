import type { RecentBroadcast } from '../../../api/broadcast';
import type { ShowRefBySoundItemId } from '../../../api/shows';

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(seconds: number | undefined): string {
  if (!seconds) {
    return '';
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export const isPublished = (show: RecentBroadcast) =>
  show.soundStatus === 'READY';

/** Fallback grouping for recordings with no matching episode (e.g. an
 * ad-hoc "Go Live" session never tied to a scheduled show) — the closest
 * thing to a show name without a real reference. */
const untitledGroupKey = (show: RecentBroadcast) =>
  (show.title || show.soundTitle || 'Untitled recordings').trim();

export type SortKey = 'newest' | 'oldest' | 'title';

export function sortShows(
  list: RecentBroadcast[],
  sort: SortKey,
): RecentBroadcast[] {
  return [...list].sort((left, right) => {
    if (sort === 'title') {
      return (left.title || left.soundTitle || '').localeCompare(
        right.title || right.soundTitle || '',
      );
    }
    const leftTime = new Date(left.startedAt).getTime();
    const rightTime = new Date(right.startedAt).getTime();
    return sort === 'newest' ? rightTime - leftTime : leftTime - rightTime;
  });
}

export type ShowGroup = {
  key: string;
  title: string;
  /** Set only when the group is a real show reference, not the title
   * fallback — lets the group header link to the actual show. */
  showId: string | null;
  items: RecentBroadcast[];
};

export function groupByShow(
  items: RecentBroadcast[],
  showRefBySoundItemId: ShowRefBySoundItemId,
): ShowGroup[] {
  const map = new Map<string, ShowGroup>();
  for (const item of items) {
    const ref = item.soundId
      ? showRefBySoundItemId.get(item.soundId)
      : undefined;
    const key = ref ? `show:${ref.showId}` : `title:${untitledGroupKey(item)}`;
    const existing = map.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      map.set(key, {
        key,
        title: ref ? ref.title : untitledGroupKey(item),
        showId: ref?.showId ?? null,
        items: [item],
      });
    }
  }
  return [...map.values()].sort((a, b) => {
    const latest = (group: RecentBroadcast[]) =>
      Math.max(...group.map((i) => new Date(i.startedAt).getTime()));
    return latest(b.items) - latest(a.items);
  });
}
