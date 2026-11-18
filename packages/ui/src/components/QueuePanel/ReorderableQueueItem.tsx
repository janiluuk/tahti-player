import {
  FC,
  memo,
  type CSSProperties,
  type HTMLAttributes,
  type Ref,
} from 'react';

import type { QueueItem as QueueItemType } from '@tahti-player/model';

import { cn } from '../../utils';
import { QueueItem } from '../QueueItem';
import { type QueueItemLabels } from '../QueueItem/types';
import { QueueItemPopover } from '../QueueItemPopover';
import type { QueueDndModule } from './useQueueDnd';

export type ReorderableQueueItemProps = {
  item: QueueItemType;
  isCurrent: boolean;
  isCollapsed?: boolean;
  isReorderable?: boolean;
  onSelect?: (id: string) => void;
  onRemove?: (id: string) => void;
  onSelectCandidate?: (itemId: string, candidateId: string) => void;
  onTitleClick?: (id: string) => void;
  isLiked?: boolean;
  onToggleLike?: (id: string) => void;
  labels: QueueItemLabels & {
    noCandidates?: string;
    candidateFailed?: string;
  };
};

/** What the drag layer adds to a row once dnd-kit has loaded. */
export type QueueRowSortable = {
  setNodeRef: Ref<HTMLDivElement>;
  style: CSSProperties;
  isDragging: boolean;
  handleProps: HTMLAttributes<HTMLDivElement>;
};

export type QueueRowFrameProps = ReorderableQueueItemProps & {
  sortable?: QueueRowSortable;
};

/** The row without dnd-kit. A reorderable row is focusable from the start
 * so keyboard navigation works before the drag layer has loaded. */
export const QueueRowFrame: FC<QueueRowFrameProps> = ({
  item,
  isCurrent,
  isCollapsed = false,
  isReorderable = false,
  onSelect,
  onRemove,
  onSelectCandidate,
  onTitleClick,
  isLiked,
  onToggleLike,
  labels,
  sortable,
}) => (
  <div
    ref={sortable?.setNodeRef}
    data-queue-item-id={item.id}
    style={sortable?.style}
    className={cn({
      'z-50': sortable?.isDragging,
      'cursor-grab': isReorderable,
    })}
    {...(isReorderable
      ? {
          role: 'button',
          tabIndex: 0,
          ...sortable?.handleProps,
          'aria-label': [
            item.track.title,
            item.track.artists?.map((artist) => artist.name).join(', '),
          ]
            .filter(Boolean)
            .join(' — '),
        }
      : {})}
  >
    <QueueItemPopover
      track={item.track}
      labels={{
        noCandidates: labels.noCandidates,
        failed: labels.candidateFailed,
      }}
      onSelectCandidate={(candidateId) =>
        onSelectCandidate?.(item.id, candidateId)
      }
    >
      <QueueItem
        track={item.track}
        status={item.status}
        isCurrent={isCurrent}
        isCollapsed={isCollapsed}
        errorMessage={item.error}
        onSelect={() => onSelect?.(item.id)}
        onRemove={() => onRemove?.(item.id)}
        onTitleClick={onTitleClick ? () => onTitleClick(item.id) : undefined}
        isLiked={isLiked}
        onToggleLike={onToggleLike ? () => onToggleLike(item.id) : undefined}
        labels={labels}
      />
    </QueueItemPopover>
  </div>
);

const ReorderableQueueItemView: FC<
  ReorderableQueueItemProps & {
    /** The loaded drag layer; rows render without dnd-kit until it is set. */
    dnd?: QueueDndModule | null;
  }
> = ({ dnd, ...props }) =>
  dnd ? <dnd.SortableQueueRow {...props} /> : <QueueRowFrame {...props} />;

export const ReorderableQueueItem = memo(ReorderableQueueItemView);
