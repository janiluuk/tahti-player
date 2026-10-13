import { beforeEach, describe, expect, it } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { usePlayerStore } from './playerStore';

const item = (id: string, kind: TahtiPlayable['kind'] = 'sound') =>
  ({
    id,
    kind,
    title: id,
    artist: 'Artist',
    streamUrl: `https://cdn.example/${id}`,
    protocol: 'https',
  }) as TahtiPlayable;

const CHANNEL = item('live:night-drive', 'live');
const state = () => usePlayerStore.getState();

describe('playerStore autoplay', () => {
  beforeEach(() => {
    state().clearQueue();
    usePlayerStore.setState({
      muted: false,
      autoplayRestoreMuted: null,
      hasPlayed: false,
      volume: 0.85,
    });
  });

  it("starts the channel muted and remembers the mute was not the listener's", () => {
    state().autoplayMuted(CHANNEL);
    expect(state().currentId).toBe('live:night-drive');
    expect(state().status).toBe('loading');
    expect(state().muted).toBe(true);
    expect(state().autoplayRestoreMuted).toBe(false);
    expect(state().hasPlayed).toBe(false);
  });

  it('unmutes on request', () => {
    state().autoplayMuted(CHANNEL);
    state().unmuteAutoplay();
    expect(state().muted).toBe(false);
    expect(state().autoplayRestoreMuted).toBeNull();
    expect(state().hasPlayed).toBe(true);
  });

  it('gives the sound back when the listener starts something themselves', () => {
    state().autoplayMuted(CHANNEL);
    state().play(item('sound:a'));
    expect(state().muted).toBe(false);
    expect(state().autoplayRestoreMuted).toBeNull();
  });

  it('keeps a mute the listener had set before', () => {
    usePlayerStore.setState({ muted: true });
    state().autoplayMuted(CHANNEL);
    expect(state().autoplayRestoreMuted).toBe(true);
    state().play(item('sound:a'));
    expect(state().muted).toBe(true);
  });

  it('treats the mute button and the volume slider as the listener taking over', () => {
    state().autoplayMuted(CHANNEL);
    state().toggleMute();
    expect(state().muted).toBe(false);
    expect(state().autoplayRestoreMuted).toBeNull();

    state().autoplayMuted(item('live:other', 'live'));
    state().setVolume(0.5);
    expect(state().muted).toBe(false);
    expect(state().autoplayRestoreMuted).toBeNull();
  });
});
