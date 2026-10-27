// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { usePlayerStore } from '../stores/playerStore';
import { renderWithRouter } from '../test/renderWithRouter';
import { PlayableAmbientTrackList } from './PlayableAmbientTrackList';

const { seekbarRenders } = vi.hoisted(() => ({
  seekbarRenders: [] as { title: string; progress: number }[],
}));

vi.mock('./tahti/WaveformSeekbar', () => ({
  WaveformSeekbar: ({
    label,
    progress,
    onSeek,
  }: {
    label?: string;
    progress: number;
    onSeek?: (fraction: number) => void;
  }) => {
    seekbarRenders.push({ title: label ?? '', progress });
    return (
      <button
        type="button"
        aria-label={`Seek ${label}`}
        onClick={() => onSeek?.(0.5)}
      >
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
