import { toast } from 'sonner';

import { i18n } from '@tahti-player/i18n';

import { useLibraryStore } from '../stores/libraryStore';
import { useSoundLikesStore } from '../stores/soundLikesStore';
import { trackLikeTarget } from './trackLikeTarget';

const FLAG_PREFIX = 'tahti-web:track-favorites-moved';
const DONE = 'done';
/** Tracks that keep failing (deleted, made private) stop being retried. */
const MAX_ATTEMPTS = 3;

export type TrackFavoritesMove = { moved: number; failed: number };

const flagKey = (userId: string) => `${FLAG_PREFIX}:${userId}`;

function readAttempts(userId: string): number | typeof DONE {
  try {
    const raw = localStorage.getItem(flagKey(userId));
    if (raw === DONE) {
      return DONE;
    }
    const attempts = Number(raw ?? 0);
    return Number.isFinite(attempts) ? attempts : 0;
  } catch {
    return DONE;
  }
}

function writeFlag(userId: string, value: number | typeof DONE) {
  try {
    localStorage.setItem(flagKey(userId), String(value));
  } catch {
    // Storage full or blocked: the move runs again next time, and liking an
    // already-liked track is a no-op on the API.
  }
}

const inFlight = new Map<string, Promise<TrackFavoritesMove | null>>();

/** Likes this account's device-local favourite sounds on the account, then
 * drops the ones that worked from local storage. Runs once per account on
 * this device; failures stay local and are retried on later sign-ins up to
 * `MAX_ATTEMPTS`. Resolves to null when there was nothing to do. */
export function moveTrackFavoritesToLikes(
  userId: string,
): Promise<TrackFavoritesMove | null> {
  const running = inFlight.get(userId);
  if (running) {
    return running;
  }
  const run = runMove(userId).finally(() => inFlight.delete(userId));
  inFlight.set(userId, run);
  return run;
}

async function runMove(userId: string): Promise<TrackFavoritesMove | null> {
  const attempts = readAttempts(userId);
  if (attempts === DONE) {
    return null;
  }
  const library = useLibraryStore.getState();
  if (library.scopeKey !== userId) {
    return null;
  }
  const candidates = library.favoriteTracks.flatMap((track) => {
    if (track.kind === 'radio' || track.embed) {
      return [];
    }
    const target = trackLikeTarget(track);
    return target ? [{ id: track.id, target }] : [];
  });
  if (candidates.length === 0) {
    writeFlag(userId, DONE);
    return null;
  }

  const movedIds: string[] = [];
  const setLike = useSoundLikesStore.getState().setLike;
  for (const { id, target } of candidates) {
    const error = await setLike(target.soundId, true, target.channelSlug);
    if (!error) {
      movedIds.push(id);
    }
  }

  // Signed out or switched account mid-move: the library now holds another
  // scope, so removing ids here would touch the wrong favourites.
  if (useLibraryStore.getState().scopeKey !== userId) {
    return null;
  }
  useLibraryStore.getState().removeFavoriteTracks(movedIds);
  if (movedIds.length > 0) {
    useSoundLikesStore.getState().markImported();
  }
  const failed = candidates.length - movedIds.length;
  writeFlag(
    userId,
    failed === 0 || attempts + 1 >= MAX_ATTEMPTS ? DONE : attempts + 1,
  );
  return { moved: movedIds.length, failed };
}

/** Runs the move quietly and tells the listener only when tracks moved. */
export async function moveTrackFavoritesToLikesWithToast(userId: string) {
  const result = await moveTrackFavoritesToLikes(userId);
  if (result && result.moved > 0) {
    toast.success(
      i18n.t('web:toasts.movedSavedTracksToLikes', { count: result.moved }),
    );
  }
  return result;
}
