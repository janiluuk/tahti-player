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
  /** File name of the embedded cover in the native artwork cache. */
  artworkKey: string | null;
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

/** Unfinished imports (quit or cancelled mid-way) that can be resumed. */
export type NativePendingImport = {
  /** Files not yet reached. */
  files: number;
  jobs: number;
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
