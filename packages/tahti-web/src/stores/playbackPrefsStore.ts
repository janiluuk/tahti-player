import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { NormalizationMode } from '../lib/replayGain';

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

export const FULL_PLAYER_TITLE_TRANSITIONS = [
  'fade',
  'slide-up',
  'soft-scale',
  'slide-side',
] as const;

export type FullPlayerTitleTransition =
  (typeof FULL_PLAYER_TITLE_TRANSITIONS)[number];

export const DEFAULT_FULL_PLAYER_TITLE_TRANSITION: FullPlayerTitleTransition =
  'fade';

export function toFullPlayerTitleTransition(
  value: unknown,
): FullPlayerTitleTransition {
  return (
    FULL_PLAYER_TITLE_TRANSITIONS.find((item) => item === value) ??
    DEFAULT_FULL_PLAYER_TITLE_TRANSITION
  );
}

type PlaybackPrefsState = {
  /** Seconds moved by seek forward/backward (Shift+Arrow, OS media keys). */
  skipSeconds: number;
  setSkipSeconds: (value: number) => void;
  /** Loudness normalization for local library files; off by default. */
  normalization: NormalizationMode;
  setNormalization: (mode: NormalizationMode) => void;
  /** Whether a channel page may start playing on its own; on by default.
   * The channel's artist has a switch of their own, and both must be on. */
  channelAutoplay: boolean;
  setChannelAutoplay: (value: boolean) => void;
  /** Hold a screen wake lock while the full-screen player is playing; off by default. */
  keepScreenOn: boolean;
  setKeepScreenOn: (value: boolean) => void;
  /** How the full-screen player's title animates when the track changes. */
  fullPlayerTitleTransition: FullPlayerTitleTransition;
  setFullPlayerTitleTransition: (value: FullPlayerTitleTransition) => void;
};

export const usePlaybackPrefsStore = create<PlaybackPrefsState>()(
  persist(
    (set) => ({
      skipSeconds: DEFAULT_SKIP_SECONDS,
      setSkipSeconds: (value) => set({ skipSeconds: clampSkipSeconds(value) }),
      normalization: 'off',
      setNormalization: (normalization) => set({ normalization }),
      channelAutoplay: true,
      setChannelAutoplay: (channelAutoplay) => set({ channelAutoplay }),
      keepScreenOn: false,
      setKeepScreenOn: (keepScreenOn) => set({ keepScreenOn }),
      fullPlayerTitleTransition: DEFAULT_FULL_PLAYER_TITLE_TRANSITION,
      setFullPlayerTitleTransition: (value) =>
        set({ fullPlayerTitleTransition: toFullPlayerTitleTransition(value) }),
    }),
    {
      name: 'tahti-playback-prefs',
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<PlaybackPrefsState>;
        return {
          ...current,
          ...saved,
          fullPlayerTitleTransition: toFullPlayerTitleTransition(
            saved.fullPlayerTitleTransition,
          ),
        };
      },
    },
  ),
);
