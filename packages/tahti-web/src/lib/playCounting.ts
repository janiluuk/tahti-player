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
 * Counts listens and skips for local library tracks (kept on this device
 * only). A listen counts once per play-through: after 30 s or half the track,
 * whichever is less; seeking back to the start of the same track (repeat) arms
 * it again. A skip is the opposite: the track was playing (with a known
 * length) and the player moved to another track before the listen counted.
 */
export function startLocalPlayCounting(): () => void {
  let tracked: string | null = null;
  let counted = false;
  let started = false;
  return usePlayerStore.subscribe((state) => {
    if (state.currentId !== tracked) {
      if (state.currentId && started && !counted) {
        record(tracked, 'recordSkip');
      }
      tracked = state.currentId;
      counted = false;
      started = false;
    }
    if (!tracked?.startsWith(LOCAL_PREFIX)) {
      return;
    }
    if (counted && state.currentTime < 2) {
      counted = false;
    }
    if (state.status !== 'playing') {
      return;
    }
    if (state.duration > 0) {
      started = true;
    }
    if (counted || state.currentTime < playCountThreshold(state.duration)) {
      return;
    }
    counted = true;
    record(tracked, 'recordPlay');
  });
}

function record(
  playableId: string | null,
  method: 'recordPlay' | 'recordSkip',
): void {
  const library = getNativeLibrary();
  if (!library || !playableId?.startsWith(LOCAL_PREFIX)) {
    return;
  }
  // Bookkeeping only: a failure must never interrupt playback.
  library.catalog[method](playableId.slice(LOCAL_PREFIX.length)).catch(
    () => undefined,
  );
}
