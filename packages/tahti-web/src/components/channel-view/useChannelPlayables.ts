import { useMemo } from 'react';

import { soundItemToPlayable } from '../../api/client';
import type { ChannelSoundItem, TahtiPlayable } from '../../api/types';
import { isPinned } from '../../lib/pinnedTracks';

/** The channel's tracks as playables: pinned ones first (newest pin on
 * top), then the rest of the catalog, plus every playable id for quick
 * "is this one of ours" checks. */
export function useChannelPlayables(sounds: ChannelSoundItem[], slug: string) {
  return useMemo(() => {
    const pinnedItems = [...sounds]
      .filter((item) => isPinned(item))
      .sort((a, b) => (b.pinnedAt ?? '').localeCompare(a.pinnedAt ?? ''));
    const pinnedIds = new Set(pinnedItems.map((i) => i.id));
    const toPlayable = (item: ChannelSoundItem) =>
      soundItemToPlayable(item, slug);
    const pinnedPlayables = pinnedItems
      .map(toPlayable)
      .filter((p): p is TahtiPlayable => Boolean(p));
    const catalogPlayables = sounds
      .filter((item) => !pinnedIds.has(item.id))
      .map(toPlayable)
      .filter((p): p is TahtiPlayable => Boolean(p));
    return {
      pinnedPlayables,
      catalogPlayables,
      channelTrackIds: new Set(
        [...pinnedPlayables, ...catalogPlayables].map((p) => p.id),
      ) as ReadonlySet<string>,
    };
  }, [sounds, slug]);
}
