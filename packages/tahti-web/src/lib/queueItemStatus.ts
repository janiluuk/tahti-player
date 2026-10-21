import type { QueueItem } from '@tahti-player/model';

import {
  streamUrlFromQueueItem,
  type PlaybackStatus,
} from '../stores/playerStore';

/** A track from the desktop library restored with last session's queue: its
 * file is looked up again in the background, and until then the row has
 * nothing to play. */
function awaitsLocalFile(item: QueueItem): boolean {
  return item.id.startsWith('local:') && !streamUrlFromQueueItem(item);
}

/** The queue as its rows should draw it: the row of the current track
 * carries what the player is doing with it, and rows still waiting for
 * their file show as loading. The store keeps one playback status for the
 * whole player, so a queue row never showed that its track was still
 * loading or had failed. */
export function queueWithPlaybackStatus(
  queue: QueueItem[],
  currentId: string | null,
  status: PlaybackStatus,
  error: string | null,
): QueueItem[] {
  const currentMatters =
    currentId !== null && (status === 'loading' || status === 'error');
  if (!currentMatters && !queue.some(awaitsLocalFile)) {
    return queue;
  }
  return queue.map((item) => {
    if (currentMatters && item.id === currentId) {
      return status === 'loading'
        ? { ...item, status: 'loading' }
        : { ...item, status: 'error', error: error ?? undefined };
    }
    return awaitsLocalFile(item) ? { ...item, status: 'loading' } : item;
  });
}
