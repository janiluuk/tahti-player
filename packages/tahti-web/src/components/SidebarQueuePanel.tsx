import { useNavigate } from '@tanstack/react-router';
import { Trash2Icon } from 'lucide-react';
import { useCallback, useMemo } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, ButtonLink, QueuePanel, Tooltip } from '@tahti-player/ui';

import { useTrackLikes } from '../hooks/useTrackLikes';
import { cn } from '../lib/cn';
import { queueWithPlaybackStatus } from '../lib/queueItemStatus';
import { soundIdFromPlayableId } from '../lib/soundId';
import { playableFromQueueItem, usePlayerStore } from '../stores/playerStore';
import { useQueueBarActions } from './useQueueBarActions';

const QUEUE_VIEWPORT_MAX = 'max-h-80';

const QUEUE_LABELS = {
  emptyTitle: 'Queue empty',
  emptySubtitle: 'Play a channel or radio to start listening',
  removeButton: 'Remove from queue',
  playbackError: 'Could not play',
  noCandidates: 'No stream',
  candidateFailed: 'Stream failed',
};

export function SidebarQueuePanel({
  compact = false,
  toolbar = true,
}: {
  compact?: boolean;
  /** Off when the host renders the queue actions itself (right-rail header). */
  toolbar?: boolean;
}) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
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
  const reorderQueue = usePlayerStore((s) => s.reorderQueue);
  const { signedIn, isLiked: isTrackLiked, toggleLike } = useTrackLikes();
  const queueById = useMemo(
    () => new Map(queue.map((item) => [item.id, item])),
    [queue],
  );
  const { requestClear, menuItems, dialogs } = useQueueBarActions();

  const soundIdFor = useCallback(
    (id: string) => {
      const item = queueById.get(id);
      return item ? soundIdFromPlayableId(item.track.source.id) : null;
    },
    [queueById],
  );
  const handleTitleClick = useCallback(
    (id: string) => {
      const soundId = soundIdFor(id);
      if (soundId) {
        void navigate({ to: '/t/$id', params: { id: soundId } });
      }
    },
    [navigate, soundIdFor],
  );
  const isLiked = useCallback(
    (id: string) => {
      const soundId = soundIdFor(id);
      return soundId
        ? isTrackLiked({ id: `sound:${soundId}`, kind: 'sound' })
        : false;
    },
    [isTrackLiked, soundIdFor],
  );
  const handleToggleLike = useCallback(
    (id: string) => {
      const item = queueById.get(id);
      const playable = item ? playableFromQueueItem(item) : null;
      if (playable) {
        toggleLike(playable);
      }
    },
    [queueById, toggleLike],
  );

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
          items={rows}
          currentItemId={currentId ?? undefined}
          fadePastItems
          reorderable
          onReorder={reorderQueue}
          onSelectItem={playQueueIndex}
          onRemoveItem={removeFromQueue}
          onTitleClick={handleTitleClick}
          isLiked={isLiked}
          onToggleLike={signedIn ? handleToggleLike : undefined}
          labels={QUEUE_LABELS}
          emptyAction={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <ButtonLink to="/discover" size="sm" variant="secondary">
                {t('sidebarQueuePanel.discover')}
              </ButtonLink>
              <ButtonLink to="/radio" size="sm" variant="secondary">
                {t('sidebarQueuePanel.radio')}
              </ButtonLink>
            </div>
          }
        />
      </div>

      {toolbar ? (
        <div className="border-border flex shrink-0 items-center justify-center gap-1 border-t px-2 py-1.5">
          <Tooltip content={t('sidebarQueuePanel.clearQueue')} side="top">
            <Button
              size="icon-sm"
              variant="text"
              disabled={queue.length === 0}
              onClick={requestClear}
              className="text-foreground-secondary hover:text-accent-red-strong"
              aria-label={t('sidebarQueuePanel.clearQueue')}
            >
              <Trash2Icon
                className="text-accent-red-strong"
                size={15}
                aria-hidden
              />
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
