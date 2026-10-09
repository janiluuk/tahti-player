// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { usePlayerStore } from '../stores/playerStore';
import { ConnectedQueuePanel } from './ConnectedQueuePanel';

const track = (id: string): TahtiPlayable => ({
  id: `sound:${id}`,
  kind: 'sound',
  title: `Track ${id}`,
  artist: 'Artist',
  streamUrl: `https://cdn.example/${id}.mp3`,
  protocol: 'https',
});

const stripes = () => document.querySelectorAll('.bg-stripes-diagonal');

describe('ConnectedQueuePanel playback status', () => {
  beforeEach(() => {
    usePlayerStore.getState().clearQueue();
    usePlayerStore.getState().play(track('a'), { enqueueRest: [track('b')] });
  });

  afterEach(() => {
    cleanup();
    usePlayerStore.getState().clearQueue();
  });

  it('marks the current row while its track is loading, and clears it once playing', () => {
    usePlayerStore.setState({ status: 'loading' });
    render(<ConnectedQueuePanel isCollapsed={false} />);
    expect(stripes()).toHaveLength(1);

    act(() => usePlayerStore.setState({ status: 'playing' }));
    expect(stripes()).toHaveLength(0);
  });

  it('shows on the current row that its track could not be played', () => {
    usePlayerStore.setState({ status: 'error', error: 'Playback error' });
    render(<ConnectedQueuePanel isCollapsed={false} />);
    expect(screen.getAllByTestId('queue-item-error')).toHaveLength(1);
  });
});
