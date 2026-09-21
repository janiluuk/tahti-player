import { usePlayerStore } from '../stores/playerStore';
import { getNativeLibrary } from './nativeLibrary';

const LOCAL_PREFIX = 'local:';
/** A listen counts once the track has played this long (or half of it, for short tracks). */
const COUNT_AFTER_SECONDS = 30;

export function playCountThreshold(durationSeconds: number): number {
  return durationSeconds > 0
    ? Math.min(COUNT_AFTER_SECONDS, durationSeconds / 2)
    : COUNT_AFTER_SECONDS;
}

/**
 * Counts a listen for local library tracks (play count and last played, kept
 * on this device only). A listen counts once per play-through: after 30 s or
 * half the track, whichever is less; seeking back to the start of the same
 * track (repeat) arms it again. Skipping through tracks counts nothing.
 */
export function startLocalPlayCounting(): () => void {
  let tracked: string | null = null;
  let counted = false;
  return usePlayerStore.subscribe((state) => {
    if (state.currentId !== tracked) {
      tracked = state.currentId;
      counted = false;
    }
    if (counted && state.currentTime < 2) {
      counted = false;
    }
    if (
      counted ||
      !tracked?.startsWith(LOCAL_PREFIX) ||
      state.status !== 'playing' ||
      state.currentTime < playCountThreshold(state.duration)
    ) {
      return;
    }
    counted = true;
    const library = getNativeLibrary();
    if (library) {
      // Bookkeeping only: a failure must never interrupt playback.
      library.catalog
        .recordPlay(tracked.slice(LOCAL_PREFIX.length))
        .catch(() => undefined);
    }
  });
}
