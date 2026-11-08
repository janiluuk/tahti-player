import {
  patchStudioCollection,
  reorderStudioCollectionItems,
} from '../api/studio';
import type {
  CollectionTrackSortMode,
  StudioCollectionItem,
} from '../api/studio-types';
import { apiTrackSortMode, type SoundSortMode } from './sortSounds';

/** Saves a Sort sounds result: the order, then the public sort mode when it
 * changed. Returns the reordered items and the mode now stored. */
export async function saveCollectionSoundOrder({
  slug,
  items,
  ids,
  mode,
  currentMode,
}: {
  slug: string;
  items: StudioCollectionItem[];
  ids: string[];
  mode: SoundSortMode;
  currentMode: CollectionTrackSortMode;
}): Promise<
  | {
      ok: true;
      items: StudioCollectionItem[];
      trackSortMode: CollectionTrackSortMode;
    }
  | { ok: false; error: string }
> {
  const reordered = await reorderStudioCollectionItems(slug, ids);
  if (!reordered.ok) {
    return reordered;
  }
  const trackSortMode = apiTrackSortMode(mode);
  if (trackSortMode !== currentMode) {
    const patched = await patchStudioCollection(slug, { trackSortMode });
    if (!patched.ok) {
      return patched;
    }
  }
  const byId = new Map(items.map((item) => [item.id, item]));
  return {
    ok: true,
    items: ids.flatMap((id) => byId.get(id) ?? []),
    trackSortMode,
  };
}

export function sortableCollectionItems(items: StudioCollectionItem[]) {
  return items.map((item) => ({
    id: item.id,
    title: item.sound?.title ?? item.release?.title ?? item.id,
    date: item.sound?.createdAt ?? item.release?.releaseDate ?? null,
    artworkUrl: item.sound?.bannerUrl ?? item.release?.artworkUrl ?? null,
  }));
}
