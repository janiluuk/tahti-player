import type { TahtiPlayable } from '../../api/types';
import { usePlayerStore } from '../../stores/playerStore';
import { McpUserError, type ParamDef } from './types';

export const PLAY_MODES = ['now', 'next', 'end'] as const;
export type PlayMode = (typeof PLAY_MODES)[number];

export const playModeParam: ParamDef = {
  name: 'mode',
  type: 'string',
  description:
    '"now" replaces what is playing (default), "next" inserts after the current item, "end" appends to the queue.',
  optional: true,
  oneOf: PLAY_MODES,
};

/** Starts, inserts or appends playables the way the app's own play buttons do. */
export function playPlayables(
  playables: TahtiPlayable[],
  mode: PlayMode = 'now',
): { queued: number } {
  const [first, ...rest] = playables;
  if (!first) {
    throw new McpUserError('Nothing to play: no playable tracks were found.');
  }
  const player = usePlayerStore.getState();
  if (mode === 'next') {
    return { queued: player.playNextMany(playables) };
  }
  if (mode === 'end') {
    return { queued: player.enqueueMany(playables) };
  }
  player.play(first, { enqueueRest: rest });
  return { queued: playables.length };
}

export function summarizePlayable(item: TahtiPlayable) {
  return {
    id: item.id,
    kind: item.kind,
    title: item.title,
    artist: item.artist,
  };
}
