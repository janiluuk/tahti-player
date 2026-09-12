import {
  ChevronDownIcon,
  ChevronRightIcon,
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

function countAll(items: NavigationStructureItem[]): number {
  return items.reduce(
    (total, item) => total + 1 + countAll(item.children ?? []),
    0,
  );
}

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

  const moveTo = (siblings: NavigationStructureItem[], targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      return;
    }
    const fromIndex = siblings.findIndex((item) => item.id === draggedId);
    const toIndex = siblings.findIndex((item) => item.id === targetId);
    if (fromIndex < 0 || toIndex < 0) {
      // Dragged item isn't a sibling of the drop target — reordering only
      // happens within the same nesting level.
      setDraggedId(null);
      return;
    }
    const direction = fromIndex < toIndex ? 1 : -1;
    for (let index = fromIndex; index !== toIndex; index += direction) {
      moveItem(draggedId, direction);
    }
    setDraggedId(null);
  };

  const totalCount = countAll(items);

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
            Arrange a saved draft of the navigation, including submenus. This
            does not change the app yet.
          </p>
        </div>
        <span className="text-foreground-secondary text-xs tracking-wide uppercase">
          {totalCount} item{totalCount === 1 ? '' : 's'}
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
            depth={0}
            siblings={items}
            onDragStart={setDraggedId}
            onDragEnd={() => setDraggedId(null)}
            onDrop={moveTo}
            onMove={(id, direction) => moveItem(id, direction)}
            onRemove={(id) => removeItem(id)}
            onAddChild={(parentId, childLabel, childPath) =>
              addItem(childLabel, childPath, parentId)
            }
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
          Add top-level item
        </Button>
      </div>
    </div>
  );
}

function AddChildForm({
  onAdd,
  onCancel,
}: {
  onAdd: (label: string, path: string) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState('');
  const [path, setPath] = useState('');

  const submit = () => {
    if (!label.trim() || !path.trim()) {
      return;
    }
    onAdd(label, path);
    setLabel('');
    setPath('');
    onCancel();
  };

  return (
    <div className="border-border bg-background-secondary/40 mt-1 grid gap-2 rounded-md border p-2 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
      <Input
        label="Label"
        placeholder="Sub-item"
        value={label}
        onChange={(event) => setLabel(event.target.value)}
      />
      <Input
        label="Path"
        placeholder="/parent/sub-item"
        value={path}
        onChange={(event) => setPath(event.target.value)}
      />
      <Button
        size="sm"
        onClick={submit}
        disabled={!label.trim() || !path.trim()}
      >
        Add
      </Button>
      <Button size="sm" variant="text" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

function NavigationItem({
  item,
  index,
  total,
  depth,
  onDragStart,
  onDragEnd,
  onDrop,
  onMove,
  onRemove,
  onAddChild,
  siblings,
}: {
  item: NavigationStructureItem;
  index: number;
  total: number;
  depth: number;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (siblings: NavigationStructureItem[], targetId: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
  onAddChild: (parentId: string, label: string, path: string) => void;
  siblings: NavigationStructureItem[];
}) {
  const children = item.children ?? [];
  const [expanded, setExpanded] = useState(true);
  const [addingChild, setAddingChild] = useState(false);

  return (
    <li>
      <div
        draggable
        onDragStart={() => onDragStart(item.id)}
        onDragEnd={onDragEnd}
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => onDrop(siblings, item.id)}
        className="border-border bg-background flex items-center gap-2 rounded-md border px-2 py-1.5"
        style={{ marginLeft: depth * 20 }}
      >
        {children.length > 0 ? (
          <Button
            size="icon-sm"
            variant="text"
            aria-label={
              expanded ? `Collapse ${item.label}` : `Expand ${item.label}`
            }
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? (
              <ChevronDownIcon size={15} aria-hidden />
            ) : (
              <ChevronRightIcon size={15} aria-hidden />
            )}
          </Button>
        ) : (
          <span className="size-8 shrink-0" aria-hidden />
        )}
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
        <Tooltip content="Add sub-item" side="top">
          <Button
            size="icon-sm"
            variant="text"
            aria-label={`Add sub-item under ${item.label}`}
            onClick={() => {
              setAddingChild((value) => !value);
              setExpanded(true);
            }}
          >
            <PlusIcon size={15} aria-hidden />
          </Button>
        </Tooltip>
        <Tooltip content="Move up" side="top">
          <Button
            size="icon-sm"
            variant="text"
            disabled={index === 0}
            aria-label={`Move ${item.label} up`}
            onClick={() => onMove(item.id, -1)}
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
            onClick={() => onMove(item.id, 1)}
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
            onClick={() => onRemove(item.id)}
          >
            <Trash2Icon size={15} aria-hidden />
          </Button>
        </Tooltip>
      </div>

      {addingChild && (
        <div style={{ marginLeft: (depth + 1) * 20 }}>
          <AddChildForm
            onAdd={(childLabel, childPath) =>
              onAddChild(item.id, childLabel, childPath)
            }
            onCancel={() => setAddingChild(false)}
          />
        </div>
      )}

      {expanded && children.length > 0 && (
        <ul
          className="mt-2 flex flex-col gap-2"
          aria-label={`${item.label} submenu`}
        >
          {children.map((child, childIndex) => (
            <NavigationItem
              key={child.id}
              item={child}
              index={childIndex}
              total={children.length}
              depth={depth + 1}
              siblings={children}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDrop={onDrop}
              onMove={onMove}
              onRemove={onRemove}
              onAddChild={onAddChild}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
