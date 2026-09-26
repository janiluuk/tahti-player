import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  NativeProviderEntryState,
  NativeProviderImport,
  NativeProviderImportEntry,
  NativeProviderImportProgress,
  NativeProviderImportResult,
  NativeProviderImportSpace,
} from '../../lib/nativeLibrary';
import type {
  SetImportSource,
  SetImportSummary,
  SetImportTrack,
} from './setImportSources';

export type SetImportPhase = 'pick' | 'loading' | 'review' | 'running' | 'done';

export type SetImportRowState =
  'ready' | 'unavailable' | 'waiting' | NativeProviderEntryState;

export type SetImportRow = {
  track: SetImportTrack;
  state: SetImportRowState;
  /** 0-100 while downloading, when the size is known. */
  percent: number | null;
  error: string | null;
};

/** The up-front size check shown on the review step. */
export type SetImportSpace =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'ready'; value: NativeProviderImportSpace }
  | { status: 'failed'; error: string };

/** Title edits move the destination; size the set once typing settles. */
const SPACE_DEBOUNCE_MS = 400;

/** Links this close to expiring are fetched again before a download starts. */
const LINK_EXPIRY_MARGIN_MS = 10 * 60 * 1000;

const expiresSoon = (rows: SetImportRow[], now: number) =>
  rows.some((row) => {
    const expiresAt = row.track.download?.expiresAt;
    return expiresAt
      ? Date.parse(expiresAt) - now < LINK_EXPIRY_MARGIN_MS
      : false;
  });

/** Takes the fresh download links, keeping each row's state. */
function withFreshLinks(
  rows: SetImportRow[],
  fresh: SetImportTrack[],
): SetImportRow[] {
  const byId = new Map(fresh.map((track) => [track.id, track]));
  return rows.map((row) => {
    const track = byId.get(row.track.id);
    return track
      ? { ...row, track: { ...row.track, download: track.download } }
      : row;
  });
}

const toEntries = (rows: SetImportRow[]): NativeProviderImportEntry[] =>
  rows
    .filter((row) => row.track.download)
    .map((row) => ({
      remoteId: row.track.id,
      title: row.track.title,
      artist: row.track.username,
      downloadUrl: row.track.download!.url,
      fileName: row.track.download!.fileName ?? null,
    }));

const errorText = (failure: unknown) =>
  failure instanceof Error ? failure.message : String(failure);

function applyProgress(
  rows: SetImportRow[],
  event: NativeProviderImportProgress,
): SetImportRow[] {
  return rows.map((row) => {
    if (row.track.id !== event.remoteId) {
      return row;
    }
    const percent =
      event.state === 'downloading' && event.totalBytes
        ? Math.min(
            100,
            Math.round((event.receivedBytes / event.totalBytes) * 100),
          )
        : null;
    return { ...row, state: event.state, percent, error: event.error };
  });
}

/**
 * State for importing one provider set into the desktop library: pick a set,
 * review which tracks the uploader offers for download, run the native
 * download with live per-track progress, then retry just the failures.
 */
export function useProviderSetImport({
  isOpen,
  source,
  providerImport,
  onImported,
}: {
  isOpen: boolean;
  source: SetImportSource;
  providerImport: NativeProviderImport;
  onImported: () => void;
}) {
  const [phase, setPhase] = useState<SetImportPhase>('pick');
  const [link, setLink] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [yourSets, setYourSets] = useState<SetImportSummary[]>([]);
  const [yourSetsError, setYourSetsError] = useState<string | null>(null);
  const [setId, setSetId] = useState('');
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [makePlaylist, setMakePlaylist] = useState(true);
  const [rows, setRows] = useState<SetImportRow[]>([]);
  const [result, setResult] = useState<NativeProviderImportResult | null>(null);
  const [space, setSpace] = useState<SetImportSpace>({ status: 'idle' });
  const [spaceCheck, setSpaceCheck] = useState(0);
  const openRef = useRef(isOpen);
  openRef.current = isOpen;

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setPhase('pick');
    setLink('');
    setError(null);
    setRows([]);
    setResult(null);
    setYourSets([]);
    setYourSetsError(null);
    let cancelled = false;
    source
      .yourSets()
      .then((sets) => !cancelled && setYourSets(sets))
      .catch((failure) => !cancelled && setYourSetsError(errorText(failure)));
    return () => {
      cancelled = true;
    };
  }, [isOpen, source]);

  useEffect(() => {
    if (phase !== 'review' || !title.trim()) {
      return;
    }
    let cancelled = false;
    providerImport
      .destination(source.provider, title)
      .then((value) => !cancelled && setDestination(value))
      .catch((failure) => !cancelled && setError(errorText(failure)));
    return () => {
      cancelled = true;
    };
  }, [phase, title, providerImport, source]);

  useEffect(() => {
    const estimate = providerImport.space;
    const entries = toEntries(rows);
    if (phase !== 'review' || !estimate || !destination || !entries.length) {
      setSpace({ status: 'idle' });
      return;
    }
    let cancelled = false;
    setSpace({ status: 'checking' });
    const timer = setTimeout(() => {
      estimate({
        provider: source.provider,
        setId,
        setTitle: title.trim(),
        destination,
        entries,
        playlistName: null,
      })
        .then((value) => !cancelled && setSpace({ status: 'ready', value }))
        .catch(
          (failure) =>
            !cancelled &&
            setSpace({ status: 'failed', error: errorText(failure) }),
        );
    }, SPACE_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    phase,
    destination,
    rows,
    setId,
    title,
    providerImport,
    source,
    spaceCheck,
  ]);

  useEffect(
    () =>
      providerImport.onProgress((event) =>
        setRows((current) => applyProgress(current, event)),
      ),
    [providerImport],
  );

  const loadSet = useCallback(
    async (set: SetImportSummary) => {
      setError(null);
      setPhase('loading');
      try {
        const tracks = await source.tracks(set.id);
        if (!openRef.current) {
          return;
        }
        if (tracks.length === 0) {
          setError('That set has no tracks.');
          setPhase('pick');
          return;
        }
        setSetId(set.id);
        setTitle(set.title.trim() || `${source.label} set ${set.id}`);
        setRows(
          tracks.map((track) => ({
            track,
            state: track.download ? 'ready' : 'unavailable',
            percent: null,
            error: null,
          })),
        );
        setPhase('review');
      } catch (failure) {
        setError(`Could not load the set: ${errorText(failure)}`);
        setPhase('pick');
      }
    },
    [source],
  );

  const loadLink = useCallback(async () => {
    setError(null);
    let set: SetImportSummary | null;
    try {
      setPhase('loading');
      set = await source.resolveLink(link);
    } catch (failure) {
      setError(`Could not load the set: ${errorText(failure)}`);
      setPhase('pick');
      return;
    }
    if (!openRef.current) {
      return;
    }
    if (!set) {
      setError(source.badLinkMessage);
      setPhase('pick');
      return;
    }
    await loadSet(set);
  }, [link, loadSet, source]);

  const run = useCallback(
    async (onlyIds?: Set<string>) => {
      const chosen = rows.filter(
        (row) =>
          row.track.download && (onlyIds ? onlyIds.has(row.track.id) : true),
      );
      if (chosen.length === 0 || !destination) {
        return;
      }
      const chosenIds = new Set(chosen.map((row) => row.track.id));
      setError(null);
      setResult(null);
      setRows((current) =>
        current.map((row) =>
          chosenIds.has(row.track.id)
            ? { ...row, state: 'waiting', percent: null, error: null }
            : row,
        ),
      );
      setPhase('running');
      try {
        let current = rows;
        if (expiresSoon(current, Date.now())) {
          const fresh = await source.tracks(setId);
          current = withFreshLinks(current, fresh);
          setRows((shown) => withFreshLinks(shown, fresh));
        }
        const outcome = await providerImport.start({
          provider: source.provider,
          setId,
          setTitle: title.trim(),
          destination,
          // The whole downloadable set goes in each time, in order, so the
          // playlist keeps set order on a retry; finished tracks are skipped
          // natively without downloading again.
          entries: toEntries(current),
          playlistName: makePlaylist ? title.trim() : null,
        });
        setResult(outcome);
        if (outcome.imported > 0 || outcome.playlistId) {
          onImported();
        }
      } catch (failure) {
        setError(errorText(failure));
      } finally {
        setPhase('done');
      }
    },
    [
      rows,
      destination,
      providerImport,
      source,
      setId,
      title,
      makePlaylist,
      onImported,
    ],
  );

  const retryFailed = useCallback(() => {
    const failed = new Set(
      rows
        .filter((row) => row.state === 'failed' || row.state === 'cancelled')
        .map((row) => row.track.id),
    );
    void run(failed);
  }, [rows, run]);

  const cancel = useCallback(() => {
    void providerImport.cancel();
  }, [providerImport]);

  const downloadable = rows.filter((row) => row.track.download).length;
  const failedCount = rows.filter(
    (row) => row.state === 'failed' || row.state === 'cancelled',
  ).length;

  return {
    phase,
    link,
    setLink,
    error,
    yourSets,
    yourSetsError,
    title,
    setTitle,
    destination,
    makePlaylist,
    setMakePlaylist,
    rows,
    result,
    space,
    recheckSpace: () => setSpaceCheck((count) => count + 1),
    downloadable,
    failedCount,
    loadLink: () => void loadLink(),
    loadSet: (set: SetImportSummary) => void loadSet(set),
    start: () => void run(),
    retryFailed,
    cancel,
    back: () => setPhase('pick'),
  };
}
