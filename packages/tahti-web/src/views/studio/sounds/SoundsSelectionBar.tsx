import {
  Disc3Icon,
  ListOrderedIcon,
  ListPlusIcon,
  PencilIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import type { MixOrderTrack } from '../../../api/studio/sound-mix-order';
import { AddToPlaylistPanel } from '../../../components/AddToPlaylistPanel';
import { AddToReleasePanel } from '../../../components/AddToReleasePanel';
import { SoundsMixOrderDialog } from './SoundsMixOrderDialog';
import type { StudioSoundsState } from './useStudioSoundsState';

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
  const [mixOpen, setMixOpen] = useState(false);
  const [mixTracks, setMixTracks] = useState<MixOrderTrack[]>([]);
  const [orderedIds, setOrderedIds] = useState<string[] | null>(null);
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
        {t('library.soundsSelectedCount', { count: selectedIds.size })}
        {matching ? ` ${t('library.soundsSelectedAll', { total })}` : ''}
      </span>
      {!matching ? (
        <Button
          size="sm"
          variant="text"
          disabled={selectingAll || bulkBusy}
          onClick={() => void selectAllMatching()}
        >
          {selectingAll
            ? t('library.soundsSelecting')
            : allShownSelected && total > filtered.length
              ? t('library.soundsSelectAllMatching', { total })
              : t('library.soundsSelectAllShown', { count: filtered.length })}
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
          {t('actions.edit')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          disabled={bulkBusy || selected.length === 0}
          onClick={() => setReleaseOpen(true)}
        >
          <Disc3Icon size={15} aria-hidden />
          {t('library.soundsAddToRelease')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          disabled={bulkBusy || selected.length < 2}
          onClick={() => {
            setMixTracks(
              selected.map((item) => ({
                id: item.id,
                title: item.title,
                bpm: item.effectiveBpm ?? item.bpm ?? null,
                key: item.effectiveKey ?? item.musicalKey ?? null,
              })),
            );
            setMixOpen(true);
          }}
        >
          <ListOrderedIcon size={15} aria-hidden />
          {t('library.mixOrder')}
        </Button>
        <Button
          size="sm"
          className="gap-1.5"
          disabled={bulkBusy}
          onClick={() => {
            setOrderedIds(null);
            setPlaylistOpen(true);
          }}
        >
          <ListPlusIcon size={15} aria-hidden />
          {t('library.soundsAddToPlaylist')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          disabled={bulkBusy}
          onClick={() => setPendingBulkDelete(true)}
        >
          <Trash2Icon
            className="text-accent-red-strong"
            size={15}
            aria-hidden
          />
          {t('actions.delete')}
        </Button>
        <Button
          size="sm"
          variant="text"
          className="gap-1.5"
          disabled={bulkBusy}
          onClick={clearSelection}
        >
          <XIcon size={15} aria-hidden />
          {t('actions.clear')}
        </Button>
      </div>
      <AddToReleasePanel
        isOpen={releaseOpen}
        tracks={selected.map((item) => ({ id: item.id, title: item.title }))}
        onClose={() => setReleaseOpen(false)}
      />
      <AddToPlaylistPanel
        isOpen={playlistOpen}
        soundIds={orderedIds ?? [...selectedIds]}
        trackTitle={selected[0]?.title ?? ''}
        onClose={() => setPlaylistOpen(false)}
      />
      <SoundsMixOrderDialog
        isOpen={mixOpen}
        tracks={mixTracks}
        onClose={() => setMixOpen(false)}
        onUseOrder={(ids) => {
          setMixOpen(false);
          setOrderedIds(ids);
          setPlaylistOpen(true);
        }}
      />
    </div>
  );
}
