import { ListMusicIcon, PauseIcon, PlayIcon, Trash2Icon } from 'lucide-react';
import { FC, useState } from 'react';

import { Box, Button, Select, Tooltip } from '@tahti-player/ui';

import type { ProgrammeItem } from '../api/studio-extras';
import { cn } from '../lib/cn';

const SECONDS_PER_MINUTE = 60;

function formatDuration(durationSec: number | null): string | null {
  if (durationSec == null) {
    return null;
  }
  const minutes = Math.floor(durationSec / SECONDS_PER_MINUTE);
  const seconds = durationSec % SECONDS_PER_MINUTE;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

type ChannelRotationEditorProps = {
  items: ProgrammeItem[];
  availableItems?: ProgrammeItem[];
  busy?: boolean;
  onAdd?: (item: ProgrammeItem) => void;
  onReorder: (items: ProgrammeItem[]) => void;
  onRemove: (item: ProgrammeItem) => void;
  onPlay?: (item: ProgrammeItem) => void;
  currentItemId?: string | null;
  isPlaying?: boolean;
  libraryGroups?: Array<{ id: string; label: string; items: ProgrammeItem[] }>;
  onAddGroup?: (group: {
    id: string;
    label: string;
    items: ProgrammeItem[];
  }) => void;
};

export const ChannelRotationEditor: FC<ChannelRotationEditorProps> = ({
  items,
  availableItems = [],
  busy = false,
  onAdd,
  onReorder,
  onRemove,
  onPlay,
  currentItemId = null,
  isPlaying = false,
  libraryGroups = [],
  onAddGroup,
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  return (
    <div className="border-border border-t px-4 py-4 sm:px-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold">
            Active rotation · {items.length}
          </h3>
          <p className="text-foreground-secondary text-xs">
            Reordering switches playback to In order.
          </p>
        </div>
        {onAdd && availableItems.length > 0 ? (
          <div className="flex items-center gap-2 text-xs">
            <Select
              label="Quick add"
              placeholder="Choose track…"
              options={availableItems.map((item) => ({
                id: item.id,
                label: item.title,
              }))}
              disabled={busy}
              onValueChange={(itemId) => {
                const item = availableItems.find(
                  (candidate) => candidate.id === itemId,
                );
                if (item) {
                  onAdd(item);
                }
              }}
            />
          </div>
        ) : null}
      </div>

      {libraryGroups.length > 0 && onAddGroup ? (
        <div className="mb-4 flex flex-col gap-2">
          <div>
            <h4 className="text-xs font-semibold tracking-wide uppercase">
              Add from library
            </h4>
            <p className="text-foreground-secondary mt-1 text-xs">
              Choose a content group to append or replace the active rotation.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {libraryGroups.map((group) => (
              <Box
                key={group.id}
                variant="tertiary"
                className="h-auto items-center justify-between gap-2 rounded-lg p-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {group.label}
                  </span>
                  <span className="text-foreground-secondary text-xs">
                    {group.items.length} track
                    {group.items.length === 1 ? '' : 's'}
                  </span>
                </span>
                <Tooltip content={`Add ${group.label}`} side="top">
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    disabled={busy || group.items.length === 0}
                    onClick={() => onAddGroup(group)}
                    aria-label={`Add ${group.label}`}
                  >
                    <ListMusicIcon size={14} aria-hidden />
                  </Button>
                </Tooltip>
              </Box>
            ))}
          </div>
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="border-border rounded-lg border border-dashed px-4 py-8 text-center">
          <ListMusicIcon
            size={28}
            className="text-foreground-secondary mx-auto opacity-50"
            aria-hidden
          />
          <p className="mt-2 text-sm font-medium">Rotation is empty</p>
          <p className="text-foreground-secondary mt-1 text-xs">
            Choose a playlist above or add a ready archive track.
          </p>
        </div>
      ) : (
        <ol className="border-border divide-border divide-y overflow-hidden rounded-lg border">
          {items.map((item, index) => {
            const duration = formatDuration(item.durationSec);
            const isCurrent = currentItemId === item.id;
            const showPause = isCurrent && isPlaying;
            return (
              <li
                key={item.id}
                data-testid={isCurrent ? 'rotation-item-current' : undefined}
                aria-current={isCurrent ? 'true' : undefined}
                draggable={!busy}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', item.id);
                  setDraggedId(item.id);
                }}
                onDragEnd={() => setDraggedId(null)}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (!draggedId || draggedId === item.id) {
                    return;
                  }
                  const fromIndex = items.findIndex(
                    (candidate) => candidate.id === draggedId,
                  );
                  if (fromIndex < 0) {
                    return;
                  }
                  const next = [...items];
                  const [moved] = next.splice(fromIndex, 1);
                  if (!moved) {
                    return;
                  }
                  next.splice(index, 0, moved);
                  setDraggedId(null);
                  onReorder(next);
                }}
                className={cn(
                  'flex cursor-grab items-center gap-3 px-3 py-2.5 active:cursor-grabbing',
                  isCurrent
                    ? 'bg-primary/10 ring-primary/30 ring-1 ring-inset'
                    : 'bg-background',
                  draggedId === item.id && 'opacity-50',
                )}
              >
                <span className="text-foreground-secondary w-5 shrink-0 text-center font-mono text-xs">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-medium">
                      {item.title}
                    </div>
                    {isCurrent ? (
                      <span className="text-primary shrink-0 text-[10px] font-semibold tracking-wide uppercase">
                        Now
                      </span>
                    ) : null}
                  </div>
                  <div className="text-foreground-secondary text-xs">
                    {duration ?? item.status}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {onPlay ? (
                    <Tooltip content={showPause ? 'Pause' : 'Play'} side="top">
                      <Button
                        size="icon-sm"
                        variant="text"
                        disabled={busy}
                        onClick={() => onPlay(item)}
                        aria-label={`${showPause ? 'Pause' : 'Play'} ${item.title}`}
                      >
                        {showPause ? (
                          <PauseIcon size={14} aria-hidden />
                        ) : (
                          <PlayIcon size={14} aria-hidden />
                        )}
                      </Button>
                    </Tooltip>
                  ) : null}
                  <Tooltip content="Remove" side="top">
                    <Button
                      size="icon-sm"
                      variant="text"
                      disabled={busy}
                      onClick={() => onRemove(item)}
                      aria-label={`Remove ${item.title} from rotation`}
                    >
                      <Trash2Icon size={14} aria-hidden />
                    </Button>
                  </Tooltip>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};
