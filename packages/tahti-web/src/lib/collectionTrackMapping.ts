import type { Track } from '@tahti-player/model';

import type { StudioCollectionItem } from '../api/studio-types';

/** Maps a Collection/Playlist item to the `Track` shape `TrackTable` needs.
 * Shared by `StudioCollectionEditView` and `StudioPlaylistEditorView` —
 * both edit the same `StudioCollection` entity. */
export function collectionItemToTrack(item: StudioCollectionItem): Track {
  return {
    title: item.unavailable
      ? `${item.sound?.title ?? item.id} (no longer available)`
      : (item.sound?.title ?? item.release?.title ?? item.id),
    artists: [
      { name: item.sound?.artist?.displayName ?? 'You', roles: ['performer'] },
    ],
    durationMs:
      item.sound?.durationSec != null
        ? Math.round(item.sound.durationSec * 1000)
        : undefined,
    source: { provider: 'tahti', id: item.id },
  };
}
