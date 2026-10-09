import type { QueueItem } from '@tahti-player/model';

import type { PlaybackStatus } from '../stores/playerStore';

/** The queue as its rows should draw it: the row of the current track
 * carries what the player is doing with it. The store keeps one playback
 * status for the whole player, so a queue row never showed that its track
 * was still loading or had failed. */
export function queueWithPlaybackStatus(
  queue: QueueItem[],
  currentId: string | null,
  status: PlaybackStatus,
  error: string | null,
): QueueItem[] {
  if (!currentId || (status !== 'loading' && status !== 'error')) {
    return queue;
  }
  return queue.map((item) =>
    item.id === currentId
      ? status === 'loading'
        ? { ...item, status: 'loading' }
        : { ...item, status: 'error', error: error ?? undefined }
      : item,
  );
}
