import type { PublicChannel, TahtiPlayable } from '../api/types';
import type { PlaybackStatus } from '../stores/playerStore';

export type ChannelAutoplayAction = 'none' | 'muted' | 'fade';

type Input = {
  channel: Pick<PublicChannel, 'autoplayEnabled' | 'state' | 'nowPlaying'>;
  playable: TahtiPlayable | null;
  /** The listener's own switch (Settings, Playback). */
  listenerAllows: boolean;
  player: {
    status: PlaybackStatus;
    currentId: string | null;
    hasPlayed: boolean;
  };
};

/** What opening a channel page should do to the player (PLAT-086).
 *
 * The channel starts on its own only when its artist and the listener both
 * allow it and it has something on air. When something else is playing, the
 * channel fades over it. "Nothing playing" means the player
 * is idle, failed, or holds a queue the listener has not touched this
 * session (one restored from last time, or one that ran to its end). A
 * track the listener paused themselves is left alone. */
export function channelAutoplayAction({
  channel,
  playable,
  listenerAllows,
  player,
}: Input): ChannelAutoplayAction {
  if (!listenerAllows || channel.autoplayEnabled !== true || !playable) {
    return 'none';
  }
  if (channel.state !== 'LIVE' && !channel.nowPlaying) {
    return 'none';
  }
  if (player.currentId === playable.id) {
    return 'none';
  }
  const active = player.status === 'playing' || player.status === 'loading';
  if (active) {
    return 'fade';
  }
  const pausedByListener = player.status === 'paused' && player.hasPlayed;
  return pausedByListener ? 'none' : 'muted';
}
