import type { MutableRefObject } from 'react';

import { CatalogTable } from '@tahti-player/ui';

import type { usePersistedCatalogTable } from '../../hooks/usePersistedCatalogTable';
import { saveViewStateDeferred } from '../../lib/localLibraryViewState';
import type { NativeLibraryTrack } from '../../lib/nativeLibrary';
import { NATIVE_TRACK_COLUMNS } from '../nativeTrackColumns';
import { LibraryShortcutsHelp } from './LibraryShortcutsHelp';
import { SelectionToolbar } from './SelectionToolbar';
import type { TrackBatchDialog } from './TrackBatchDialogs';
import { TrackRowActions } from './TrackRowActions';
import type { useSelectionActions } from './useSelectionActions';

// Stable identities so the table doesn't see new callbacks on every render.
const trackRowId = (track: NativeLibraryTrack) => track.id;
const trackRowLabel = (track: NativeLibraryTrack) => track.title;
const trackRowMuted = (track: NativeLibraryTrack) => !track.available;

type Props = {
  table: ReturnType<typeof usePersistedCatalogTable>;
  rows: NativeLibraryTrack[];
  total: number;
  loading: boolean;
  /** An import / rescan / relink is running. */
  busy: boolean;
  selection: ReturnType<typeof useSelectionActions>;
  initialScrollOffset: number;
  loadedCountRef: MutableRefObject<number>;
  onLoadMore: () => void;
  onPlay: (track: NativeLibraryTrack) => void;
  onQueue: (track: NativeLibraryTrack) => void;
  onReveal: (track: NativeLibraryTrack) => void;
  onRelink: (track: NativeLibraryTrack) => void;
  onInspect: (track: NativeLibraryTrack) => void;
  onBatchDialog: (kind: TrackBatchDialog['kind'], ids: string[]) => void;
  onRemove: (ids: string[], title: string | null) => void;
};

/** The desktop library's track table with its selection toolbar and row actions. */
export function NativeTrackTable({
  table,
  rows,
  total,
  loading,
  busy,
  selection,
  initialScrollOffset,
  loadedCountRef,
  onLoadMore,
  onPlay,
  onQueue,
  onReveal,
  onRelink,
  onInspect,
  onBatchDialog,
  onRemove,
}: Props) {
  return (
    <CatalogTable
      columns={NATIVE_TRACK_COLUMNS}
      view={table.view}
      onViewChange={table.setView}
      rows={rows}
      total={total}
      itemNoun="tracks"
      getRowId={trackRowId}
      getRowLabel={trackRowLabel}
      sort={table.sort}
      onSortChange={table.setSort}
      onLoadMore={onLoadMore}
      loading={loading}
      selectedIds={selection.selectedIds}
      onSelectedIdsChange={selection.setSelectedIds}
      isRowMuted={trackRowMuted}
      initialScrollOffset={initialScrollOffset}
      onScrollOffsetChange={(offset) => {
        saveViewStateDeferred({
          scrollOffset: offset,
          loadedCount: loadedCountRef.current,
        });
      }}
      layouts={table.layouts}
      onActivateRow={(track) => {
        if (track.available) {
          onPlay(track);
        } else {
          onRelink(track);
        }
      }}
      onRowKeyDown={(event, track) => {
        if (event.ctrlKey || event.metaKey || event.altKey) {
          return;
        }
        const inSelection =
          selection.selectedIds.size > 1 && selection.selectedIds.has(track.id);
        const targets = inSelection ? [...selection.selectedIds] : [track.id];
        switch (event.key.toLowerCase()) {
          case 'i':
            event.preventDefault();
            onInspect(track);
            return;
          case 'e':
            event.preventDefault();
            onBatchDialog('edit', targets);
            return;
          case 'q':
            event.preventDefault();
            if (inSelection) {
              void selection.queueSelection();
            } else if (track.available) {
              onQueue(track);
            }
            return;
          case 'r':
            if (track.available) {
              event.preventDefault();
              onReveal(track);
            }
            return;
          case 'delete':
          case 'backspace':
            event.preventDefault();
            onRemove(targets, inSelection ? null : track.title);
            return;
        }
      }}
      onSelectAllMatching={() => void selection.selectAllMatching()}
      selectingAll={selection.selectingAll}
      toolbar={
        <>
          <SelectionToolbar
            selectedCount={selection.selectedIds.size}
            nativeTotal={total}
            selectionBusy={selection.selectionBusy}
            analyzing={selection.analyzingSelection}
            onPlayAll={() => void selection.playAllMatching()}
            onAddAllToPlaylist={selection.addAllToPlaylist}
            onPlay={() => void selection.playSelection()}
            onPlayNext={() => void selection.playNextSelection()}
            onQueue={() => void selection.queueSelection()}
            onEditTags={() => onBatchDialog('edit', [...selection.selectedIds])}
            onWriteTags={() =>
              onBatchDialog('writeTags', [...selection.selectedIds])
            }
            onOrganizeFiles={() =>
              onBatchDialog('organizeFiles', [...selection.selectedIds])
            }
            onAnalyze={() => void selection.analyzeSelection()}
            onRateAndLabel={() =>
              onBatchDialog('rateAndLabel', [...selection.selectedIds])
            }
            onAddToPlaylist={selection.addSelectionToPlaylist}
            onRemove={() => onRemove([...selection.selectedIds], null)}
          />
          <LibraryShortcutsHelp />
        </>
      }
      renderActions={(track) => (
        <TrackRowActions
          track={track}
          loading={busy}
          onRelink={onRelink}
          onPlay={onPlay}
          onQueue={onQueue}
          onReveal={onReveal}
          onEdit={(target) => onBatchDialog('edit', [target.id])}
          onInspect={onInspect}
          onRemove={(target) => onRemove([target.id], target.title)}
        />
      )}
    />
  );
}
