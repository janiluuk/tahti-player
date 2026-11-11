import type { TahtiPlayable } from '../api/types';
import { soundIdFromPlayableId } from './soundId';

export type TrackLikeTarget = { soundId: string; channelSlug?: string };

/** The Tahti sound behind a playable, when the like API can take it. */
export function trackLikeTarget(
  playable: Pick<TahtiPlayable, 'id' | 'kind' | 'channelSlug'>,
): TrackLikeTarget | null {
  if (playable.kind !== 'sound') {
    return null;
  }
  const soundId = soundIdFromPlayableId(playable.id);
  if (!soundId) {
    return null;
  }
  // Playables rebuilt from a queue item carry the sound id where the channel
  // slug belongs; the like API then 404s, so the slug gets looked up instead.
  const channelSlug =
    playable.channelSlug && playable.channelSlug !== soundId
      ? playable.channelSlug
      : undefined;
  return { soundId, channelSlug };
}
