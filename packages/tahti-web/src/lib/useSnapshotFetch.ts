import { useEffect, useRef, useState } from 'react';

const STORAGE_PREFIX = 'tahti-web:snapshot:';

type Snapshot<T> = { at: number; value: T };

const memory = new Map<string, Snapshot<unknown>>();

function readSnapshot<T>(key: string): Snapshot<T> | null {
  const hit = memory.get(key);
  if (hit) {
    return hit as Snapshot<T>;
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Snapshot<T>;
    memory.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function writeSnapshot<T>(key: string, value: T) {
  const snapshot = { at: Date.now(), value };
  memory.set(key, snapshot);
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(snapshot));
  } catch {
    return;
  }
}

export function clearSnapshots() {
  memory.clear();
  try {
    for (const storageKey of Object.keys(sessionStorage)) {
      if (storageKey.startsWith(STORAGE_PREFIX)) {
        sessionStorage.removeItem(storageKey);
      }
    }
  } catch {
    return;
  }
}

export type SnapshotFetchState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  updatedAt: number | null;
  retry: () => void;
  mutate: (update: (current: T | null) => T) => void;
};

/** Stale-while-revalidate for a slow page: renders the last successful
 * result for `key` at once (kept in memory and sessionStorage), then
 * refetches in the background. `load` throws when its result must not
 * replace the snapshot. */
export function useSnapshotFetch<T>(
  key: string,
  load: () => Promise<T>,
): SnapshotFetchState<T> {
  const initial = readSnapshot<T>(key);
  const [data, setData] = useState<T | null>(initial?.value ?? null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(
    initial?.at ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  const shownKey = useRef(key);

  useEffect(() => {
    let cancelled = false;
    if (shownKey.current !== key) {
      shownKey.current = key;
      const saved = readSnapshot<T>(key);
      setData(saved?.value ?? null);
      setUpdatedAt(saved?.at ?? null);
    }
    setPending(true);
    loadRef
      .current()
      .then((result) => {
        if (cancelled) {
          return;
        }
        writeSnapshot(key, result);
        setData(result);
        setUpdatedAt(Date.now());
        setError(null);
        setPending(false);
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : String(err));
        setPending(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key, attempt]);

  return {
    data,
    error,
    loading: pending && data === null,
    refreshing: pending && data !== null,
    updatedAt,
    retry: () => setAttempt((n) => n + 1),
    mutate: (update) => {
      setData((current) => {
        const next = update(current);
        writeSnapshot(key, next);
        return next;
      });
    },
  };
}
