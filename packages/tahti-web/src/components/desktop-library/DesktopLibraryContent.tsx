import { LibraryIcon, ListFilterIcon, XIcon } from 'lucide-react';
import type { MutableRefObject } from 'react';

import { Button, EmptyState, Input } from '@tahti-player/ui';

import type { usePersistedCatalogTable } from '../../hooks/usePersistedCatalogTable';
import {
  type NativeFacetFilter,
  type NativeFacetGroup,
  type NativeImportProvider,
  type NativeLibraryImportProgress,
  type NativeLibraryRoot,
  type NativeLibraryTotals,
  type NativeLibraryTrack,
  type TahtiNativeLibrary,
} from '../../lib/nativeLibrary';
import {
  BrowseTabs,
  FACET_KIND_LABEL,
  FacetGroupList,
  facetTitle,
  LibraryTotalsLine,
  type BrowseKind,
} from '../LocalLibraryBrowse';
import { LocalLibraryTools } from '../LocalLibraryTools';
import { LocalPlaylists } from '../LocalPlaylists';
import { BrowserLocalFiles } from './BrowserLocalFiles';
import { LibraryRootsBlock } from './LibraryRootsBlock';
import { NativeTrackTable } from './NativeTrackTable';
import type { TrackBatchDialog } from './TrackBatchDialogs';
import type { useSelectionActions } from './useSelectionActions';

type Props = {
  library: TahtiNativeLibrary | null;
  busy: boolean;
  progress: NativeLibraryImportProgress | null;
  unavailableCount: number;
  roots: NativeLibraryRoot[];
  watching: boolean;
  rootBusy: string | 'add' | 'rescan' | null;
  totals: NativeLibraryTotals | null;
  browseKind: BrowseKind;
  openPlaylistId: string | null;
  facetFilter: NativeFacetFilter | null;
  facetGroups: NativeFacetGroup[];
  facetLoading: boolean;
  query: string;
  activeFilterCount: number;
  tracks: NativeLibraryTrack[];
  total: number;
  loading: boolean;
  error: string | null;
  hasActiveScope: boolean;
  table: ReturnType<typeof usePersistedCatalogTable>;
  selection: ReturnType<typeof useSelectionActions>;
  initialScrollOffset: number;
  loadedCountRef: MutableRefObject<number>;
  onImportFiles: () => void;
  onImportFolder: () => void;
  /** Opens a provider set import; absent when the desktop build lacks it. */
  onImportSet?: (provider: NativeImportProvider) => void;
  /** Opens the hearthis.at set import; absent when the desktop build lacks it. */
  onImportItunes?: () => void;
  onRescanMissing: () => void;
  onCancelImport: () => void;
  onAddRoot: () => void;
  onRescanRoots: () => void;
  onRelinkRoot: (root: NativeLibraryRoot) => void;
  onStopWatchingRoot: (root: NativeLibraryRoot) => void;
  onChangeWatching: (enabled: boolean) => void;
  onRefresh: () => void;
  onBrowseKindChange: (kind: BrowseKind) => void;
  onOpenPlaylistChange: (id: string | null) => void;
  onFacetSelect: (group: NativeFacetGroup) => void;
  onFacetClear: () => void;
  onQueryChange: (query: string) => void;
  onFiltersOpen: () => void;
  onClearScope: () => void;
  onLoadMore: () => void;
  onPlay: (track: NativeLibraryTrack) => void;
  onQueue: (track: NativeLibraryTrack) => void;
  onReveal: (track: NativeLibraryTrack) => void;
  onRelink: (track: NativeLibraryTrack) => void;
  onInspect: (track: NativeLibraryTrack) => void;
  onBatchDialog: (kind: TrackBatchDialog['kind'], ids: string[]) => void;
  onRemove: (ids: string[], title: string | null) => void;
};

export function DesktopLibraryContent({
  library,
  busy,
  progress,
  unavailableCount,
  roots,
  watching,
  rootBusy,
  totals,
  browseKind,
  openPlaylistId,
  facetFilter,
  facetGroups,
  facetLoading,
  query,
  activeFilterCount,
  tracks,
  total,
  loading,
  error,
  hasActiveScope,
  table,
  selection,
  initialScrollOffset,
  loadedCountRef,
  onImportFiles,
  onImportFolder,
  onImportSet,
  onImportItunes,
  onRescanMissing,
  onCancelImport,
  onAddRoot,
  onRescanRoots,
  onRelinkRoot,
  onStopWatchingRoot,
  onChangeWatching,
  onRefresh,
  onBrowseKindChange,
  onOpenPlaylistChange,
  onFacetSelect,
  onFacetClear,
  onQueryChange,
  onFiltersOpen,
  onClearScope,
  onLoadMore,
  onPlay,
  onQueue,
  onReveal,
  onRelink,
  onInspect,
  onBatchDialog,
  onRemove,
}: Props) {
  if (!library) {
    return <BrowserLocalFiles />;
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onImportFiles} disabled={busy}>
          <LibraryIcon size={15} aria-hidden />
          {busy ? 'Working…' : 'Import files'}
        </Button>
        <Button variant="text" onClick={onImportFolder} disabled={busy}>
          Import folder
        </Button>
        {onImportSet ? (
          <>
            <Button
              variant="text"
              onClick={() => onImportSet('hearthis')}
              disabled={busy}
            >
              Import hearthis.at set
            </Button>
            <Button
              variant="text"
              onClick={() => onImportSet('soundcloud')}
              disabled={busy}
            >
              Import SoundCloud set
            </Button>
          </>
        ) : null}
        {onImportItunes ? (
          <Button variant="text" onClick={onImportItunes} disabled={busy}>
            Import iTunes library
          </Button>
        ) : null}
        {unavailableCount > 0 ? (
          <Button variant="text" onClick={onRescanMissing} disabled={busy}>
            Check missing files ({unavailableCount})
          </Button>
        ) : null}
        {progress ? (
          <Button variant="text" intent="danger" onClick={onCancelImport}>
            <XIcon size={14} aria-hidden />
            Cancel
          </Button>
        ) : null}
      </div>
      {progress ? (
        <p className="text-foreground-secondary text-xs">
          Importing {progress.done} of {progress.total} — {progress.imported}{' '}
          imported{progress.failed ? `, ${progress.failed} failed` : ''}
          {progress.skipped ? `, ${progress.skipped} skipped` : ''}
        </p>
      ) : null}
      <LibraryRootsBlock
        roots={roots}
        canToggleWatching={Boolean(library.setWatching)}
        watching={watching}
        rootBusy={rootBusy}
        loading={busy}
        onAdd={onAddRoot}
        onRescan={onRescanRoots}
        onRelink={onRelinkRoot}
        onStopWatching={onStopWatchingRoot}
        onChangeWatching={onChangeWatching}
      />
      <LocalLibraryTools library={library} onChanged={onRefresh} />
      <LibraryTotalsLine totals={totals} />
      <BrowseTabs value={browseKind} onChange={onBrowseKindChange} />
      {browseKind === 'playlists' ? (
        <LocalPlaylists
          library={library}
          openId={openPlaylistId}
          onOpenChange={onOpenPlaylistChange}
        />
      ) : browseKind !== 'tracks' && !facetFilter ? (
        facetGroups.length ? (
          <FacetGroupList
            kind={browseKind}
            groups={facetGroups}
            onSelect={onFacetSelect}
            onAddToPlaylist={selection.addGroupToPlaylist}
          />
        ) : (
          <EmptyState
            size="sm"
            icon={<LibraryIcon size={28} className="opacity-50" />}
            title={
              facetLoading
                ? 'Loading…'
                : `No ${FACET_KIND_LABEL[browseKind].toLowerCase()} groups yet`
            }
            description={
              facetLoading ? undefined : 'Import files to fill this view.'
            }
            className="flex-1"
          />
        )
      ) : (
        <>
          {facetFilter ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                aria-label={`Clear ${FACET_KIND_LABEL[facetFilter.kind]} filter`}
                onClick={onFacetClear}
              >
                <XIcon size={12} aria-hidden />
                {FACET_KIND_LABEL[facetFilter.kind]}:{' '}
                {facetTitle(facetFilter.kind, {
                  name: facetFilter.value,
                  secondary: facetFilter.secondary ?? '',
                  year: null,
                  trackCount: 0,
                  durationSec: 0,
                  sizeBytes: 0,
                })}
              </Button>
            </div>
          ) : null}
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <Input
                type="search"
                label="Search desktop library"
                placeholder="Title, artist, album, genre or path"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
              />
            </div>
            <Button
              variant={activeFilterCount ? 'secondary' : 'text'}
              aria-label={
                activeFilterCount
                  ? `Filters (${activeFilterCount} active)`
                  : 'Filters'
              }
              onClick={onFiltersOpen}
            >
              <ListFilterIcon size={15} aria-hidden />
              Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
            </Button>
          </div>
          {tracks.length ? (
            <NativeTrackTable
              table={table}
              rows={tracks}
              total={total}
              loading={loading}
              busy={busy}
              selection={selection}
              initialScrollOffset={initialScrollOffset}
              loadedCountRef={loadedCountRef}
              onLoadMore={onLoadMore}
              onPlay={onPlay}
              onQueue={onQueue}
              onReveal={onReveal}
              onRelink={onRelink}
              onInspect={onInspect}
              onBatchDialog={onBatchDialog}
              onRemove={onRemove}
            />
          ) : error ? (
            <EmptyState
              size="sm"
              title="Desktop library unavailable"
              description={error}
              action={
                <Button variant="secondary" onClick={onRefresh}>
                  Retry
                </Button>
              }
              className="flex-1"
            />
          ) : hasActiveScope && !loading && !busy ? (
            <EmptyState
              size="sm"
              icon={<ListFilterIcon size={28} className="opacity-50" />}
              title="No tracks match"
              description="Nothing in your library fits the current search, group and filters."
              action={
                <Button variant="secondary" onClick={onClearScope}>
                  Clear search and filters
                </Button>
              }
              className="flex-1"
            />
          ) : (
            <EmptyState
              size="sm"
              icon={<LibraryIcon size={28} className="opacity-50" />}
              title="Desktop library"
              description={
                loading || busy
                  ? 'Loading library…'
                  : 'Import files to build your offline library.'
              }
              className="flex-1"
            />
          )}
        </>
      )}
    </>
  );
}
