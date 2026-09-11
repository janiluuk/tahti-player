import {
  ChevronDownIcon,
  ChevronUpIcon,
  GripVerticalIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';

import { Button, Input, Tooltip } from '@tahti-player/ui';

import {
  useNavigationStructureStore,
  type NavigationStructureItem,
} from '../stores/navigationStructureStore';

export function NavigationStructureWidget() {
  const items = useNavigationStructureStore((state) => state.items);
  const addItem = useNavigationStructureStore((state) => state.addItem);
  const removeItem = useNavigationStructureStore((state) => state.removeItem);
  const moveItem = useNavigationStructureStore((state) => state.moveItem);
  const [label, setLabel] = useState('');
  const [path, setPath] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const add = () => {
    addItem(label, path);
    setLabel('');
    setPath('');
  };

  const moveTo = (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      return;
    }
    const fromIndex = items.findIndex((item) => item.id === draggedId);
    const toIndex = items.findIndex((item) => item.id === targetId);
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }
    const direction = fromIndex < toIndex ? 1 : -1;
    for (let index = fromIndex; index !== toIndex; index += direction) {
      moveItem(draggedId, direction);
    }
    setDraggedId(null);
  };

  return (
    <div
      className="border-primary/40 bg-primary/5 rounded-md border p-4"
      data-testid="navigation-structure-widget"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">
            Navigation structure
          </h3>
          <p className="text-foreground-secondary mt-0.5 text-sm">
            Arrange a saved draft of the navigation. This does not change the
            app yet.
          </p>
        </div>
        <span className="text-foreground-secondary text-xs tracking-wide uppercase">
          {items.length} item{items.length === 1 ? '' : 's'}
        </span>
      </div>

      <ul
        className="mt-4 flex flex-col gap-2"
        aria-label="Navigation structure draft"
      >
        {items.map((item, index) => (
          <NavigationItem
            key={item.id}
            item={item}
            index={index}
            total={items.length}
            onDragStart={() => setDraggedId(item.id)}
            onDragEnd={() => setDraggedId(null)}
            onDrop={() => moveTo(item.id)}
            onMove={(direction) => moveItem(item.id, direction)}
            onRemove={() => removeItem(item.id)}
          />
        ))}
      </ul>

      <div className="border-border mt-4 grid gap-2 border-t pt-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Input
          label="Label"
          placeholder="Community"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
        <Input
          label="Path"
          placeholder="/community"
          value={path}
          onChange={(event) => setPath(event.target.value)}
        />
        <Button
          size="sm"
          onClick={add}
          disabled={!label.trim() || !path.trim()}
        >
          <PlusIcon size={15} aria-hidden />
          Add item
        </Button>
      </div>
    </div>
  );
}

function NavigationItem({
  item,
  index,
  total,
  onDragStart,
  onDragEnd,
  onDrop,
  onMove,
  onRemove,
}: {
  item: NavigationStructureItem;
  index: number;
  total: number;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      className="border-border bg-background flex items-center gap-2 rounded-md border px-2 py-1.5"
    >
      <GripVerticalIcon
        size={17}
        className="text-foreground-secondary shrink-0 cursor-grab"
        aria-label="Drag to reorder"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{item.label}</p>
        <p className="text-foreground-secondary truncate font-mono text-xs">
          {item.path}
        </p>
      </div>
      <Tooltip content="Move up" side="top">
        <Button
          size="icon-sm"
          variant="text"
          disabled={index === 0}
          aria-label={`Move ${item.label} up`}
          onClick={() => onMove(-1)}
        >
          <ChevronUpIcon size={15} aria-hidden />
        </Button>
      </Tooltip>
      <Tooltip content="Move down" side="top">
        <Button
          size="icon-sm"
          variant="text"
          disabled={index === total - 1}
          aria-label={`Move ${item.label} down`}
          onClick={() => onMove(1)}
        >
          <ChevronDownIcon size={15} aria-hidden />
        </Button>
      </Tooltip>
      <Tooltip content="Remove" side="top">
        <Button
          size="icon-sm"
          variant="text"
          intent="danger"
          aria-label={`Remove ${item.label}`}
          onClick={onRemove}
        >
          <Trash2Icon size={15} aria-hidden />
        </Button>
      </Tooltip>
    </li>
  );
}
