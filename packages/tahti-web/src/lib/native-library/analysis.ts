import type { NativePlaylistSummary } from './playlists';
import type { NativeLibraryPage, NativeSortColumn } from './tracks';

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
