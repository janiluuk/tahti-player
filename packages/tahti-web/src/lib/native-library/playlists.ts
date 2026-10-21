import type { NativeLibraryTrack } from './tracks';

export type NativePlaylistSummary = {
  id: string;
  name: string;
  trackCount: number;
  durationSec: number | null;
  /** Entries whose file is missing or whose track left the library. */
  unavailableCount: number;
  createdAt: string;
  updatedAt: string;
};

export type NativePlaylistEntry = {
  entryId: string;
  position: number;
  /** The library row while the entry still points at one. */
  track: NativeLibraryTrack | null;
  title: string;
  artist: string;
  path: string;
  duration: number | null;
  unavailable: boolean;
};

/** Enough to recreate an entry exactly (undo, imports of unknown files). */
export type NativeRawPlaylistEntry = {
  entryId: string;
  trackId: string | null;
  path: string;
  title: string;
  artist: string;
  duration: number | null;
};

export type NativeExportStyle = 'absolute' | 'relative';

export type NativeExportResult = {
  path: string;
  written: number;
  /** Relative mode: files outside the export folder, written with `../`. */
  outsideRoot: number;
  /** Relative mode: files on another drive, written as absolute paths. */
  absoluteFallback: number;
};

export type NativeEntryStatus =
  'linked' | 'needsImport' | 'missing' | 'unsupported' | 'remote';

export type NativeImportPreview = {
  sourcePath: string;
  suggestedName: string;
  total: number;
  linked: number;
  needsImport: number;
  missing: number;
  unsupported: number;
  remote: number;
  /** The first entries that are not already in the library. */
  unresolved: Array<{
    line: number;
    path: string;
    title: string;
    status: NativeEntryStatus;
  }>;
};

export type NativeImportOutcome = {
  playlist: NativePlaylistSummary;
  linked: number;
  /** Files added to the library because the list referenced them. */
  imported: number;
  unresolved: number;
};

/** Local playlists: ordered entries with their own ids, repeats allowed. */
export type NativePlaylists = {
  list: () => Promise<NativePlaylistSummary[]>;
  create: (name: string) => Promise<NativePlaylistSummary>;
  rename: (id: string, name: string) => Promise<NativePlaylistSummary>;
  duplicate: (id: string) => Promise<NativePlaylistSummary>;
  delete: (id: string) => Promise<void>;
  /** Adds one entry per id in order (repeats kept); `at` inserts instead of appending. */
  addTracks: (
    id: string,
    trackIds: string[],
    at?: number | null,
  ) => Promise<number>;
  entries: (
    id: string,
    offset: number,
  ) => Promise<{ entries: NativePlaylistEntry[]; total: number }>;
  entryIds: (id: string) => Promise<string[]>;
  /** Moves the entries (kept in their current order) to start at `toIndex`, counted among the entries that stay. */
  moveEntries: (
    id: string,
    entryIds: string[],
    toIndex: number,
  ) => Promise<void>;
  removeEntries: (
    id: string,
    entryIds: string[],
  ) => Promise<NativeRawPlaylistEntry[]>;
  restoreEntries: (
    id: string,
    entries: NativeRawPlaylistEntry[],
    order: string[],
  ) => Promise<void>;
  setOrder: (id: string, order: string[]) => Promise<void>;
  /** Linked track ids in playlist order, for playback preparation. */
  trackIds: (id: string) => Promise<string[]>;
  /** Asks where to save, writes an M3U8, and reports how portable it is. `null` if cancelled. */
  exportM3u: (
    id: string,
    style: NativeExportStyle,
  ) => Promise<NativeExportResult | null>;
  /** Reads a playlist file and reports what is and is not in the library; asks for the file unless `sourcePath` is given. `null` if cancelled. */
  importPreview: (
    sourcePath?: string | null,
    relinkRoot?: string | null,
  ) => Promise<NativeImportPreview | null>;
  /** Asks for a folder to search for files the list points at. */
  pickRelinkFolder: () => Promise<string | null>;
  importCommit: (
    sourcePath: string,
    name: string,
    importMissingFiles: boolean,
    relinkRoot?: string | null,
  ) => Promise<NativeImportOutcome>;
  /** Asks for the file an unavailable entry should point at. `false` if cancelled. */
  relinkEntry: (id: string, entryId: string) => Promise<boolean>;
};
