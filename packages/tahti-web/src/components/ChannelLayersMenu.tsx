import {
  EyeIcon,
  EyeOffIcon,
  GripVerticalIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@nuclearplayer/ui';

import {
  CHANNEL_PAGE_ITEM_META,
  CHANNEL_PAGE_ITEM_TYPES,
  type ChannelPageItem,
  type ChannelPageItemType,
} from '../lib/channelPageLayout';

type Props = {
  items: ChannelPageItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (type: ChannelPageItemType) => void;
  onReorder: (fromId: string, toId: string) => void;
  lookSlot?: React.ReactNode;
};

export function ChannelLayersMenu({
  items,
  selectedId,
  onSelect,
  onToggleVisible,
  onRemove,
  onAdd,
  onReorder,
  lookSlot,
}: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [panel, setPanel] = useState<'layers' | 'add' | 'look'>('layers');

  const hiddenCatalog = CHANNEL_PAGE_ITEM_TYPES.filter((type) => {
    const row = items.find((i) => i.type === type);
    return !row || !row.visible;
  });

  return (
    <aside className="border-border bg-background flex h-full min-h-0 w-full flex-col border-l sm:w-72">
      <div className="border-border flex gap-1 border-b p-2">
        {(
          [
            { id: 'layers' as const, label: 'Layers' },
            { id: 'add' as const, label: 'Add' },
            { id: 'look' as const, label: 'Look' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setPanel(t.id)}
            className={`flex-1 rounded-md px-2 py-1.5 text-[10px] font-medium tracking-wide uppercase ${
              panel === t.id
                ? 'bg-primary text-foreground'
                : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {panel === 'layers' && (
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const meta = CHANNEL_PAGE_ITEM_META[item.type];
              const selected = selectedId === item.id;
              return (
                <li
                  key={item.id}
                  draggable
                  onDragStart={() => setDragId(item.id)}
                  onDragEnd={() => setDragId(null)}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragId) {
                      onReorder(dragId, item.id);
                    }
                    setDragId(null);
                  }}
                  className={`border-border flex items-center gap-1 rounded-lg border px-1.5 py-1.5 ${
                    selected ? 'border-primary/60 bg-primary/10' : ''
                  } ${dragId === item.id ? 'opacity-50' : ''} ${
                    item.visible ? '' : 'opacity-60'
                  }`}
                >
                  <button
                    type="button"
                    className="text-foreground-secondary hover:text-foreground cursor-grab px-0.5 active:cursor-grabbing"
                    aria-label={`Drag ${meta.label}`}
                    title="Drag to reorder"
                  >
                    <GripVerticalIcon size={14} />
                  </button>
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => onSelect(item.id)}
                  >
                    <div className="truncate text-xs font-medium">
                      {meta.label}
                    </div>
                    <div className="text-foreground-secondary truncate text-[10px]">
                      {meta.hint}
                    </div>
                  </button>
                  <button
                    type="button"
                    className="text-foreground-secondary hover:text-foreground rounded p-1"
                    aria-label={item.visible ? 'Hide' : 'Show'}
                    onClick={() => onToggleVisible(item.id)}
                  >
                    {item.visible ? (
                      <EyeIcon size={14} />
                    ) : (
                      <EyeOffIcon size={14} />
                    )}
                  </button>
                  <button
                    type="button"
                    className="text-foreground-secondary hover:text-foreground rounded p-1"
                    aria-label="Remove from page"
                    onClick={() => onRemove(item.id)}
                  >
                    <Trash2Icon size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {panel === 'add' && (
          <div className="flex flex-col gap-2">
            <p className="text-foreground-secondary text-xs">
              Add a hidden block back onto the channel page.
            </p>
            {hiddenCatalog.length === 0 ? (
              <p className="text-foreground-secondary text-xs">
                Every block type is already on the page.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {hiddenCatalog.map((type) => {
                  const meta = CHANNEL_PAGE_ITEM_META[type];
                  return (
                    <li key={type}>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full justify-start"
                        onClick={() => {
                          onAdd(type);
                          setPanel('layers');
                        }}
                      >
                        <span className="inline-flex items-center gap-2">
                          <PlusIcon size={14} />
                          {meta.label}
                        </span>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {panel === 'look' && (
          <div className="flex flex-col gap-3">
            {lookSlot ?? (
              <p className="text-foreground-secondary text-xs">
                Look controls unavailable.
              </p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
