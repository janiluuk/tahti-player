/**
 * Types, constants and small pure helpers for the native (desktop) library
 * bridge. `nativeLibrary.ts` re-exports everything here and adds the runtime
 * lookup and the read cache.
 */

import type { NativeAnalysis } from './native-library/analysis';
import type { NativeCatalog } from './native-library/catalog';
import type { NativePlaylists } from './native-library/playlists';
import type { NativeProviderImport } from './native-library/providerImport';
import type {
  NativeFacetFilter,
  NativeFacetGroup,
  NativeFacetKind,
  NativeFilterOptions,
  NativeLibraryImportProgress,
  NativeLibraryImportResult,
  NativeLibraryPage,
  NativeLibraryRoot,
  NativeLibraryTotals,
  NativeLibraryTrack,
  NativePendingImport,
  NativePlaybackBatch,
  NativeRelinkRootResult,
  NativeRootScanResult,
  NativeTrackFilters,
  NativeTrackSort,
} from './native-library/tracks';

export * from './native-library/tracks';
export * from './native-library/playlists';
export * from './native-library/catalog';
export * from './native-library/analysis';
export * from './native-library/providerImport';

export type TahtiNativeLibrary = {
  list: (
    search: string,
    offset: number,
    filter?: NativeFacetFilter | null,
    sort?: NativeTrackSort | null,
    filters?: NativeTrackFilters | null,
  ) => Promise<NativeLibraryPage>;
  /** Every id matching a search/group, in exactly the order the table shows them. */
  matchingIds: (
    search: string,
    filter?: NativeFacetFilter | null,
    sort?: NativeTrackSort | null,
    filters?: NativeTrackFilters | null,
  ) => Promise<string[]>;
  /** `ids` in the order the table shows them for `sort` (unknown ids dropped), without fetching every matching id. */
  orderIds?: (
    ids: string[],
    sort?: NativeTrackSort | null,
  ) => Promise<string[]>;
  filterOptions: () => Promise<NativeFilterOptions>;
  /** Verifies and orders tracks for playback (call in modest chunks). */
  prepareBatch: (ids: string[]) => Promise<NativePlaybackBatch>;
  playlists: NativePlaylists;
  catalog: NativeCatalog;
  analysis: NativeAnalysis;
  facets: (kind: NativeFacetKind) => Promise<NativeFacetGroup[]>;
  totals: () => Promise<NativeLibraryTotals>;
  import: () => Promise<NativeLibraryImportResult>;
  importFolder: () => Promise<NativeLibraryImportResult>;
  /** Imports an explicit list of file/folder paths — used for drag-drop. */
  importPaths: (paths: string[]) => Promise<NativeLibraryImportResult>;
  cancelImport: () => Promise<void>;
  /** Unfinished imports waiting to be resumed, or `null`. Missing in older desktop builds. */
  pendingImport?: () => Promise<NativePendingImport | null>;
  /** Continues unfinished imports with the files they had not reached. */
  resumeImport?: () => Promise<NativeLibraryImportResult>;
  /** Forgets unfinished imports; tracks already imported stay. */
  discardPendingImport?: () => Promise<void>;
  resolve: (id: string) => Promise<string>;
  remove: (id: string) => Promise<void>;
  /** Removes many catalog rows at once (files on disk untouched); returns how many existed. */
  removeMany: (ids: string[]) => Promise<number>;
  /** Reveals a track's original file in the OS file manager. */
  reveal: (id: string) => Promise<void>;
  listUnavailable: () => Promise<NativeLibraryTrack[]>;
  rescan: () => Promise<NativeLibraryTrack[]>;
  relink: (id: string) => Promise<NativeLibraryTrack | null>;
  listRoots: () => Promise<NativeLibraryRoot[]>;
  /** Picks a folder, registers it as a root and scans it. `null` if cancelled. */
  addRoot: () => Promise<NativeRootScanResult | null>;
  /** Stops tracking a root; its tracks stay in the catalog. */
  removeRoot: (id: string) => Promise<void>;
  /** Imports new files under every root and refreshes missing/recovered state. */
  rescanRoots: () => Promise<NativeRootScanResult>;
  /** Whether folder watching is on (default). Manual rescan works either way. */
  getWatching?: () => Promise<boolean>;
  /** Turns folder watching on or off; persisted on this device. */
  setWatching?: (enabled: boolean) => Promise<void>;
  /**
   * Where a damaged catalog file was set aside when the library started
   * empty because of it; returned once, then `null`.
   */
  takeRecoveryNotice?: () => Promise<string | null>;
  /** Picks a replacement folder for a root. `null` if cancelled. */
  relinkRoot: (id: string) => Promise<NativeRelinkRootResult | null>;
  /** Subscribes to live import progress; returns an unsubscribe function. */
  onImportProgress: (
    listener: (progress: NativeLibraryImportProgress) => void,
  ) => () => void;
  /**
   * Subscribes to catalog changes found by the folder watcher (files added,
   * removed or returned outside the app); returns an unsubscribe function.
   */
  onRootsChanged?: (
    listener: (result: NativeRootScanResult) => void,
  ) => () => void;
  /** Subscribes to files/folders dropped onto the app window; returns an unsubscribe function. */
  onFilesDropped: (listener: (paths: string[]) => void) => () => void;
  /** Downloads a provider set into the library. Missing in older desktop builds. */
  providerImport?: NativeProviderImport;
};
