import type { NativeLibraryTrack } from './tracks';

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
