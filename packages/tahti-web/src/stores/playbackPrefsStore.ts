import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const SKIP_SECONDS_MIN = 1;
export const SKIP_SECONDS_MAX = 60;
export const DEFAULT_SKIP_SECONDS = 5;

export function clampSkipSeconds(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SKIP_SECONDS;
  }
  return Math.min(
    SKIP_SECONDS_MAX,
    Math.max(SKIP_SECONDS_MIN, Math.round(value)),
  );
}

type PlaybackPrefsState = {
  /** Seconds moved by seek forward/backward (Shift+Arrow, OS media keys). */
  skipSeconds: number;
  setSkipSeconds: (value: number) => void;
};

export const usePlaybackPrefsStore = create<PlaybackPrefsState>()(
  persist(
    (set) => ({
      skipSeconds: DEFAULT_SKIP_SECONDS,
      setSkipSeconds: (value) => set({ skipSeconds: clampSkipSeconds(value) }),
    }),
    { name: 'tahti-playback-prefs' },
  ),
);
