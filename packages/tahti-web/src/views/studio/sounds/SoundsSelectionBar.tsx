import {
  Disc3Icon,
  ListPlusIcon,
  PencilIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import { AddToPlaylistPanel } from '../../../components/AddToPlaylistPanel';
import { AddToReleasePanel } from '../../../components/AddToReleasePanel';
import type { StudioSoundsState } from './useStudioSoundsState';

/** Bulk actions over the checked Sounds rows; hidden until one is checked. */
export function SoundsSelectionBar({ state }: { state: StudioSoundsState }) {
  const { t } = useTranslation('web');
  const {
    items,
    filtered,
    selectedIds,
    clearSelection,
    total,
    selectAllMatching,
    selectingAll,
    allMatchingSelected,
    setPendingBulkDelete,
    setBulkEditOpen,
    bulkBusy,
  } = state;
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const selected = items.filter((item) => selectedIds.has(item.id));

  if (selectedIds.size === 0) {
    return null;
  }

  const allShownSelected =
    filtered.length > 0 && filtered.every((item) => selectedIds.has(item.id));
  const matching =
    allMatchingSelected ||
    (total > 0 && selectedIds.size >= total && allShownSelected);

  return (
    <div
      role="toolbar"
      aria-label={t('library.soundsSelectedAria')}
      aria-busy={selectingAll || bulkBusy || undefined}
      className="border-border bg-background-secondary mb-3 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm"
    >
      <span className="font-medium">
        {selectedIds.size === 1 ? '1 selected' : `${selectedIds.size} selected`}
        {matching ? ` (all ${total})` : ''}
      </span>
      {!matching ? (
        <Button
          size="sm"
          variant="text"
          disabled={selectingAll || bulkBusy}
          onClick={() => void selectAllMatching()}
        >
          {selectingAll
            ? 'Selecting…'
            : allShownSelected && total > filtered.length
              ? `Select all ${total} matching`
              : `Select all ${filtered.length} shown`}
        </Button>
      ) : null}
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          disabled={bulkBusy}
          onClick={() => setBulkEditOpen(true)}
        >
          <PencilIcon size={15} aria-hidden />
          Edit
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          disabled={bulkBusy || selected.length === 0}
          onClick={() => setReleaseOpen(true)}
        >
          <Disc3Icon size={15} aria-hidden />
          Add to release
        </Button>
        <Button
          size="sm"
          className="gap-1.5"
          disabled={bulkBusy}
          onClick={() => setPlaylistOpen(true)}
        >
          <ListPlusIcon size={15} aria-hidden />
          Add to playlist
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          disabled={bulkBusy}
          onClick={() => setPendingBulkDelete(true)}
        >
          <Trash2Icon size={15} aria-hidden />
          Delete
        </Button>
        <Button
          size="sm"
          variant="text"
          className="gap-1.5"
          disabled={bulkBusy}
          onClick={clearSelection}
        >
          <XIcon size={15} aria-hidden />
          Clear
        </Button>
      </div>
      <AddToReleasePanel
        isOpen={releaseOpen}
        tracks={selected.map((item) => ({ id: item.id, title: item.title }))}
        onClose={() => setReleaseOpen(false)}
      />
      <AddToPlaylistPanel
        isOpen={playlistOpen}
        soundIds={[...selectedIds]}
        trackTitle={selected[0]?.title ?? ''}
        onClose={() => setPlaylistOpen(false)}
      />
    </div>
  );
}
