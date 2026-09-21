import { DragEndEvent } from '@dnd-kit/core';
import { Music } from 'lucide-react';
import { FC } from 'react';

import type { QueueItem as QueueItemType } from '@tahti-player/model';

import { cn } from '../../utils';
import { type QueueItemLabels } from '../QueueItem/types';
import { ScrollableArea } from '../ScrollableArea';
import { QueueReorderLayer } from './QueueReorderLayer';
import { ReorderableQueueItem } from './ReorderableQueueItem';

/**
 * Above this many items, rows outside the viewport skip layout and paint
 * (`content-visibility: auto`). Unlike list virtualization this keeps every
 * row mounted, so drag-reorder and auto-scroll keep working across the whole
 * queue; it only removes the layout cost of very long queues.
 */
const LONG_QUEUE_THRESHOLD = 100;

export type QueuePanelProps = {
  items: QueueItemType[];
  currentItemId?: string;
  isCollapsed?: boolean;
  fadePastItems?: boolean;
  reorderable?: boolean;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onSelectItem?: (itemId: string) => void;
  onRemoveItem?: (itemId: string) => void;
  onSelectCandidate?: (itemId: string, candidateId: string) => void;
  onTitleClick?: (itemId: string) => void;
  isLiked?: (itemId: string) => boolean;
  onToggleLike?: (itemId: string) => void;
  labels: QueueItemLabels & {
    emptyTitle?: string;
    emptySubtitle?: string;
    noCandidates?: string;
    candidateFailed?: string;
  };
  classes?: {
    root?: string;
    list?: string;
    empty?: string;
  };
};

export const QueuePanel: FC<QueuePanelProps> = ({
  items,
  currentItemId,
  isCollapsed = false,
  fadePastItems = false,
  reorderable = true,
  onReorder,
  onSelectItem,
  onRemoveItem,
  onSelectCandidate,
  onTitleClick,
  isLiked,
  onToggleLike,
  labels,
  classes,
}) => {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) {
      return;
    }

    const fromIndex = items.findIndex((item) => item.id === active.id);
    const toIndex = items.findIndex((item) => item.id === over.id);
    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    onReorder(fromIndex, toIndex);
  };

  if (items.length === 0) {
    return (
      <div
        data-testid="queue-empty-state"
        className={cn(
          'flex h-full min-h-0 flex-col items-center justify-center gap-4 p-8 text-center transition-opacity duration-150',
          {
            'opacity-0': isCollapsed,
            'opacity-100': !isCollapsed,
          },
          classes?.empty,
        )}
      >
        <Music size={64} className="text-foreground-secondary opacity-50" />
        {(labels?.emptyTitle || labels?.emptySubtitle) && (
          <div>
            {labels?.emptyTitle && (
              <div className="text-foreground text-lg font-bold">
                {labels.emptyTitle}
              </div>
            )}
            {labels?.emptySubtitle && (
              <div className="text-foreground-secondary mt-2 text-sm">
                {labels.emptySubtitle}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const skipOffscreenWork = items.length > LONG_QUEUE_THRESHOLD;
  const itemIds = items.map((item) => item.id);
  const currentIndex = currentItemId
    ? items.findIndex((item) => item.id === currentItemId)
    : -1;

  return (
    <div
      data-testid="queue-panel"
      className={cn('flex h-full min-h-0 flex-col', classes?.root)}
    >
      <ScrollableArea className="min-h-0 flex-1" viewportClassName="min-h-0">
        <QueueReorderLayer
          enabled={reorderable}
          items={itemIds}
          onDragEnd={handleDragEnd}
        >
          <div
            className={cn(
              'flex flex-col',
              isCollapsed ? 'items-center gap-1 px-1' : 'gap-1',
              classes?.list,
            )}
          >
            {items.map((item, index) => {
              const pastOffset =
                fadePastItems && currentIndex >= 0 && index < currentIndex
                  ? currentIndex - index
                  : 0;
              return (
                <div
                  key={item.id}
                  className={cn(
                    pastOffset === 1 && 'opacity-55',
                    pastOffset === 2 && 'opacity-35',
                    pastOffset > 2 && 'opacity-20',
                    skipOffscreenWork &&
                      '[contain-intrinsic-size:auto_3.5rem] [content-visibility:auto]',
                  )}
                >
                  <ReorderableQueueItem
                    item={item}
                    isCurrent={item.id === currentItemId}
                    isCollapsed={isCollapsed}
                    isReorderable={reorderable}
                    onSelect={onSelectItem}
                    onRemove={onRemoveItem}
                    onSelectCandidate={onSelectCandidate}
                    onTitleClick={onTitleClick}
                    isLiked={isLiked}
                    onToggleLike={onToggleLike}
                    labels={{
                      removeButton: labels?.removeButton,
                      playbackError: labels?.playbackError,
                      noCandidates: labels?.noCandidates,
                      candidateFailed: labels?.candidateFailed,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </QueueReorderLayer>
      </ScrollableArea>
    </div>
  );
};
