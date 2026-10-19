import { ListPlusIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@tahti-player/ui';

import { AddToPlaylistPanel } from '../../../components/AddToPlaylistPanel';
import type { StudioSoundsState } from './useStudioSoundsState';

/** Bulk actions over the checked Sounds rows; hidden until one is checked. */
export function SoundsSelectionBar({ state }: { state: StudioSoundsState }) {
  const { items, filtered, selectedIds, setSelectedIds } = state;
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const selected = items.filter((item) => selectedIds.has(item.id));

  if (selected.length === 0) {
    return null;
  }

  const allShownSelected = filtered.every((item) => selectedIds.has(item.id));

  return (
    <div
      role="toolbar"
      aria-label="Selected sounds"
      className="border-border bg-background-secondary mb-3 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm"
    >
      <span className="font-medium">
        {selected.length === 1 ? '1 selected' : `${selected.length} selected`}
      </span>
      {!allShownSelected ? (
        <Button
          size="sm"
          variant="text"
          onClick={() =>
            setSelectedIds(
              new Set([...selectedIds, ...filtered.map((item) => item.id)]),
            )
          }
        >
          Select all {filtered.length}
        </Button>
      ) : null}
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setPlaylistOpen(true)}
        >
          <ListPlusIcon size={15} aria-hidden />
          Add to playlist
        </Button>
        <Button
          size="sm"
          variant="text"
          className="gap-1.5"
          onClick={() => setSelectedIds(new Set())}
        >
          <XIcon size={15} aria-hidden />
          Clear
        </Button>
      </div>
      <AddToPlaylistPanel
        isOpen={playlistOpen}
        soundIds={selected.map((item) => item.id)}
        trackTitle={selected[0]?.title ?? ''}
        onClose={() => setPlaylistOpen(false)}
      />
    </div>
  );
}
