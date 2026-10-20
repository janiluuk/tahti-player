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
import { GripVerticalIcon } from 'lucide-react';
import { FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { Button } from '../Button';

export type SortableBlock = {
  id: string;
  label: string;
  content: ReactNode;
};

type SortableBlocksProps = {
  blocks: SortableBlock[];
  reordering: boolean;
  onReorder: (ids: string[]) => void;
  moveLabel?: (label: string) => string;
  className?: string;
};

const POINTER_SENSOR_OPTIONS = {
  activationConstraint: { distance: 5 },
};

const KEYBOARD_SENSOR_OPTIONS = {
  coordinateGetter: sortableKeyboardCoordinates,
};

const SortableBlockFrame: FC<{
  block: SortableBlock;
  reordering: boolean;
  moveLabel: (label: string) => string;
}> = ({ block, reordering, moveLabel }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, disabled: !reordering });

  return (
    <div
      ref={setNodeRef}
      data-sortable-block={block.id}
      style={
        reordering
          ? { transform: CSS.Transform.toString(transform), transition }
          : undefined
      }
      className={cn(
        'relative flex min-w-0 flex-col',
        reordering &&
          'border-border bg-background gap-2 rounded-xl border border-dashed p-2',
        isDragging && 'z-10 opacity-70 shadow-lg',
      )}
    >
      {reordering ? (
        <div className="text-foreground-secondary flex items-center gap-2 text-xs font-bold tracking-wide uppercase">
          <Button
            ref={setActivatorNodeRef}
            type="button"
            size="icon-sm"
            variant="text"
            className="cursor-grab touch-none active:cursor-grabbing"
            aria-label={moveLabel(block.label)}
            {...attributes}
            {...listeners}
          >
            <GripVerticalIcon size={16} aria-hidden />
          </Button>
          <span className="truncate">{block.label}</span>
        </div>
      ) : null}
      {block.content}
    </div>
  );
};

/** A vertical stack of page blocks. With `reordering` on, each block gets a
 * dashed frame and a drag handle (pointer or keyboard: Space, arrows,
 * Space); off, the blocks render as a plain stack. The tree stays the same
 * either way, so toggling never remounts a block's content. */
export const SortableBlocks: FC<SortableBlocksProps> = ({
  blocks,
  reordering,
  onReorder,
  moveLabel = (label) => `Move ${label}`,
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
        >
          {blocks.map((block) => (
            <SortableBlockFrame
              key={block.id}
              block={block}
              reordering={reordering}
              moveLabel={moveLabel}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
