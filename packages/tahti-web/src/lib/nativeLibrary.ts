import type { TahtiPlayable } from '../api/types';

export type NativeLibraryTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  format: string;
  duration: number | null;
  sizeBytes: number;
  available: boolean;
  unavailableSince: string | null;
  path: string;
  sampleRate: number;
  channels: number;
  bitsPerSample: number | null;
  albumArtist: string;
  trackNo: number | null;
  discNo: number | null;
  year: number | null;
  genre: string;
  comment: string;
  bitrateKbps: number | null;
  /** UTC `YYYY-MM-DD HH:MM:SS`; empty when unknown. */
  addedAt: string;
  /** 0 = unrated, otherwise 1-5 stars. */
  rating: number;
  /** One of `TRACK_COLORS`, or empty. */
  color: string;
  playCount: number;
  /** UTC `YYYY-MM-DD HH:MM:SS`. */
  lastPlayedAt: string | null;
  /** Effective BPM: your correction, else the file's tag, else the estimate. */
  bpm: number | null;
  /** Effective key, e.g. `Am` or `F#`. */
  musicalKey: string | null;
  /** Integrated loudness in LUFS. */
  loudnessLufs: number | null;
  analyzed: boolean;
};

export const TRACK_COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'gray',
] as const;

export type NativeSortColumn =
  | 'title'
  | 'artist'
  | 'album'
  | 'genre'
  | 'year'
  | 'trackNo'
  | 'duration'
  | 'format'
  | 'size'
  | 'bitrate'
  | 'added'
  | 'rating'
  | 'plays'
  | 'lastPlayed'
  | 'bpm'
  | 'key'
  | 'loudness';

/** Sorted in the database with a stable tie-break; blanks always last. */
export type NativeTrackSort = {
  column: NativeSortColumn;
  descending: boolean;
};

export type NativeAvailability = 'available' | 'missing';

/** Range and attribute filters; an empty (null / no formats) field restricts nothing. */
export type NativeTrackFilters = {
  yearMin: number | null;
  yearMax: number | null;
  /** Seconds. */
  durationMin: number | null;
  durationMax: number | null;
  bitrateMin: number | null;
  formats: string[];
  rootId: string | null;
  /** `YYYY-MM-DD`. */
  addedSince: string | null;
  availability: NativeAvailability | null;
  /** At least this many stars. */
  ratingMin: number | null;
  color: string | null;
  tag: string | null;
  bpmMin: number | null;
  bpmMax: number | null;
  key: string | null;
  /** LUFS, usually negative. */
  loudnessMin: number | null;
  loudnessMax: number | null;
  analysis: 'analyzed' | 'unanalyzed' | null;
};

export const EMPTY_TRACK_FILTERS: NativeTrackFilters = {
  yearMin: null,
  yearMax: null,
  durationMin: null,
  durationMax: null,
  bitrateMin: null,
  formats: [],
  rootId: null,
  addedSince: null,
  availability: null,
  ratingMin: null,
  color: null,
  tag: null,
  bpmMin: null,
  bpmMax: null,
  key: null,
  loudnessMin: null,
  loudnessMax: null,
  analysis: null,
};

/** How many separate restrictions are active (a year range counts once). */
export function countActiveFilters(filters: NativeTrackFilters): number {
  return [
    filters.yearMin !== null || filters.yearMax !== null,
    filters.durationMin !== null || filters.durationMax !== null,
    filters.bitrateMin !== null,
    filters.formats.length > 0,
    filters.rootId !== null,
    filters.addedSince !== null,
    filters.availability !== null,
    filters.ratingMin !== null,
    filters.color !== null,
    filters.tag !== null,
    filters.bpmMin !== null || filters.bpmMax !== null,
    filters.key !== null,
    filters.loudnessMin !== null || filters.loudnessMax !== null,
    filters.analysis !== null,
  ].filter(Boolean).length;
}

/** Values to build filter controls from the current catalog. */
export type NativeFilterOptions = {
  formats: string[];
  yearMin: number | null;
  yearMax: number | null;
};

export type NativeFacetKind = 'artists' | 'albums' | 'genres' | 'folders';

/** One group in a browse tab. For albums `secondary` is the album artist. */
export type NativeFacetGroup = {
  name: string;
  secondary: string;
  year: number | null;
  trackCount: number;
  durationSec: number | null;
  sizeBytes: number;
};

/** Narrows the track list to one group from `facets`. */
export type NativeFacetFilter = {
  kind: NativeFacetKind;
  value: string;
  secondary: string | null;
};

/** Everything on this device — separate from cloud storage usage. */
export type NativeLibraryTotals = {
  trackCount: number;
  durationSec: number | null;
  sizeBytes: number;
};

/** A track verified on disk and ready for the player. */
export type NativePlaybackItem = {
  track: NativeLibraryTrack;
  streamUrl: string;
};

export type NativePlaybackBatch = {
  /** In the order the ids were requested. */
  items: NativePlaybackItem[];
  /** Requested tracks whose file is missing. */
  unavailable: number;
};

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
  | 'linked'
  | 'needsImport'
  | 'missing'
  | 'unsupported'
  | 'remote';

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

/** Tag fields the user can edit by hand. */
export type NativeEditField =
  | 'title'
  | 'artist'
  | 'album'
  | 'albumArtist'
  | 'genre'
  | 'comment'
  | 'year'
  | 'trackNo'
  | 'discNo';

/** `value: null` puts the file's own tag back. */
export type NativeFieldEdit = { field: NativeEditField; value: string | null };

/** What a field looked like before an edit; enough to undo it exactly. */
export type NativeFieldSnapshot = {
  trackId: string;
  field: NativeEditField;
  value: string;
  extracted: string | null;
};

export type NativeEditPreview = {
  tracksChanged: number;
  tracksUnchanged: number;
  fieldsChanged: number;
  examples: Array<{
    trackId: string;
    title: string;
    field: NativeEditField;
    before: string;
    after: string;
  }>;
};

export type NativeEditOutcome = {
  tracksChanged: number;
  undo: NativeFieldSnapshot[];
};

/** A field across a selection; `distinct > 1` means mixed values. */
export type NativeFieldSummary = {
  field: NativeEditField;
  value: string;
  distinct: number;
  edited: number;
};

export type NativeFieldProvenance = {
  field: NativeEditField;
  value: string;
  edited: boolean;
  fileValue: string;
  editedAt: string | null;
};

/** Rating, color and tags of one track; used to undo organizing changes. */
export type NativeUserDataSnapshot = {
  trackId: string;
  rating: number;
  color: string;
  tags: string[];
};

export type NativeDuplicateGroup = {
  kind: 'exact' | 'similar';
  tracks: NativeLibraryTrack[];
  /** Similar groups: every file was compared and the contents differ. */
  confirmedDifferent: boolean;
};

export type NativeHashResult = {
  hashed: number;
  alreadyCurrent: number;
  failed: number;
  cancelled: boolean;
};

export type NativeBackupSummary = {
  path: string;
  tracks: number;
  roots: number;
  playlists: number;
  edits: number;
};

/** Old folder -> new folder, applied when restoring on another machine. */
export type NativeRootMapping = { from: string; to: string };

export type NativeRestorePreview = {
  createdAt: string;
  roots: Array<{ from: string; to: string; exists: boolean; tracks: number }>;
  tracks: number;
  filesFound: number;
  filesMissing: number;
  edits: number;
  playlists: number;
  playlistEntries: number;
  missingExamples: string[];
};

export type NativeRestoreResult = {
  tracksRestored: number;
  tracksMissing: number;
  tracksFailed: number;
  rootsAdded: number;
  playlistsCreated: number;
  playlistsRenamed: number;
  editsApplied: number;
};

export type NativeMergeResult = {
  removed: number;
  playlistEntriesMoved: number;
};

export type NativePlayLogEntry = {
  id: number;
  trackId: string | null;
  title: string;
  artist: string;
  /** UTC `YYYY-MM-DD HH:MM:SS`. */
  playedAt: string;
};

export type NativeWriteSkip = { path: string; reason: string };

export type NativeWriteTagsPreview = {
  writable: number;
  noEdits: number;
  skipped: NativeWriteSkip[];
  /** Formats tags can be written to, e.g. `FLAC`, `WAV`. */
  formats: string[];
};

export type NativeOrganizeMode = 'copy' | 'move';
export type NativeOrganizeCollision = 'skip' | 'suffix';
export type NativeOrganizeItem = {
  id: string;
  from: string;
  to: string;
  status: 'ready' | 'unchanged' | 'collision' | 'missing';
};
export type NativeOrganizePlan = {
  items: NativeOrganizeItem[];
  ready: number;
  unchanged: number;
  collisions: number;
  missing: number;
  originalsInWatchedFolders: number;
};
export type NativeOrganizeResult = {
  done: number;
  skipped: number;
  errors: string[];
};
export type NativeOrganizeOptions = {
  ids: string[];
  destination: string;
  template: string;
  collision: NativeOrganizeCollision;
  mode: NativeOrganizeMode;
};

export type NativeWriteTagsResult = {
  written: number;
  skipped: NativeWriteSkip[];
  failed: NativeWriteSkip[];
  editsSettled: number;
  editsKept: number;
  fieldsUnsupported: number;
};

/** Catalog editing and organization: edits, ratings, labels, tags, duplicates, backup. */
export type NativeCatalog = {
  /** What an edit would change, without changing anything. */
  editPreview: (
    ids: string[],
    edits: NativeFieldEdit[],
  ) => Promise<NativeEditPreview>;
  editTracks: (
    ids: string[],
    edits: NativeFieldEdit[],
  ) => Promise<NativeEditOutcome>;
  restoreEdits: (snapshots: NativeFieldSnapshot[]) => Promise<number>;
  fieldSummary: (ids: string[]) => Promise<NativeFieldSummary[]>;
  provenance: (id: string) => Promise<NativeFieldProvenance[]>;
  userData: (ids: string[]) => Promise<NativeUserDataSnapshot[]>;
  /** Each returns what the tracks looked like before, for undo. */
  setRating: (
    ids: string[],
    rating: number,
  ) => Promise<NativeUserDataSnapshot[]>;
  setColor: (ids: string[], color: string) => Promise<NativeUserDataSnapshot[]>;
  addTag: (ids: string[], name: string) => Promise<NativeUserDataSnapshot[]>;
  removeTag: (ids: string[], name: string) => Promise<NativeUserDataSnapshot[]>;
  restoreUserData: (snapshots: NativeUserDataSnapshot[]) => Promise<number>;
  listTags: () => Promise<Array<{ name: string; tracks: number }>>;
  /** Counts one listen locally (play count and last played). */
  recordPlay: (id: string) => Promise<void>;
  /** Hashes files for exact-duplicate detection (all tracks when `ids` is empty). */
  hashTracks: (ids: string[]) => Promise<NativeHashResult>;
  cancelHash: () => Promise<void>;
  onHashProgress: (
    listener: (progress: { done: number; total: number }) => void,
  ) => () => void;
  duplicates: () => Promise<NativeDuplicateGroup[]>;
  /** Folds ratings, tags, plays and playlist entries of `removeIds` into `keepId`, then removes them from the library (files untouched). */
  mergeTracks: (
    keepId: string,
    removeIds: string[],
  ) => Promise<NativeMergeResult>;
  /** Newest first, 100 per page. */
  playHistory: (
    offset: number,
  ) => Promise<{ entries: NativePlayLogEntry[]; total: number }>;
  clearPlayHistory: () => Promise<void>;
  /** What writing hand-edited tags into the files would do; nothing is written. */
  writeTagsPreview: (ids: string[]) => Promise<NativeWriteTagsPreview>;
  /** Writes edited fields into FLAC/WAV files (recoverable; optional backup copy). */
  writeTags: (
    ids: string[],
    keepBackup: boolean,
  ) => Promise<NativeWriteTagsResult>;
  /** Asks for the destination folder of an organize; `null` if cancelled. */
  organizePickDestination: () => Promise<string | null>;
  /** What organizing would copy/move where; nothing is touched. */
  organizePreview: (
    options: NativeOrganizeOptions,
  ) => Promise<NativeOrganizePlan>;
  /** Copies or moves files into the layout. A move needs `confirmed`. */
  organizeApply: (
    options: NativeOrganizeOptions,
    confirmed: boolean,
  ) => Promise<NativeOrganizeResult>;
  /** Asks where to save, writes the backup. `null` if cancelled. */
  exportBackup: () => Promise<NativeBackupSummary | null>;
  /** Asks for a backup file; `null` if cancelled. */
  pickBackup: () => Promise<string | null>;
  previewBackup: (
    sourcePath: string,
    mappings: NativeRootMapping[],
  ) => Promise<NativeRestorePreview>;
  restoreBackup: (
    sourcePath: string,
    mappings: NativeRootMapping[],
  ) => Promise<NativeRestoreResult>;
  /** Asks for a folder. `null` if cancelled. */
  pickFolder: () => Promise<string | null>;
};

export type NativeLibraryPage = {
  tracks: NativeLibraryTrack[];
  total: number;
};

export type NativeLibraryImportResult = {
  imported: number;
  /** Files walked (folder import / drag-drop) that had an unsupported extension. */
  skipped: number;
  errors: Array<{ path: string; error: string }>;
  /** True when `cancelImport` interrupted the loop before every path was processed. */
  cancelled: boolean;
};

export type NativeLibraryImportProgress = {
  done: number;
  total: number;
  imported: number;
  failed: number;
  skipped: number;
  /** `null` on the final (100%) event. */
  currentPath: string | null;
};

export type NativeLibraryRoot = {
  id: string;
  path: string;
  createdAt: string;
  lastScannedAt: string | null;
  trackCount: number;
  missingCount: number;
  /** Whether the folder itself currently exists (false for a disconnected drive). */
  available: boolean;
};

export type NativeRootScanResult = {
  imported: number;
  skipped: number;
  /** Known tracks whose file is no longer there. */
  missing: number;
  /** Previously-missing tracks whose file is back. */
  recovered: number;
  /** Renamed/moved files re-pointed at their new path (ID kept). */
  moved: number;
  /** Known files changed on disk and re-read. */
  updated: number;
  errors: Array<{ path: string; error: string }>;
  cancelled: boolean;
};

export type NativeRelinkRootResult = {
  root: NativeLibraryRoot;
  relinked: number;
  unmatched: number;
};

/** What analysis found for one track, kept apart from tags and your corrections. */
export type NativeAnalysisDetail = {
  analyzed: boolean;
  /** Made by an older algorithm, or the file changed since. */
  stale: boolean;
  /** 400 values, 0-255: waveform peak of each slice. Empty until analyzed. */
  peaks: number[];
  loudnessLufs: number | null;
  truePeakDbtp: number | null;
  tagBpm: number | null;
  tagKey: string | null;
  bpmEstimate: number | null;
  /** 0-1 heuristic. */
  bpmConfidence: number | null;
  keyEstimate: string | null;
  keyConfidence: number | null;
  userBpm: number | null;
  userKey: string | null;
  /** What filters and sorting use. */
  bpm: number | null;
  key: string | null;
  analyzedAt: string | null;
};

export type NativeAnalysisResult = {
  analyzed: number;
  reused: number;
  failed: number;
  cancelled: boolean;
};

export type NativeAnalysisProgress = {
  done: number;
  total: number;
  currentTitle: string | null;
};

export type NativeAnalysisSummary = {
  analyzed: number;
  total: number;
  running: boolean;
  paused: boolean;
};

/** A user correction as it was before a change, for undo. */
export type NativeCorrectionSnapshot = {
  id: string;
  bpm: number | null;
  key: string | null;
};

export type NativeRuleField =
  | 'title'
  | 'artist'
  | 'album'
  | 'genre'
  | 'format'
  | 'tag'
  | 'year'
  | 'rating'
  | 'playCount'
  | 'duration'
  | 'bpm'
  | 'key'
  | 'loudness'
  | 'lastPlayed'
  | 'added'
  | 'analyzed';

export type NativeRuleOp =
  | 'is'
  | 'isNot'
  | 'contains'
  | 'notContains'
  | 'atLeast'
  | 'atMost'
  | 'between'
  | 'inLastDays'
  | 'notInLastDays'
  | 'isSet'
  | 'isNotSet';

export type NativeSmartRule = {
  field: NativeRuleField;
  op: NativeRuleOp;
  value?: string;
  /** Upper bound for `between`. */
  value2?: string;
};

export type NativeSmartDefinition = {
  name: string;
  matchAll: boolean;
  rules: NativeSmartRule[];
  sort: NativeSortColumn;
  descending: boolean;
  limit: number | null;
};

export type NativeSmartPlaylist = NativeSmartDefinition & {
  id: string;
  createdAt: string;
};

export type NativeAnalysis = {
  /** Analyzes tracks one at a time in the background (all when `ids` is empty); finished ones are reused unless `force`. */
  analyze: (ids: string[], force: boolean) => Promise<NativeAnalysisResult>;
  cancel: () => Promise<void>;
  pause: (paused: boolean) => Promise<void>;
  summary: () => Promise<NativeAnalysisSummary>;
  onProgress: (
    listener: (progress: NativeAnalysisProgress) => void,
  ) => () => void;
  detail: (id: string) => Promise<NativeAnalysisDetail>;
  /** Sets your BPM/key (null leaves it, 0 / empty clears it); returns the previous values for undo. */
  setCorrections: (
    ids: string[],
    bpm: number | null,
    key: string | null,
  ) => Promise<NativeCorrectionSnapshot[]>;
  restoreCorrections: (
    snapshots: NativeCorrectionSnapshot[],
  ) => Promise<number>;
  clear: (ids: string[]) => Promise<void>;
  smart: {
    list: () => Promise<NativeSmartPlaylist[]>;
    save: (
      id: string | null,
      definition: NativeSmartDefinition,
    ) => Promise<NativeSmartPlaylist>;
    remove: (id: string) => Promise<void>;
    /** A saved list (`id`) or an unsaved draft (`definition`), re-evaluated now. 100 per page. */
    evaluate: (
      id: string | null,
      definition: NativeSmartDefinition | null,
      offset: number,
    ) => Promise<NativeLibraryPage>;
    trackIds: (id: string) => Promise<string[]>;
    /** Saves the current result as an ordinary playlist that no longer changes. */
    snapshot: (id: string, name: string) => Promise<NativePlaylistSummary>;
  };
};

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
};

declare global {
  var __TAHTI_NATIVE_LIBRARY__: TahtiNativeLibrary | undefined;
}

export function getNativeLibrary(): TahtiNativeLibrary | null {
  return globalThis.__TAHTI_NATIVE_LIBRARY__ ?? null;
}

export function playableFromNativeTrack(
  track: NativeLibraryTrack,
  streamUrl: string,
): TahtiPlayable {
  return {
    id: `local:${track.id}`,
    kind: 'sound',
    title: track.title,
    artist: track.artist || 'Unknown artist',
    streamUrl,
    protocol: 'https',
    sourceProvider: 'local',
    durationSec: track.duration,
  };
}

/**
 * A local playable's `streamUrl` is dropped before it's persisted to history
 * (see `redactEphemeralStreamUrl` in libraryStore) since it's a `blob:`
 * object URL or a Tauri `asset://` URL scoped to the session that created
 * it, dead by the time it's replayed from a fresh reload/restart. This
 * re-derives a live one from the native catalog by id; browser File-API
 * tracks have no durable handle to re-resolve from an id alone, so those
 * report unavailable instead of guessing.
 */
export async function resolveLocalPlayableForReplay(
  playable: TahtiPlayable,
): Promise<TahtiPlayable | null> {
  if (playable.sourceProvider !== 'local' || playable.streamUrl) {
    return playable;
  }
  const nativeLibrary = getNativeLibrary();
  if (!nativeLibrary) {
    return null;
  }
  const rawId = playable.id.replace(/^local:/, '');
  const streamUrl = await nativeLibrary.resolve(rawId);
  return { ...playable, streamUrl };
}

const LIST_CACHE_LIMIT = 60;

/**
 * Wraps a native library with an in-memory cache for the read paths the
 * Local files view hammers while typing/paging (`list`, `listUnavailable`,
 * `listRoots`). Identical (search, offset) requests — backspacing, returning
 * to a page, two components asking at once — resolve instantly and share one
 * in-flight IPC call. Any call that can change the catalog clears the cache,
 * and a result that was requested before a clear is never stored after it.
 * `resolve` is deliberately not cached: it doubles as a live existence check.
 */
export function withReadCache(library: TahtiNativeLibrary): TahtiNativeLibrary {
  const pages = new Map<string, Promise<NativeLibraryPage>>();
  let unavailable: Promise<NativeLibraryTrack[]> | null = null;
  let roots: Promise<NativeLibraryRoot[]> | null = null;
  let totals: Promise<NativeLibraryTotals> | null = null;
  const facets = new Map<NativeFacetKind, Promise<NativeFacetGroup[]>>();

  const invalidate = () => {
    pages.clear();
    facets.clear();
    totals = null;
    unavailable = null;
    roots = null;
  };
  const mutating =
    <Args extends unknown[], Result>(
      call: (...args: Args) => Promise<Result>,
    ) =>
    async (...args: Args): Promise<Result> => {
      try {
        return await call(...args);
      } finally {
        invalidate();
      }
    };

  return {
    ...library,
    list(search, offset, filter, sort, filters) {
      const key = `${offset}\u0000${search}\u0000${
        filter
          ? `${filter.kind}\u0000${filter.value}\u0000${filter.secondary ?? ''}`
          : ''
      }\u0000${sort ? `${sort.column}:${sort.descending}` : ''}\u0000${filters ? JSON.stringify(filters) : ''}`;
      const hit = pages.get(key);
      if (hit) {
        pages.delete(key);
        pages.set(key, hit);
        return hit;
      }
      const request = library.list(search, offset, filter, sort, filters);
      pages.set(key, request);
      if (pages.size > LIST_CACHE_LIMIT) {
        const oldest = pages.keys().next().value;
        if (oldest !== undefined) {
          pages.delete(oldest);
        }
      }
      request.catch(() => {
        if (pages.get(key) === request) {
          pages.delete(key);
        }
      });
      return request;
    },
    facets(kind) {
      const hit = facets.get(kind);
      if (hit) {
        return hit;
      }
      const request = library.facets(kind);
      facets.set(kind, request);
      request.catch(() => {
        if (facets.get(kind) === request) {
          facets.delete(kind);
        }
      });
      return request;
    },
    totals() {
      if (!totals) {
        const request = library.totals();
        totals = request;
        request.catch(() => {
          if (totals === request) {
            totals = null;
          }
        });
      }
      return totals;
    },
    listUnavailable() {
      if (!unavailable) {
        const request = library.listUnavailable();
        unavailable = request;
        request.catch(() => {
          if (unavailable === request) {
            unavailable = null;
          }
        });
      }
      return unavailable;
    },
    listRoots() {
      if (!roots) {
        const request = library.listRoots();
        roots = request;
        request.catch(() => {
          if (roots === request) {
            roots = null;
          }
        });
      }
      return roots;
    },
    import: mutating(library.import),
    importFolder: mutating(library.importFolder),
    importPaths: mutating(library.importPaths),
    remove: mutating(library.remove),
    removeMany: mutating(library.removeMany),
    rescan: mutating(library.rescan),
    relink: mutating(library.relink),
    addRoot: mutating(library.addRoot),
    removeRoot: mutating(library.removeRoot),
    rescanRoots: mutating(library.rescanRoots),
    relinkRoot: mutating(library.relinkRoot),
    analysis: {
      ...library.analysis,
      analyze: mutating(library.analysis.analyze),
      setCorrections: mutating(library.analysis.setCorrections),
      restoreCorrections: mutating(library.analysis.restoreCorrections),
      clear: mutating(library.analysis.clear),
    },
    catalog: {
      ...library.catalog,
      editTracks: mutating(library.catalog.editTracks),
      restoreEdits: mutating(library.catalog.restoreEdits),
      setRating: mutating(library.catalog.setRating),
      setColor: mutating(library.catalog.setColor),
      addTag: mutating(library.catalog.addTag),
      removeTag: mutating(library.catalog.removeTag),
      restoreUserData: mutating(library.catalog.restoreUserData),
      recordPlay: mutating(library.catalog.recordPlay),
      mergeTracks: mutating(library.catalog.mergeTracks),
      clearPlayHistory: mutating(library.catalog.clearPlayHistory),
      writeTags: mutating(library.catalog.writeTags),
      organizeApply: mutating(library.catalog.organizeApply),
      restoreBackup: mutating(library.catalog.restoreBackup),
    },
  };
}
