import { DragEndEvent } from '@dnd-kit/core';
import { Music } from 'lucide-react';
import { FC, memo, useCallback, useLayoutEffect, useMemo, useRef } from 'react';

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

/**
 * Returns a callback whose identity never changes while `handler` stays
 * defined, so memoized rows skip re-rendering when a parent passes a fresh
 * inline function every render. Returns `undefined` when `handler` is absent
 * because rows render differently (no like button, inert title) without it.
 */
const useStableHandler = <Args extends unknown[]>(
  handler: ((...args: Args) => void) | undefined,
): ((...args: Args) => void) | undefined => {
  const ref = useRef(handler);
  useLayoutEffect(() => {
    ref.current = handler;
  });
  const stable = useCallback((...args: Args) => ref.current?.(...args), []);
  return handler ? stable : undefined;
};

export const resolveReorder = (
  indexById: ReadonlyMap<string, number>,
  activeId: string,
  overId: string | undefined,
): [fromIndex: number, toIndex: number] | null => {
  if (overId === undefined || activeId === overId) {
    return null;
  }
  const fromIndex = indexById.get(activeId);
  const toIndex = indexById.get(overId);
  if (fromIndex === undefined || toIndex === undefined) {
    return null;
  }
  return [fromIndex, toIndex];
};

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

const QueuePanelView: FC<QueuePanelProps> = ({
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
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const indexById = useMemo(
    () => new Map(itemIds.map((id, index) => [id, index])),
    [itemIds],
  );

  const handleReorder = useStableHandler(onReorder);
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const move = resolveReorder(
        indexById,
        String(event.active.id),
        event.over ? String(event.over.id) : undefined,
      );
      if (move && handleReorder) {
        handleReorder(...move);
      }
    },
    [indexById, handleReorder],
  );

  const handleSelect = useStableHandler(onSelectItem);
  const handleRemove = useStableHandler(onRemoveItem);
  const handleSelectCandidate = useStableHandler(onSelectCandidate);
  const handleTitleClick = useStableHandler(onTitleClick);
  const handleToggleLike = useStableHandler(onToggleLike);

  const { removeButton, playbackError, noCandidates, candidateFailed } =
    labels ?? {};
  const rowLabels = useMemo(
    () => ({ removeButton, playbackError, noCandidates, candidateFailed }),
    [removeButton, playbackError, noCandidates, candidateFailed],
  );

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
  const currentIndex = currentItemId
    ? (indexById.get(currentItemId) ?? -1)
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
                    onSelect={handleSelect}
                    onRemove={handleRemove}
                    onSelectCandidate={handleSelectCandidate}
                    onTitleClick={handleTitleClick}
                    isLiked={isLiked?.(item.id)}
                    onToggleLike={handleToggleLike}
                    labels={rowLabels}
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

/**
 * Rows are memoized: re-rendering the panel only re-renders rows whose item,
 * current/liked state or layout flags changed. `isLiked` is evaluated here
 * per row, so it may be a fresh closure over a favorites Set each render.
 */
export const QueuePanel = memo(QueuePanelView);
