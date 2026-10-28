import { useEffect } from 'react';
import { create } from 'zustand';

import { isForceMock } from '../api/mode';
import { probeRadioStream } from '../api/radio-sources';
import type { StreamFailure } from '../lib/streamFailure';

export type StationHealth =
  | { state: 'checking' }
  | { state: 'ok'; checkedAt: number }
  | { state: 'unavailable'; failure: StreamFailure; checkedAt: number }
  /** Checked, but the browser could not tell (offline or no CORS). */
  | { state: 'unknown'; checkedAt: number };

type StationHealthState = {
  /** Keyed by stream URL; lives for the session only. */
  byUrl: Record<string, StationHealth>;
  markOk: (streamUrl: string) => void;
  markUnavailable: (streamUrl: string, failure: StreamFailure) => void;
  /** Probes the stream now, replacing any earlier result. */
  check: (
    streamUrl: string,
    options?: { timeoutCounts?: boolean },
  ) => Promise<StationHealth>;
  /** Probes the stream once per session; later calls reuse the result. */
  ensureChecked: (streamUrl: string) => void;
  reset: () => void;
};

// Background checks are skipped in mock mode (Storybook) and unit tests,
// which would otherwise reach real stream hosts. A background timeout is
// left inconclusive: a slow host should not mark a whole list unavailable.
const PRECHECK_ENABLED = !isForceMock() && import.meta.env.MODE !== 'test';

export const useStationHealthStore = create<StationHealthState>((set, get) => ({
  byUrl: {},

  markOk: (streamUrl) =>
    set((s) => ({
      byUrl: {
        ...s.byUrl,
        [streamUrl]: { state: 'ok', checkedAt: Date.now() },
      },
    })),

  markUnavailable: (streamUrl, failure) =>
    set((s) => ({
      byUrl: {
        ...s.byUrl,
        [streamUrl]: { state: 'unavailable', failure, checkedAt: Date.now() },
      },
    })),

  check: async (streamUrl, { timeoutCounts = true } = {}) => {
    set((s) => ({
      byUrl: { ...s.byUrl, [streamUrl]: { state: 'checking' } },
    }));
    const probe = await probeRadioStream(streamUrl);
    const checkedAt = Date.now();
    const health: StationHealth =
      probe.state === 'ok'
        ? { state: 'ok', checkedAt }
        : probe.state === 'failed' &&
            (timeoutCounts || probe.failure.reason !== 'timeout')
          ? { state: 'unavailable', failure: probe.failure, checkedAt }
          : { state: 'unknown', checkedAt };
    set((s) => ({ byUrl: { ...s.byUrl, [streamUrl]: health } }));
    return health;
  },

  ensureChecked: (streamUrl) => {
    if (!PRECHECK_ENABLED || get().byUrl[streamUrl]) {
      return;
    }
    void get().check(streamUrl, { timeoutCounts: false });
  },

  reset: () => set({ byUrl: {} }),
}));

/** The session's health result for a stream, starting a one-off probe. */
export function useStationHealth(
  streamUrl: string | null | undefined,
  { precheck = true }: { precheck?: boolean } = {},
): StationHealth | undefined {
  const health = useStationHealthStore((s) =>
    streamUrl ? s.byUrl[streamUrl] : undefined,
  );
  const ensureChecked = useStationHealthStore((s) => s.ensureChecked);
  useEffect(() => {
    if (streamUrl && precheck) {
      ensureChecked(streamUrl);
    }
  }, [streamUrl, precheck, ensureChecked]);
  return health;
}
