import { useNavigate } from '@tanstack/react-router';
import { Trash2Icon } from 'lucide-react';
import { useMemo } from 'react';

import { Button, QueuePanel, Tooltip } from '@tahti-player/ui';

import { cn } from '../lib/cn';
import { soundIdFromPlayableId } from '../lib/soundId';
import { useLibraryStore } from '../stores/libraryStore';
import { playableFromQueueItem, usePlayerStore } from '../stores/playerStore';
import { useQueueBarActions } from './useQueueBarActions';

const QUEUE_VIEWPORT_MAX = 'max-h-80';

export function SidebarQueuePanel({
  compact = false,
  toolbar = true,
}: {
  compact?: boolean;
  /** Off when the host renders the queue actions itself (right-rail header). */
  toolbar?: boolean;
}) {
  const navigate = useNavigate();
  const queue = usePlayerStore((s) => s.queue);
  const currentId = usePlayerStore((s) => s.currentId);
  const playQueueIndex = usePlayerStore((s) => s.playQueueIndex);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const reorderQueue = usePlayerStore((s) => s.reorderQueue);
  const toggleFavoriteTrack = useLibraryStore((s) => s.toggleFavoriteTrack);
  const favoriteTracks = useLibraryStore((s) => s.favoriteTracks);
  const queueById = useMemo(
    () => new Map(queue.map((item) => [item.id, item])),
    [queue],
  );
  const favoriteIds = useMemo(
    () => new Set(favoriteTracks.map((track) => track.id)),
    [favoriteTracks],
  );
  const { requestClear, menuItems, dialogs } = useQueueBarActions();

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
            const item = queueById.get(id);
            const soundId = item
              ? soundIdFromPlayableId(item.track.source.id)
              : null;
            if (soundId) {
              void navigate({ to: '/t/$id', params: { id: soundId } });
            }
          }}
          isLiked={(id) => {
            const item = queueById.get(id);
            const soundId = item
              ? soundIdFromPlayableId(item.track.source.id)
              : null;
            return soundId ? favoriteIds.has(soundId) : false;
          }}
          onToggleLike={(id) => {
            const item = queueById.get(id);
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

      {toolbar ? (
        <div className="border-border flex shrink-0 items-center justify-center gap-1 border-t px-2 py-1.5">
          <Tooltip content="Clear queue" side="top">
            <Button
              size="icon-sm"
              variant="text"
              disabled={queue.length === 0}
              onClick={requestClear}
              className="text-foreground-secondary hover:text-accent-red"
              aria-label="Clear queue"
            >
              <Trash2Icon size={15} aria-hidden />
            </Button>
          </Tooltip>
          {menuItems.map((item) => (
            <Tooltip key={item.id} content={item.label} side="top">
              <Button
                size="icon-sm"
                variant="text"
                disabled={item.disabled}
                onClick={item.onClick}
                className="text-foreground-secondary hover:text-foreground"
                aria-label={item.label}
              >
                {item.icon}
              </Button>
            </Tooltip>
          ))}
        </div>
      ) : null}

      {toolbar ? dialogs : null}
    </div>
  );
}
