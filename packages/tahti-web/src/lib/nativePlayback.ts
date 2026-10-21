import { toast } from 'sonner';

import type { TahtiPlayable } from '../api/types';
import {
  playableFromNativeTrack,
  type TahtiNativeLibrary,
} from './nativeLibrary';

/** Most tracks one bulk play / queue action will take. */
export const PLAYBACK_LIMIT = 5000;
const BATCH = 500;

/**
 * Turns library track ids into playables, keeping the order given. Missing
 * files are skipped and reported; more than `PLAYBACK_LIMIT` ids are cut
 * (and reported) so a whole-library action can't flood the queue. `noun`
 * words the messages ("selected", "playlist", "matching").
 */
export async function preparePlayables(
  library: TahtiNativeLibrary,
  ids: string[],
  noun: string,
): Promise<TahtiPlayable[]> {
  const used = ids.slice(0, PLAYBACK_LIMIT);
  const playables: TahtiPlayable[] = [];
  let unavailable = 0;
  for (let start = 0; start < used.length; start += BATCH) {
    const batch = await library.prepareBatch(used.slice(start, start + BATCH));
    unavailable += batch.unavailable;
    for (const item of batch.items) {
      playables.push(playableFromNativeTrack(item.track, item.streamUrl));
    }
  }
  if (unavailable) {
    toast.info(
      unavailable === 1
        ? `1 ${noun} file is missing and was skipped.`
        : `${unavailable} ${noun} files are missing and were skipped.`,
    );
  }
  if (ids.length > used.length) {
    toast.info(
      `Only the first ${PLAYBACK_LIMIT.toLocaleString('en-US')} of ${ids.length.toLocaleString('en-US')} ${noun} tracks were used.`,
    );
  }
  return playables;
}

/** Unbiased shuffle (Fisher–Yates) of a copy. */
export function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap] as T, copy[index] as T];
  }
  return copy;
}
