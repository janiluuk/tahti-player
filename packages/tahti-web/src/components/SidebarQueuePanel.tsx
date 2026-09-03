import { useNavigate } from '@tanstack/react-router';
import { ListMusicIcon, ShuffleIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';

import { Button, QueuePanel } from '@tahti-player/ui';

import { soundIdFromPlayableId } from '../lib/archiveId';
import { cn } from '../lib/cn';
import { useLibraryStore } from '../stores/libraryStore';
import { playableFromQueueItem, usePlayerStore } from '../stores/playerStore';
import { ClearQueueConfirmDialog } from './ClearQueueConfirmDialog';
import { SaveQueueAsPlaylistDialog } from './SaveQueueAsPlaylistDialog';

const QUEUE_VIEWPORT_MAX = 'max-h-80';

export function SidebarQueuePanel({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const queue = usePlayerStore((s) => s.queue);
  const currentId = usePlayerStore((s) => s.currentId);
  const playQueueIndex = usePlayerStore((s) => s.playQueueIndex);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const reorderQueue = usePlayerStore((s) => s.reorderQueue);
  const shuffleQueueOrder = usePlayerStore((s) => s.shuffleQueueOrder);
  const toggleFavoriteTrack = useLibraryStore((s) => s.toggleFavoriteTrack);
  const isFavoriteTrack = useLibraryStore((s) => s.isFavoriteTrack);

  const [confirmingClear, setConfirmingClear] = useState(false);
  const [savingAsPlaylist, setSavingAsPlaylist] = useState(false);

  return (
    <div
      className={cn(
        'flex min-h-0 flex-col',
        compact ? QUEUE_VIEWPORT_MAX : 'h-full',
      )}
      data-testid="sidebar-queue"
    >
      <div className="min-h-0 flex-1">
        <QueuePanel
          items={queue}
          currentItemId={currentId ?? undefined}
          fadePastItems
          reorderable
          onReorder={reorderQueue}
          onSelectItem={(id) => playQueueIndex(id)}
          onRemoveItem={(id) => removeFromQueue(id)}
          onTitleClick={(id) => {
            const item = queue.find((q) => q.id === id);
            const soundId = item
              ? soundIdFromPlayableId(item.track.source.id)
              : null;
            if (soundId) {
              void navigate({ to: '/t/$id', params: { id: soundId } });
            }
          }}
          isLiked={(id) => {
            const item = queue.find((q) => q.id === id);
            const soundId = item
              ? soundIdFromPlayableId(item.track.source.id)
              : null;
            return soundId ? isFavoriteTrack(soundId) : false;
          }}
          onToggleLike={(id) => {
            const item = queue.find((q) => q.id === id);
            if (!item) {
              return;
            }
            const playable = playableFromQueueItem(item);
            if (playable) {
              toggleFavoriteTrack(playable);
            }
          }}
          labels={{
            emptyTitle: 'Queue empty',
            emptySubtitle: 'Play a channel or radio to start listening',
            removeButton: 'Remove from queue',
            playbackError: 'Could not play',
            noCandidates: 'No stream',
            candidateFailed: 'Stream failed',
          }}
        />
      </div>

      <div className="border-border flex shrink-0 items-center justify-center gap-1 border-t px-2 py-1.5">
        <Button
          size="icon-sm"
          variant="text"
          disabled={queue.length === 0}
          onClick={() => setConfirmingClear(true)}
          className="text-foreground-secondary hover:text-accent-red"
          title="Clear queue"
          aria-label="Clear queue"
        >
          <Trash2Icon size={15} aria-hidden />
        </Button>
        <Button
          size="icon-sm"
          variant="text"
          disabled={queue.length === 0}
          onClick={() => setSavingAsPlaylist(true)}
          className="text-foreground-secondary hover:text-foreground"
          title="Save queue as playlist"
          aria-label="Save queue as playlist"
        >
          <ListMusicIcon size={15} aria-hidden />
        </Button>
        <Button
          size="icon-sm"
          variant="text"
          disabled={queue.length < 2}
          onClick={shuffleQueueOrder}
          className="text-foreground-secondary hover:text-foreground"
          title="Randomize queue order"
          aria-label="Randomize queue order"
        >
          <ShuffleIcon size={15} aria-hidden />
        </Button>
      </div>

      <ClearQueueConfirmDialog
        isOpen={confirmingClear}
        count={queue.length}
        onCancel={() => setConfirmingClear(false)}
        onConfirm={() => {
          clearQueue();
          setConfirmingClear(false);
        }}
      />
      <SaveQueueAsPlaylistDialog
        isOpen={savingAsPlaylist}
        onClose={() => setSavingAsPlaylist(false)}
      />
    </div>
  );
}
