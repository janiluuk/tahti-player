import type { Dispatch, SetStateAction } from 'react';

import type {
  NativeFilterOptions,
  NativeLibraryRoot,
  NativeLibraryTrack,
  NativeTrackFilters,
  TahtiNativeLibrary,
} from '../../lib/nativeLibrary';
import { AddToPlaylistDialog } from '../AddToPlaylistDialog';
import { ConfirmDialog } from '../ConfirmDialog';
import { LocalLibraryFilters } from '../LocalLibraryFilters';
import { TrackInspectorDialog } from '../TrackInspectorDialog';
import { basename } from './pathLabels';
import { TrackBatchDialogs, type TrackBatchDialog } from './TrackBatchDialogs';
import type { useSelectionActions } from './useSelectionActions';

type PendingRemoval = { ids: string[]; title: string | null } | null;

type Props = {
  library: TahtiNativeLibrary | null;
  selection: ReturnType<typeof useSelectionActions>;
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
  filters: NativeTrackFilters;
  setFilters: Dispatch<SetStateAction<NativeTrackFilters>>;
  filterOptions: NativeFilterOptions | null;
  tags: Array<{ name: string; tracks: number }>;
  roots: NativeLibraryRoot[];
  batchDialog: TrackBatchDialog | null;
  setBatchDialog: Dispatch<SetStateAction<TrackBatchDialog | null>>;
  inspected: NativeLibraryTrack | null;
  setInspected: Dispatch<SetStateAction<NativeLibraryTrack | null>>;
  pendingRemoval: PendingRemoval;
  setPendingRemoval: Dispatch<SetStateAction<PendingRemoval>>;
  rootToRemove: NativeLibraryRoot | null;
  setRootToRemove: Dispatch<SetStateAction<NativeLibraryRoot | null>>;
  onRefresh: () => void;
  onPlay: (track: NativeLibraryTrack) => void;
  onQueue: (track: NativeLibraryTrack) => void;
  onReveal: (track: NativeLibraryTrack) => void;
  onRelink: (track: NativeLibraryTrack) => void;
  onRemove: (ids: string[], title: string | null) => void;
  onRemoveRoot: (root: NativeLibraryRoot) => void;
};

export function DesktopLibraryDialogs({
  library,
  selection,
  filtersOpen,
  setFiltersOpen,
  filters,
  setFilters,
  filterOptions,
  tags,
  roots,
  batchDialog,
  setBatchDialog,
  inspected,
  setInspected,
  pendingRemoval,
  setPendingRemoval,
  rootToRemove,
  setRootToRemove,
  onRefresh,
  onPlay,
  onQueue,
  onReveal,
  onRelink,
  onRemove,
  onRemoveRoot,
}: Props) {
  return (
    <>
      {library ? (
        <AddToPlaylistDialog
          isOpen={selection.addToPlaylist !== null}
          onClose={() => selection.setAddToPlaylist(null)}
          library={library}
          summary={selection.addToPlaylist?.summary ?? ''}
          resolveTrackIds={
            selection.addToPlaylist?.resolve ?? (() => Promise.resolve([]))
          }
        />
      ) : null}
      <LocalLibraryFilters
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onApply={setFilters}
        options={filterOptions}
        tags={tags}
        roots={roots}
      />
      {library ? (
        <TrackBatchDialogs
          library={library}
          dialog={batchDialog}
          onClose={() => setBatchDialog(null)}
          onChanged={onRefresh}
        />
      ) : null}
      <TrackInspectorDialog
        library={library}
        track={inspected}
        onChanged={onRefresh}
        onClose={() => setInspected(null)}
        onPlay={(track) => {
          setInspected(null);
          onPlay(track);
        }}
        onQueue={onQueue}
        onReveal={onReveal}
        onLocate={(track) => {
          setInspected(null);
          onRelink(track);
        }}
        onRemove={(track) => {
          setInspected(null);
          setPendingRemoval({ ids: [track.id], title: track.title });
        }}
      />
      <ConfirmDialog
        isOpen={pendingRemoval !== null}
        title={
          pendingRemoval && pendingRemoval.ids.length > 1
            ? `Remove ${pendingRemoval.ids.length.toLocaleString('en-US')} tracks from the library?`
            : 'Remove this track from the library?'
        }
        description="They are only removed from your Tahti library. The audio files on disk are not touched."
        confirmLabel="Remove"
        onCancel={() => setPendingRemoval(null)}
        onConfirm={() => {
          const pending = pendingRemoval;
          setPendingRemoval(null);
          if (pending) {
            onRemove(pending.ids, pending.title);
          }
        }}
      />
      <ConfirmDialog
        isOpen={rootToRemove !== null}
        title="Stop watching this folder?"
        description={`“${rootToRemove ? basename(rootToRemove.path) : ''}” will no longer be scanned for new files. Its tracks stay in your library and no files on disk are touched.`}
        confirmLabel="Stop watching"
        onCancel={() => setRootToRemove(null)}
        onConfirm={() => {
          const root = rootToRemove;
          setRootToRemove(null);
          if (root) {
            onRemoveRoot(root);
          }
        }}
      />
    </>
  );
}
