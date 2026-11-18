import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FC } from 'react';

import { cn } from '../../utils';
import {
  BlockFrame,
  type BlockFrameProps,
  type SortableBlocksProps,
} from './SortableBlocks';

const POINTER_SENSOR_OPTIONS = {
  activationConstraint: { distance: 5 },
};

const KEYBOARD_SENSOR_OPTIONS = {
  coordinateGetter: sortableKeyboardCoordinates,
};

const SortableBlockFrame: FC<Omit<BlockFrameProps, 'sortable'>> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.block.id, disabled: !props.reordering });

  return (
    <BlockFrame
      {...props}
      sortable={{
        setNodeRef,
        setActivatorNodeRef,
        style: { transform: CSS.Transform.toString(transform), transition },
        isDragging,
        handleProps: { ...attributes, ...listeners },
      }}
    />
  );
};

export const SortableBlocksDnd: FC<SortableBlocksProps> = ({
  blocks,
  reordering,
  onReorder,
  moveLabel = (label) => `Move ${label}`,
  onRemove,
  removeLabel = (label) => `Remove ${label}`,
  className,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, POINTER_SENSOR_OPTIONS),
    useSensor(KeyboardSensor, KEYBOARD_SENSOR_OPTIONS),
  );
  const ids = blocks.map((block) => block.id);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) {
      return;
    }
    onReorder(arrayMove(ids, from, to));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div
          className={cn('flex flex-col gap-4', className)}
          data-reordering={reordering ? '' : undefined}
          data-drag-ready=""
        >
          {blocks.map((block) => (
            <SortableBlockFrame
              key={block.id}
              block={block}
              reordering={reordering}
              moveLabel={moveLabel}
              onRemove={onRemove}
              removeLabel={removeLabel}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
