// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { useAuthStore } from '../stores/authStore';
import { usePlayerStore } from '../stores/playerStore';
import { renderWithRouter } from '../test/renderWithRouter';
import { PlayableAmbientTrackList } from './PlayableAmbientTrackList';

const { seekbarRenders } = vi.hoisted(() => ({
  seekbarRenders: [] as { title: string; progress: number }[],
}));

vi.mock('@tahti-player/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tahti-player/ui')>()),
  Waveform: ({
    'aria-label': label,
    progress,
    onSeek,
  }: {
    'aria-label'?: string;
    progress: number;
    onSeek?: (fraction: number) => void;
  }) => {
    seekbarRenders.push({
      title: label?.replace(/^Seek /, '') ?? '',
      progress,
    });
    return (
      <button type="button" aria-label={label} onClick={() => onSeek?.(0.5)}>
        {progress.toFixed(2)}
      </button>
    );
  },
}));

const ROWS = 20;
const items: TahtiPlayable[] = Array.from({ length: ROWS }, (_, index) => ({
  id: `sound:s${index}`,
  kind: 'sound',
  title: `Track ${index}`,
  artist: 'Artist',
  streamUrl: `https://cdn.example/${index}.mp3`,
  protocol: 'https',
  durationSec: 200,
  peaks: [10, 20, 30],
}));

beforeEach(() => {
  localStorage.clear();
  seekbarRenders.length = 0;
  usePlayerStore.getState().clearQueue();
});

afterEach(() => {
  cleanup();
  usePlayerStore.getState().clearQueue();
});

describe('PlayableAmbientTrackList during playback', () => {
  it('redraws only the playing row on a progress tick', async () => {
    usePlayerStore.getState().play(items[3]!);
    await renderWithRouter(<PlayableAmbientTrackList items={items} />);
    act(() => usePlayerStore.getState().setProgress(10, 200));
    seekbarRenders.length = 0;

    act(() => usePlayerStore.getState().setProgress(11, 200));

    expect(seekbarRenders).toEqual([{ title: 'Track 3', progress: 11 / 200 }]);
  });

  it('seeks the playing row and leaves the others at the start', async () => {
    usePlayerStore.getState().play(items[3]!);
    await renderWithRouter(<PlayableAmbientTrackList items={items} />);
    act(() => usePlayerStore.getState().setProgress(50, 200));

    expect(
      screen.getByRole('button', { name: 'Seek Track 3' }).textContent,
    ).toBe('0.25');
    expect(
      screen.getByRole('button', { name: 'Seek Track 4' }).textContent,
    ).toBe('0.00');

    fireEvent.click(screen.getByRole('button', { name: 'Seek Track 3' }));
    expect(usePlayerStore.getState().seekTarget).toBe(100);
  });
});

describe('PlayableAmbientTrackList row actions', () => {
  afterEach(() => {
    cleanup();
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
  });

  it('offers Add to playlist to a signed-in listener and opens the picker', async () => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        email: 'listener@tahti.live',
        username: 'listener',
        displayName: 'Listener',
        role: 'LISTENER',
        isBoard: false,
        isMember: false,
      },
      hydrated: true,
      loading: false,
    });
    await renderWithRouter(
      <PlayableAmbientTrackList items={items.slice(0, 2)} />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Add Track 0 to a playlist' }),
    );
    expect(await screen.findByText('Add to playlist')).toBeTruthy();
  });

  it('does not offer it signed out', async () => {
    await renderWithRouter(
      <PlayableAmbientTrackList items={items.slice(0, 2)} />,
    );
    expect(
      screen.queryByRole('button', { name: 'Add Track 0 to a playlist' }),
    ).toBeNull();
  });
});
