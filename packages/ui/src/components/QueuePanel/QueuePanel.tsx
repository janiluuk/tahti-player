import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  defaultRangeExtractor,
  useVirtualizer,
  type Range,
} from '@tanstack/react-virtual';
import { Music } from 'lucide-react';
import {
  FC,
  KeyboardEvent,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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
 * Above this many items only the rows in and near the viewport are mounted.
 * The row being dragged always stays mounted, and dnd-kit's auto-scroll
 * mounts rows as it scrolls, so drag-reorder still works across the queue.
 */
export const VIRTUALIZE_THRESHOLD = 200;

const ROW_GAP_PX = 4;
const ROW_ESTIMATE_PX = 56;
const COLLAPSED_ROW_ESTIMATE_PX = 48;
const OVERSCAN_ROWS = 12;
const PAGE_ROWS = 10;

/** Index a navigation key moves focus to, or null for any other key. */
export const keyboardTargetIndex = (
  key: string,
  index: number,
  count: number,
): number | null => {
  const last = count - 1;
  switch (key) {
    case 'ArrowDown':
      return Math.min(last, index + 1);
    case 'ArrowUp':
      return Math.max(0, index - 1);
    case 'PageDown':
      return Math.min(last, index + PAGE_ROWS);
    case 'PageUp':
      return Math.max(0, index - PAGE_ROWS);
    case 'Home':
      return 0;
    case 'End':
      return last;
    default:
      return null;
  }
};

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

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDraggingId(String(event.active.id));
  }, []);
  const handleDragCancel = useCallback(() => setDraggingId(null), []);

  const handleReorder = useStableHandler(onReorder);
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDraggingId(null);
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

  const virtualize = items.length > VIRTUALIZE_THRESHOLD;
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const draggingIndex =
    draggingId !== null ? indexById.get(draggingId) : undefined;
  const rangeExtractor = useCallback(
    (range: Range) => {
      const indexes = defaultRangeExtractor(range);
      if (draggingIndex === undefined || indexes.includes(draggingIndex)) {
        return indexes;
      }
      return [...indexes, draggingIndex].sort((a, b) => a - b);
    },
    [draggingIndex],
  );
  const virtualizer = useVirtualizer({
    count: virtualize ? items.length : 0,
    getScrollElement: () => viewportRef.current,
    estimateSize: () =>
      isCollapsed ? COLLAPSED_ROW_ESTIMATE_PX : ROW_ESTIMATE_PX,
    getItemKey: (index) => itemIds[index] ?? index,
    gap: ROW_GAP_PX,
    overscan: OVERSCAN_ROWS,
    rangeExtractor,
  });

  const currentIndex = currentItemId
    ? (indexById.get(currentItemId) ?? -1)
    : -1;
  useEffect(() => {
    if (virtualize && currentIndex >= 0) {
      virtualizer.scrollToIndex(currentIndex, { align: 'auto' });
    }
  }, [virtualize, currentIndex, virtualizer]);

  const [focusTargetId, setFocusTargetId] = useState<string | null>(null);
  const focusRow = useCallback((id: string) => {
    const row = Array.from(
      viewportRef.current?.querySelectorAll<HTMLElement>(
        '[data-queue-item-id]',
      ) ?? [],
    ).find((element) => element.getAttribute('data-queue-item-id') === id);
    row?.focus();
    return Boolean(row);
  }, []);
  useEffect(() => {
    if (focusTargetId !== null && focusRow(focusTargetId)) {
      setFocusTargetId(null);
    }
  });

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (draggingId !== null || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    const target = event.target as HTMLElement;
    const id = target.getAttribute('data-queue-item-id');
    const index = id === null ? undefined : indexById.get(id);
    if (id === null || index === undefined) {
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSelect?.(id);
      return;
    }
    const nextIndex = keyboardTargetIndex(event.key, index, items.length);
    const nextId = nextIndex === null ? undefined : itemIds[nextIndex];
    if (nextIndex === null || nextId === undefined) {
      return;
    }
    event.preventDefault();
    if (nextId === id) {
      return;
    }
    if (virtualize) {
      virtualizer.scrollToIndex(nextIndex, { align: 'auto' });
    }
    if (!focusRow(nextId)) {
      setFocusTargetId(nextId);
    }
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

  const skipOffscreenWork = !virtualize && items.length > LONG_QUEUE_THRESHOLD;

  const renderRow = (item: QueueItemType, index: number) => {
    const pastOffset =
      fadePastItems && currentIndex >= 0 && index < currentIndex
        ? currentIndex - index
        : 0;
    return {
      className: cn(
        pastOffset === 1 && 'opacity-55',
        pastOffset === 2 && 'opacity-35',
        pastOffset > 2 && 'opacity-20',
      ),
      row: (
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
      ),
    };
  };

  return (
    <div
      data-testid="queue-panel"
      className={cn('flex h-full min-h-0 flex-col', classes?.root)}
    >
      <ScrollableArea
        className="min-h-0 flex-1"
        viewportClassName="min-h-0"
        viewportRef={viewportRef}
      >
        <QueueReorderLayer
          enabled={reorderable}
          items={itemIds}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {virtualize ? (
            <div
              onKeyDown={handleKeyDown}
              data-testid="queue-virtual-list"
              className={cn('relative', isCollapsed && 'px-1', classes?.list)}
              style={{ height: virtualizer.getTotalSize() }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const item = items[virtualRow.index];
                if (!item) {
                  return null;
                }
                const { className, row } = renderRow(item, virtualRow.index);
                return (
                  <div
                    key={item.id}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    className={cn(
                      'absolute top-0 left-0 w-full',
                      isCollapsed && 'flex justify-center',
                      className,
                    )}
                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                  >
                    {row}
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              onKeyDown={handleKeyDown}
              className={cn(
                'flex flex-col',
                isCollapsed ? 'items-center gap-1 px-1' : 'gap-1',
                classes?.list,
              )}
            >
              {items.map((item, index) => {
                const { className, row } = renderRow(item, index);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      className,
                      skipOffscreenWork &&
                        '[contain-intrinsic-size:auto_3.5rem] [content-visibility:auto]',
                    )}
                  >
                    {row}
                  </div>
                );
              })}
            </div>
          )}
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
