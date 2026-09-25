import type { RepeatMode } from '@tahti-player/model';

import { usePlayerStore } from '../stores/playerStore';

const KEY = 'tahti-player-prefs-v1';
const REPEAT_MODES: readonly RepeatMode[] = ['off', 'all', 'one'];

export type PersistedPlayerPrefs = {
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeatMode: RepeatMode;
};

export function parsePlayerPrefs(
  raw: string | null,
): Partial<PersistedPlayerPrefs> {
  if (!raw) {
    return {};
  }
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!data || typeof data !== 'object') {
    return {};
  }
  const record = data as Record<string, unknown>;
  const prefs: Partial<PersistedPlayerPrefs> = {};
  if (
    typeof record.volume === 'number' &&
    record.volume >= 0 &&
    record.volume <= 1
  ) {
    prefs.volume = record.volume;
  }
  if (typeof record.muted === 'boolean') {
    prefs.muted = record.muted;
  }
  if (typeof record.shuffle === 'boolean') {
    prefs.shuffle = record.shuffle;
  }
  if (REPEAT_MODES.includes(record.repeatMode as RepeatMode)) {
    prefs.repeatMode = record.repeatMode as RepeatMode;
  }
  return prefs;
}

/** Applies saved volume/mute/shuffle/repeat, then keeps them saved. */
export function startPlayerPrefsPersistence(): () => void {
  try {
    usePlayerStore.setState(parsePlayerPrefs(localStorage.getItem(KEY)));
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
  }
  return usePlayerStore.subscribe((state, prev) => {
    if (
      state.volume === prev.volume &&
      state.muted === prev.muted &&
      state.shuffle === prev.shuffle &&
      state.repeatMode === prev.repeatMode
    ) {
      return;
    }
    const prefs: PersistedPlayerPrefs = {
      volume: state.volume,
      muted: state.muted,
      shuffle: state.shuffle,
      repeatMode: state.repeatMode,
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
      // Storage can be unavailable (private mode, blocked site data).
    }
  });
}
