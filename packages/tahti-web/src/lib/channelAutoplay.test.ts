import { describe, expect, it } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { channelAutoplayAction } from './channelAutoplay';

const PLAYABLE = { id: 'live:night-drive' } as TahtiPlayable;
const LIVE = { autoplayEnabled: true, state: 'LIVE', nowPlaying: null };
const IDLE = { status: 'idle' as const, currentId: null, hasPlayed: false };

const decide = (over: Partial<Parameters<typeof channelAutoplayAction>[0]>) =>
  channelAutoplayAction({
    channel: LIVE,
    playable: PLAYABLE,
    listenerAllows: true,
    player: IDLE,
    ...over,
  });

describe('channelAutoplayAction', () => {
  it('starts a live channel muted when nothing is playing', () => {
    expect(decide({})).toBe('muted');
  });

  it('needs the artist, the listener and something on air', () => {
    expect(decide({ listenerAllows: false })).toBe('none');
    expect(decide({ channel: { ...LIVE, autoplayEnabled: false } })).toBe(
      'none',
    );
    expect(decide({ channel: { ...LIVE, autoplayEnabled: undefined } })).toBe(
      'none',
    );
    expect(decide({ playable: null })).toBe('none');
    expect(decide({ channel: { ...LIVE, state: 'OFFLINE' } })).toBe('none');
  });

  it('starts an offline channel that has a rotation on air', () => {
    const channel = {
      autoplayEnabled: true,
      state: 'OFFLINE',
      nowPlaying: { title: 'Rotation' },
    } as never;
    expect(decide({ channel })).toBe('muted');
  });

  it('counts a restored or failed player as nothing playing', () => {
    expect(
      decide({
        player: { status: 'paused', currentId: 'sound:a', hasPlayed: false },
      }),
    ).toBe('muted');
    expect(
      decide({
        player: { status: 'error', currentId: 'sound:a', hasPlayed: true },
      }),
    ).toBe('muted');
  });

  it('leaves alone what the listener paused, is playing, or already has on', () => {
    expect(
      decide({
        player: { status: 'paused', currentId: 'sound:a', hasPlayed: true },
      }),
    ).toBe('none');
    expect(
      decide({
        player: { status: 'playing', currentId: 'sound:a', hasPlayed: true },
      }),
    ).toBe('none');
    expect(
      decide({
        player: { status: 'paused', currentId: PLAYABLE.id, hasPlayed: false },
      }),
    ).toBe('none');
  });
});
