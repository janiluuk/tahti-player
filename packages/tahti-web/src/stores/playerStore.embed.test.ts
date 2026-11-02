import { beforeEach, describe, expect, it } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { usePlayerStore } from './playerStore';

const embedTrack: TahtiPlayable = {
  id: 'sound:embed-1',
  kind: 'sound',
  title: 'Embedded set',
  artist: 'Yaniho',
  streamUrl: '',
  protocol: 'https',
  sourceProvider: 'hearthis',
  embed: { provider: 'hearthis', embedUri: 'yaniho/embedded-set' },
};

const audioTrack: TahtiPlayable = {
  id: 'sound:audio-1',
  kind: 'sound',
  title: 'Audio track',
  artist: 'Yaniho',
  streamUrl: 'https://cdn.example/a.mp3',
  protocol: 'https',
  sourceProvider: 'tahti',
};

beforeEach(() => {
  usePlayerStore.getState().clearQueue();
});

describe('embed-only tracks', () => {
  it('never claim to be playing: the provider widget is the transport', () => {
    usePlayerStore.getState().play(embedTrack);
    expect(usePlayerStore.getState().currentId).toBe('sound:embed-1');
    expect(usePlayerStore.getState().status).toBe('paused');
  });

  it('a play request mounts the widget again instead of flipping to playing', () => {
    usePlayerStore.getState().play(embedTrack);
    const before = usePlayerStore.getState().reloadNonce;
    usePlayerStore.getState().setStatus('playing');
    expect(usePlayerStore.getState().status).toBe('paused');
    expect(usePlayerStore.getState().reloadNonce).toBe(before + 1);
    usePlayerStore.getState().setStatus('paused');
    expect(usePlayerStore.getState().reloadNonce).toBe(before + 1);
  });

  it('audio tracks still play through Tahti', () => {
    usePlayerStore.getState().play(audioTrack);
    expect(usePlayerStore.getState().status).toBe('loading');
    usePlayerStore.getState().setStatus('playing');
    expect(usePlayerStore.getState().status).toBe('playing');
  });
});
