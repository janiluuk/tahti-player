// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { useLayoutStore } from '../stores/layoutStore';
import { usePlayerStore } from '../stores/playerStore';
import { FullScreenPlayer } from './FullScreenPlayer';

vi.mock('./AddToPlaylistButton', () => ({ AddToPlaylistButton: () => null }));
vi.mock('./ChannelVisualizer', () => ({ ChannelVisualizer: () => null }));
vi.mock('./HearthisEmbedSurface', () => ({ HearthisEmbedSurface: () => null }));
vi.mock('./NowPlayingActionSheet', () => ({
  NowPlayingActionSheet: () => null,
}));
vi.mock('./PlayerSeekBar', () => ({
  ConnectedSeekBar: () => <div>seek bar</div>,
  PlayerLiveIndicator: () => <div>live</div>,
}));

const TRACK: TahtiPlayable = {
  id: 'sound:abc',
  kind: 'sound',
  title: 'Night Drive',
  artist: 'Aino',
  streamUrl: 'https://cdn.example/a.mp3',
  protocol: 'https',
};

async function open(status: 'loading' | 'playing' | 'paused') {
  usePlayerStore.getState().play(TRACK);
  usePlayerStore.setState({ status });
  useLayoutStore.setState({ fullScreenPlayerOpen: true });
  await act(async () => {
    render(<FullScreenPlayer />);
  });
}

describe('FullScreenPlayer buffering', () => {
  beforeEach(() => {
    usePlayerStore.getState().clearQueue();
  });

  afterEach(() => {
    cleanup();
    useLayoutStore.setState({ fullScreenPlayerOpen: false });
    usePlayerStore.getState().clearQueue();
  });

  it('says it is buffering and spins the play button while the stream loads', async () => {
    await open('loading');
    expect(screen.getByRole('status').textContent).toBe('Buffering…');
    expect(screen.getByTestId('player-loading-spinner')).toBeTruthy();
    expect(
      screen.getByTestId('player-pause-button').getAttribute('aria-busy'),
    ).toBe('true');
  });

  it('clears both once audio is playing', async () => {
    await open('loading');
    act(() => {
      usePlayerStore.setState({ status: 'playing' });
    });
    expect(screen.getByRole('status').textContent).toBe('');
    expect(screen.queryByTestId('player-loading-spinner')).toBeNull();
    expect(screen.getByTestId('player-pause-button')).toBeTruthy();
  });

  it('shows neither while paused', async () => {
    await open('paused');
    expect(screen.getByRole('status').textContent).toBe('');
    expect(screen.getByTestId('player-play-button')).toBeTruthy();
  });
});
