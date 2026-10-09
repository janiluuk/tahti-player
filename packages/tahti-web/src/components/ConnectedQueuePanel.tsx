import { useMemo } from 'react';

import { QueuePanel } from '@tahti-player/ui';

import { queueWithPlaybackStatus } from '../lib/queueItemStatus';
import { usePlayerStore } from '../stores/playerStore';

const QUEUE_LABELS = {
  emptyTitle: 'Queue empty',
  emptySubtitle: 'Play a channel or radio to start listening',
  removeButton: 'Remove',
  playbackError: 'Could not play',
  noCandidates: 'No stream',
  candidateFailed: 'Stream failed',
};

export function ConnectedQueuePanel({ isCollapsed }: { isCollapsed: boolean }) {
  const queue = usePlayerStore((s) => s.queue);
  const currentId = usePlayerStore((s) => s.currentId);
  const status = usePlayerStore((s) => s.status);
  const playbackError = usePlayerStore((s) => s.error);
  const rows = useMemo(
    () => queueWithPlaybackStatus(queue, currentId, status, playbackError),
    [queue, currentId, status, playbackError],
  );
  const playQueueIndex = usePlayerStore((s) => s.playQueueIndex);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);

  return (
    <QueuePanel
      items={rows}
      currentItemId={currentId ?? undefined}
      isCollapsed={isCollapsed}
      reorderable={false}
      onSelectItem={playQueueIndex}
      onRemoveItem={removeFromQueue}
      labels={QUEUE_LABELS}
    />
  );
}
