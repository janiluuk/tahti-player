/** Types for downloading a provider set (hearthis.at) into the native library. */

export type NativeImportProvider = 'hearthis';

export type NativeProviderImportEntry = {
  remoteId: string;
  title: string;
  artist: string;
  downloadUrl: string;
  /** The provider's suggested file name; only its extension is used. */
  fileName: string | null;
};

export type NativeProviderImportRequest = {
  provider: NativeImportProvider;
  setId: string;
  setTitle: string;
  /** Absolute folder the files are saved in. */
  destination: string;
  /** Set order; downloadable entries only. */
  entries: NativeProviderImportEntry[];
  /** Native playlist that holds the set in order, reused when it exists. */
  playlistName: string | null;
};

export type NativeProviderEntryState =
  'downloading' | 'imported' | 'skipped' | 'failed' | 'cancelled';

export type NativeProviderImportProgress = {
  remoteId: string;
  state: NativeProviderEntryState;
  receivedBytes: number;
  totalBytes: number | null;
  error: string | null;
};

export type NativeProviderImportResult = {
  imported: number;
  skipped: number;
  failures: { remoteId: string; title: string; error: string }[];
  cancelled: boolean;
  playlistId: string | null;
  /** Library ids of the imported and skipped tracks, in set order. */
  trackIds: string[];
};

export type NativeProviderImport = {
  /** The default folder for a set, e.g. `~/Music/Tahti/hearthis.at/<set>`. */
  destination: (
    provider: NativeImportProvider,
    setTitle: string,
  ) => Promise<string>;
  start: (
    request: NativeProviderImportRequest,
  ) => Promise<NativeProviderImportResult>;
  cancel: () => Promise<void>;
  /** Subscribes to per-track progress; returns an unsubscribe function. */
  onProgress: (
    listener: (progress: NativeProviderImportProgress) => void,
  ) => () => void;
};
