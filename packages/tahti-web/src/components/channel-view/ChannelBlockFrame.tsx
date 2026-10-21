import { GripVerticalIcon, XIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button, Tooltip } from '@tahti-player/ui';

import type { MoveDragState } from '../../hooks/useChannelLayoutEditing';
import {
  CHANNEL_PAGE_ITEM_META,
  moveItem,
  setItemOffset,
  type ChannelPageItem,
} from '../../lib/channelPageLayout';

/** Draggable blocks lock to a 16px grid — keeps free-form offsets tidy
 * instead of landing on arbitrary pixel values. */
const LAYOUT_GRID_SIZE = 16;
const snapToGrid = (value: number) =>
  Math.round(value / LAYOUT_GRID_SIZE) * LAYOUT_GRID_SIZE;

type Props = {
  item: ChannelPageItem;
  editing: boolean;
  selected: boolean;
  dragId: string | null;
  setDragId: (id: string | null) => void;
  moveDrag: MoveDragState;
  setMoveDrag: (drag: MoveDragState) => void;
  onSelect: (id: string) => void;
  updateLayout: (
    updater:
      ChannelPageItem[] | ((prev: ChannelPageItem[]) => ChannelPageItem[]),
  ) => void;
  onRemove: (id: string) => void;
  children: ReactNode;
};

/** One block on the page. In edit mode it becomes selectable, draggable to
 * reorder, and placeable with a free-offset handle. */
export function ChannelBlockFrame({
  item,
  editing,
  selected,
  dragId,
  setDragId,
  moveDrag,
  setMoveDrag,
  onSelect,
  updateLayout,
  onRemove,
  children,
}: Props) {
  const metaItem = CHANNEL_PAGE_ITEM_META[item.type];
  return (
    <div
      draggable={editing}
      onDragStart={() => {
        if (editing) {
          setDragId(item.id);
        }
      }}
      onDragEnd={() => setDragId(null)}
      onDragOver={(e) => {
        if (editing) {
          e.preventDefault();
        }
      }}
      onDrop={(e) => {
        if (!editing || !dragId) {
          return;
        }
        e.preventDefault();
        updateLayout((prev) => moveItem(prev, dragId, item.id));
        setDragId(null);
      }}
      onClick={() => {
        if (editing) {
          onSelect(item.id);
        }
      }}
      onPointerMove={(event) => {
        if (moveDrag?.id !== item.id) {
          return;
        }
        updateLayout((prev) =>
          setItemOffset(
            prev,
            item.id,
            snapToGrid(moveDrag.offsetX + event.clientX - moveDrag.startX),
            snapToGrid(moveDrag.offsetY + event.clientY - moveDrag.startY),
          ),
        );
      }}
      onPointerUp={() => setMoveDrag(null)}
      onPointerCancel={() => setMoveDrag(null)}
      className={`group relative ${
        editing
          ? `rounded-xl border border-dashed p-2 ${
              selected ? 'border-primary bg-primary/5' : 'border-border/80'
            } ${item.visible ? '' : 'opacity-40'} ${
              dragId === item.id ? 'opacity-50' : ''
            }`
          : ''
      } ${
        item.width === 'compact'
          ? 'mx-auto w-[65%] max-w-full'
          : item.width === 'wide'
            ? 'mx-auto w-[85%] max-w-full'
            : 'w-full'
      }`}
      style={
        editing && (item.offsetX !== undefined || item.offsetY !== undefined)
          ? {
              transform: `translate(${item.offsetX ?? 0}px, ${item.offsetY ?? 0}px)`,
              zIndex: selected ? 2 : 1,
            }
          : undefined
      }
    >
      {editing && (
        <>
          <div
            className="text-foreground-secondary mb-2 flex touch-none items-center gap-2 pr-9 text-[10px] tracking-wide uppercase"
            // Opts this handle out of the block's own `draggable`
            // (used for stack reordering, above) — without this the
            // browser's native drag-and-drop and this handle's
            // pointer-capture free-offset drag both try to own the
            // same gesture, so grabbing the handle would sometimes
            // reorder the stack instead of (or in addition to)
            // repositioning the block.
            draggable={false}
            onDragStart={(event) => event.preventDefault()}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              event.currentTarget.setPointerCapture(event.pointerId);
              setMoveDrag({
                id: item.id,
                startX: event.clientX,
                startY: event.clientY,
                offsetX: item.offsetX ?? 0,
                offsetY: item.offsetY ?? 0,
              });
            }}
            onPointerUp={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
              setMoveDrag(null);
            }}
          >
            <GripVerticalIcon size={12} className="cursor-grab" />
            {metaItem.label}
            {!item.visible && <span>(hidden)</span>}
            <span className="text-foreground-secondary/70 normal-case">
              · drag to place
            </span>
          </div>
          <Tooltip content={`Remove ${metaItem.label}`} side="top">
            <Button
              type="button"
              size="icon-sm"
              variant="text"
              className="text-foreground-secondary hover:text-foreground absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              aria-label={`Remove ${metaItem.label}`}
              onClick={(event) => {
                event.stopPropagation();
                onRemove(item.id);
              }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <XIcon size={15} aria-hidden />
            </Button>
          </Tooltip>
        </>
      )}
      {children}
    </div>
  );
}
