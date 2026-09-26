import { useCallback, useEffect, useRef, useState } from 'react';

import {
  fetchHearthisCollectionTracks,
  fetchHearthisLibrary,
  parseHearthisSetPermalink,
  type HearthisCollection,
  type HearthisTrack,
} from '../../api/sources';
import type {
  NativeProviderEntryState,
  NativeProviderImport,
  NativeProviderImportEntry,
  NativeProviderImportProgress,
  NativeProviderImportResult,
  NativeProviderImportSpace,
} from '../../lib/nativeLibrary';

export type SetImportPhase = 'pick' | 'loading' | 'review' | 'running' | 'done';

export type SetImportRowState =
  'ready' | 'unavailable' | 'waiting' | NativeProviderEntryState;

export type SetImportRow = {
  track: HearthisTrack;
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

const toEntries = (rows: SetImportRow[]): NativeProviderImportEntry[] =>
  rows
    .filter((row) => row.track.download)
    .map((row) => ({
      remoteId: row.track.id,
      title: row.track.title,
      artist: row.track.username,
      downloadUrl: row.track.download!.url,
      fileName: row.track.download!.fileName,
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
 * State for importing one hearthis.at set into the desktop library: pick a
 * set, review which tracks the uploader offers for download, run the native
 * download with live per-track progress, then retry just the failures.
 */
export function useHearthisSetImport({
  isOpen,
  providerImport,
  onImported,
}: {
  isOpen: boolean;
  providerImport: NativeProviderImport;
  onImported: () => void;
}) {
  const [phase, setPhase] = useState<SetImportPhase>('pick');
  const [link, setLink] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [yourSets, setYourSets] = useState<HearthisCollection[]>([]);
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
    let cancelled = false;
    void fetchHearthisLibrary().then(({ data }) => {
      if (!cancelled) {
        setYourSets(data.collections);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (phase !== 'review' || !title.trim()) {
      return;
    }
    let cancelled = false;
    providerImport
      .destination('hearthis', title)
      .then((value) => !cancelled && setDestination(value))
      .catch((failure) => !cancelled && setError(errorText(failure)));
    return () => {
      cancelled = true;
    };
  }, [phase, title, providerImport]);

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
        provider: 'hearthis',
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
  }, [phase, destination, rows, setId, title, providerImport, spaceCheck]);

  useEffect(
    () =>
      providerImport.onProgress((event) =>
        setRows((current) => applyProgress(current, event)),
      ),
    [providerImport],
  );

  const loadSet = useCallback(async (permalink: string, name?: string) => {
    setError(null);
    setPhase('loading');
    try {
      const tracks = await fetchHearthisCollectionTracks(permalink);
      if (!openRef.current) {
        return;
      }
      if (tracks.length === 0) {
        setError('That set has no tracks.');
        setPhase('pick');
        return;
      }
      setSetId(permalink);
      setTitle(name?.trim() || `hearthis.at set ${permalink}`);
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
  }, []);

  const loadLink = useCallback(() => {
    const permalink = parseHearthisSetPermalink(link);
    if (!permalink) {
      setError('Paste a hearthis.at set link, like hearthis.at/set/…');
      return;
    }
    void loadSet(permalink);
  }, [link, loadSet]);

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
        const outcome = await providerImport.start({
          provider: 'hearthis',
          setId,
          setTitle: title.trim(),
          destination,
          // The whole downloadable set goes in each time, in order, so the
          // playlist keeps set order on a retry; finished tracks are skipped
          // natively without downloading again.
          entries: toEntries(rows),
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
    [rows, destination, providerImport, setId, title, makePlaylist, onImported],
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
    loadLink,
    loadSet,
    start: () => void run(),
    retryFailed,
    cancel,
    back: () => setPhase('pick'),
  };
}
