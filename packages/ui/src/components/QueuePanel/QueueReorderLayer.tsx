import type { DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FC, ReactNode } from 'react';

const DRAG_ACTIVATION_DISTANCE_PX = 5;

/** Module-level so `useSensors` keeps its identity and sortable rows skip re-rendering. */
const POINTER_SENSOR_OPTIONS = {
  activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE_PX },
};

type QueueReorderLayerProps = {
  enabled: boolean;
  items: string[];
  onDragStart?: () => void;
  onDragEnd?: (evt: DragEndEvent) => void;
  children: ReactNode;
};

export const QueueReorderLayer: FC<QueueReorderLayerProps> = ({
  enabled,
  items,
  onDragStart,
  onDragEnd,
  children,
}) => {
  const sensors = useSensors(useSensor(PointerSensor, POINTER_SENSOR_OPTIONS));

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
};
