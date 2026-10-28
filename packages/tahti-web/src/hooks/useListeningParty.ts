import { useCallback, useEffect, useState } from 'react';

import {
  fetchListeningParty,
  type ListeningPartyDto,
} from '../api/listening-parties';
import { usePolling } from './usePolling';

/** Re-read the party now and then so a reschedule or a cancel reaches an
 * open page without a reload. */
const REFRESH_MS = 60_000;

export type ListeningPartyLoad =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; error: string }
  | { status: 'ready'; party: ListeningPartyDto; receivedAt: number };

export function useListeningParty(id: string): {
  load: ListeningPartyLoad;
  reload: () => void;
} {
  const [load, setLoad] = useState<ListeningPartyLoad>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  const read = useCallback(
    (initial: boolean) => {
      let cancelled = false;
      void fetchListeningParty(id).then(({ data, meta, notFound }) => {
        if (cancelled) {
          return;
        }
        const receivedAt = Date.now();
        if (data) {
          setLoad({ status: 'ready', party: data, receivedAt });
          return;
        }
        // A failed background refresh keeps showing the party it already has.
        if (!initial) {
          return;
        }
        setLoad(
          notFound
            ? { status: 'not-found' }
            : {
                status: 'error',
                error: meta.reason ?? 'Could not load this listening party',
              },
        );
      });
      return () => {
        cancelled = true;
      };
    },
    [id],
  );

  useEffect(() => {
    setLoad({ status: 'loading' });
    return read(true);
  }, [read, attempt]);

  const state = load.status === 'ready' ? load.party.state : null;
  usePolling(
    () => {
      read(false);
    },
    REFRESH_MS,
    state === 'SCHEDULED' || state === 'LIVE',
  );

  return { load, reload: () => setAttempt((n) => n + 1) };
}
