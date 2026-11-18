import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FC } from 'react';

import {
  QueueRowFrame,
  type ReorderableQueueItemProps,
} from './ReorderableQueueItem';

export { QueueReorderLayer } from './QueueReorderLayer';

export const SortableQueueRow: FC<ReorderableQueueItemProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.item.id,
    disabled: !props.isReorderable,
  });

  return (
    <QueueRowFrame
      {...props}
      sortable={{
        setNodeRef,
        style: { transform: CSS.Transform.toString(transform), transition },
        isDragging,
        handleProps: { ...attributes, ...listeners },
      }}
    />
  );
};
